// Fonctions pures du CRM : aucune I/O, donc testables sans réseau.

import { ROLES } from './permissions.js'

// Un dossier n'est « déposé » qu'une fois réellement transmis à l'acheteur.
const DEPOTS_EFFECTUES = ['Déposé', 'Accusé reçu']

// Convention du projet : une valeur absente s'affiche « — », jamais « 0 ».
function ouNull(n) {
  return n > 0 ? n : null
}

export function calculerHistorique(opportunites = [], dossiers = []) {
  const opps = opportunites || []
  const doss = dossiers || []
  const echeances = opps.map(o => o.deadline).filter(Boolean).sort()

  return {
    nbOpportunites: ouNull(opps.length),
    nbDossiersDeposes: ouNull(doss.filter(d => DEPOTS_EFFECTUES.includes(d.depot)).length),
    nbGagnes: ouNull(opps.filter(o => o.status === 'Gagné').length),
    nbPerdus: ouNull(opps.filter(o => o.status === 'Perdu').length),
    derniereOpportunite: echeances.length ? echeances[echeances.length - 1] : null
  }
}

// Le CRM est réservé à Macao : relation commerciale, notes et coordonnées
// d'interlocuteurs n'ont pas à sortir de l'agence.
export function filterOrganisationForRole(organisation, role) {
  if (!ROLES.includes(role)) return null
  if (role !== 'Macao') return null
  return organisation
}
