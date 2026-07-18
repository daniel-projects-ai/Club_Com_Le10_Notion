import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const SECRET = process.env.JWT_SECRET
// Deux "audiences" distinctes : un jeton de connexion ne doit jamais
// pouvoir être rejoué comme un jeton de session.
const AUD_MAGIC = 'magic'
const AUD_SESSION = 'session'

function payloadOf(user) {
  return { id: user.id, email: user.email, role: user.role }
}

// Le jeton porte un identifiant unique (jti) pour que la route /verify puisse
// le marquer comme consommé : c'est ce qui rend le lien réellement à usage
// unique, comme l'annoncent l'email et l'écran de connexion.
export function signMagicToken(user, expiresInMinutes = 15) {
  return jwt.sign({ ...payloadOf(user), aud: AUD_MAGIC, jti: crypto.randomUUID() }, SECRET, {
    expiresIn: `${expiresInMinutes}m`
  })
}

export function verifyMagicToken(token) {
  try {
    const d = jwt.verify(token, SECRET, { audience: AUD_MAGIC })
    return { id: d.id, email: d.email, role: d.role, jti: d.jti }
  } catch {
    return null
  }
}

// 7 jours et pas davantage : le rôle et le statut du coworker sont figés dans
// le jeton, jamais relus côté serveur. Plus la session est longue, plus une
// révocation (passage à « Inactif », changement de rôle) met de temps à
// prendre effet. Sept jours borne ce délai sans forcer une reconnexion
// quotidienne.
export function signSession(user, expiresInDays = 7) {
  return jwt.sign({ ...payloadOf(user), aud: AUD_SESSION }, SECRET, {
    expiresIn: `${expiresInDays}d`
  })
}

export function verifySession(token) {
  try {
    const d = jwt.verify(token, SECRET, { audience: AUD_SESSION })
    return { id: d.id, email: d.email, role: d.role }
  } catch {
    return null
  }
}
