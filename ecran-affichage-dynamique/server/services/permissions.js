export const ROLES = ['Macao', 'Coworker', 'Freelance']

// Champs réservés à l'équipe Macao : ils ne quittent jamais le serveur
// pour un autre rôle.
const CHAMPS_INTERNES = ['score', 'notesInternes', 'referent']

export function filterOpportunityForRole(opp, role) {
  if (!ROLES.includes(role)) return null
  if (role === 'Macao') return opp

  const copie = { ...opp }
  for (const champ of CHAMPS_INTERNES) delete copie[champ]
  return copie
}

const ACCES = {
  admin: ['Macao'],
  opportunities: ['Macao', 'Coworker', 'Freelance'],
  directory: ['Macao', 'Coworker', 'Freelance'],
  profile: ['Macao', 'Coworker', 'Freelance']
}

export function canAccess(role, ressource) {
  return (ACCES[ressource] || []).includes(role)
}
