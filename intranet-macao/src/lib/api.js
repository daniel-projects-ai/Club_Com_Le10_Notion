// Adresse du backend : local en développement, Railway en production.
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5001'
  : 'https://clubcomle10notion-production.up.railway.app'

// Callback global déclenché dès qu'une réponse 401 arrive : l'application
// s'en sert pour vider l'utilisateur courant et laisser la garde de routage
// rediriger vers la connexion, plutôt que d'afficher « NON_AUTHENTIFIE ».
let surSessionExpireeCb = null

export function surSessionExpiree(cb) {
  surSessionExpireeCb = cb
}

// `credentials: include` est indispensable : la session vit dans un cookie.
async function appel(chemin, options = {}) {
  const res = await fetch(`${API_URL}/api/intranet${chemin}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (res.status === 401) {
    surSessionExpireeCb?.()
    throw new Error('NON_AUTHENTIFIE')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur')
  return data
}

export const api = {
  demanderLien: (email) => appel('/auth/request-link', { method: 'POST', body: JSON.stringify({ email }) }),
  verifier: (token) => appel(`/auth/verify?token=${encodeURIComponent(token)}`),
  moi: () => appel('/auth/me'),
  deconnexion: () => appel('/auth/logout', { method: 'POST' }),
  tableauDeBord: () => appel('/dashboard'),
  opportunites: () => appel('/opportunities'),
  annuaire: () => appel('/directory'),
  profil: () => appel('/profile')
}
