// Adresse du backend : local en développement, Railway en production.
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5001'
  : 'https://clubcomle10notion-production.up.railway.app'

// `credentials: include` est indispensable : la session vit dans un cookie.
async function appel(chemin, options = {}) {
  const res = await fetch(`${API_URL}/api/intranet${chemin}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (res.status === 401) throw new Error('NON_AUTHENTIFIE')
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
