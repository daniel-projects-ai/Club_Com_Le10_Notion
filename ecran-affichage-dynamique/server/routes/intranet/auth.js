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

// Limitation simple en mémoire, sur deux axes :
//  - 5 demandes par email et par heure (protège une boîte donnée du spam) ;
//  - 20 demandes par IP et par heure (empêche un script de boucler sur des
//    adresses inventées, ce qui contournerait la limite par email).
// Les clés dont la liste se vide sont supprimées : sans ça, chaque email
// inédit laisserait une entrée définitive et ferait enfler la mémoire du
// process — qui héberge aussi l'Écran TV.
const FENETRE_MS = 3600_000
const MAX_PAR_EMAIL = 5
const MAX_PAR_IP = 20

const demandesParEmail = new Map()
const demandesParIp = new Map()

function tropDeDemandesSur(registre, cle, maximum) {
  const maintenant = Date.now()
  const recentes = (registre.get(cle) || []).filter(t => maintenant - t < FENETRE_MS)
  if (recentes.length >= maximum) {
    registre.set(cle, recentes)
    return true
  }
  recentes.push(maintenant)
  registre.set(cle, recentes)
  return false
}

// Purge globale : on retire les clés dont toutes les entrées ont expiré.
function purger(registre) {
  const maintenant = Date.now()
  for (const [cle, dates] of registre) {
    const recentes = dates.filter(t => maintenant - t < FENETRE_MS)
    if (recentes.length === 0) registre.delete(cle)
    else registre.set(cle, recentes)
  }
}

function tropDeDemandes(email, ip) {
  purger(demandesParEmail)
  purger(demandesParIp)
  // Les deux limites sont évaluées : l'IP d'abord, pour qu'un script bouclant
  // sur des adresses inventées soit stoppé même si chaque email est inédit.
  const ipSaturee = tropDeDemandesSur(demandesParIp, ip || 'inconnue', MAX_PAR_IP)
  const emailSature = tropDeDemandesSur(demandesParEmail, email, MAX_PAR_EMAIL)
  return ipSaturee || emailSature
}

// POST /api/intranet/auth/request-link
router.post('/request-link', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  // Réponse volontairement identique dans tous les cas : on ne révèle jamais
  // si un compte existe.
  const reponseNeutre = { message: 'Si ce compte existe, un lien vient d\'être envoyé.' }

  if (!email || tropDeDemandes(email, req.ip)) return res.json(reponseNeutre)

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
    // Aligné sur la durée du jeton de session (voir signSession) : borne le
    // délai de révocation d'un compte désactivé.
    maxAge: 7 * 24 * 3600 * 1000
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
