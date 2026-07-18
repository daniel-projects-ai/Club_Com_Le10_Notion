import express from 'express'
import { findCoworkerByEmail } from '../../services/coworkersClient.js'
import { signMagicToken, verifyMagicToken, signSession } from '../../services/auth.js'
import { sendMagicLink } from '../../services/mailer.js'
import { requireAuth, COOKIE_NAME } from '../../middleware/requireAuth.js'

const router = express.Router()
const INTRANET_URL = process.env.INTRANET_URL || 'http://localhost:3001'

// Front et API vivent sur deux domaines distincts (Vercel / Railway) : le
// cookie doit être SameSite=None, ce qui impose Secure. En local, tout est
// sur localhost, donc Lax suffit et Secure casserait le HTTP.
const EN_PRODUCTION = process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_ENVIRONMENT)

// Attributs partagés entre res.cookie et res.clearCookie : s'ils diffèrent,
// le navigateur ne supprime pas le cookie posé à la connexion.
const OPTIONS_COOKIE = {
  httpOnly: true,
  secure: EN_PRODUCTION,
  sameSite: EN_PRODUCTION ? 'none' : 'lax'
}

// Limitation simple en mémoire : 5 demandes par email et par heure.
const demandes = new Map()
function tropDeDemandes(email) {
  const maintenant = Date.now()
  const recentes = (demandes.get(email) || []).filter(t => maintenant - t < 3600_000)
  if (recentes.length >= 5) return true
  recentes.push(maintenant)
  demandes.set(email, recentes)
  return false
}

// POST /api/intranet/auth/request-link
router.post('/request-link', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  // Réponse volontairement identique dans tous les cas : on ne révèle jamais
  // si un compte existe.
  const reponseNeutre = { message: 'Si ce compte existe, un lien vient d\'être envoyé.' }

  if (!email || tropDeDemandes(email)) return res.json(reponseNeutre)

  try {
    const cw = await findCoworkerByEmail(email)
    if (cw) {
      const token = signMagicToken({ id: cw.id, email: cw.email, role: cw.role })
      const lien = `${INTRANET_URL}/verify?token=${encodeURIComponent(token)}`
      await sendMagicLink(cw.email, lien, cw.nom.split(' ')[0])
    }
  } catch (err) {
    console.error('❌ request-link:', err.message)
  }
  res.json(reponseNeutre)
})

// Jetons magiques déjà consommés : jti → date de consommation.
// Un lien transféré, ou pré-visité par un antivirus de messagerie, ne doit pas
// pouvoir ouvrir une seconde session. Au-delà de la durée de vie du jeton
// (15 min), la signature suffit à le rejeter : on purge donc les entrées pour
// éviter que la Map ne grossisse indéfiniment.
const VALIDITE_LIEN_MS = 15 * 60 * 1000
const jetonsConsommes = new Map()

function dejaConsomme(jti) {
  const maintenant = Date.now()
  for (const [cle, date] of jetonsConsommes) {
    if (maintenant - date > VALIDITE_LIEN_MS) jetonsConsommes.delete(cle)
  }
  if (jetonsConsommes.has(jti)) return true
  jetonsConsommes.set(jti, maintenant)
  return false
}

// GET /api/intranet/auth/verify?token=...
router.get('/verify', (req, res) => {
  const jeton = verifyMagicToken(req.query.token)
  if (!jeton) return res.status(401).json({ error: 'Lien invalide ou expiré' })

  // Un jeton sans jti (ancien format) est refusé : on ne sait pas le tracer.
  if (!jeton.jti || dejaConsomme(jeton.jti)) {
    return res.status(401).json({ error: 'Lien déjà utilisé ou expiré' })
  }

  const { jti, ...user } = jeton

  res.cookie(COOKIE_NAME, signSession(user), {
    ...OPTIONS_COOKIE,
    maxAge: 30 * 24 * 3600 * 1000
  })
  res.json({ user })
})

// GET /api/intranet/auth/me
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }))

// POST /api/intranet/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, OPTIONS_COOKIE)
  res.json({ ok: true })
})

export default router
