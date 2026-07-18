import { verifySession } from '../services/auth.js'

export const COOKIE_NAME = 'macao_session'

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME]
  const user = token ? verifySession(token) : null
  if (!user) {
    return res.status(401).json({ error: 'Session requise' })
  }
  req.user = user
  next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' })
    }
    next()
  }
}
