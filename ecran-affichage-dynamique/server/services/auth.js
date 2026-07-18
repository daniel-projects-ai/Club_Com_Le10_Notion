import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET
// Deux "audiences" distinctes : un jeton de connexion ne doit jamais
// pouvoir être rejoué comme un jeton de session.
const AUD_MAGIC = 'magic'
const AUD_SESSION = 'session'

function payloadOf(user) {
  return { id: user.id, email: user.email, role: user.role }
}

export function signMagicToken(user, expiresInMinutes = 15) {
  return jwt.sign({ ...payloadOf(user), aud: AUD_MAGIC }, SECRET, {
    expiresIn: `${expiresInMinutes}m`
  })
}

export function verifyMagicToken(token) {
  try {
    const d = jwt.verify(token, SECRET, { audience: AUD_MAGIC })
    return { id: d.id, email: d.email, role: d.role }
  } catch {
    return null
  }
}

export function signSession(user, expiresInDays = 30) {
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
