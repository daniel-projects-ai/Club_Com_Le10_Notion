// Fonctions pures du module Dossiers de réponse : aucune I/O, donc testables
// sans réseau. C'est ici que vivent les règles métier.

import { ROLES } from './permissions.js'

// Données commerciales réservées à Macao : elles ne quittent jamais le serveur
// pour un coworker mobilisé sur le dossier.
const CHAMPS_INTERNES = ['montantPropose', 'notesInternes', 'retoursAcheteur', 'niveauRisque']

// Un chantier « non demandé » par l'acheteur est considéré comme réglé.
const MEMOIRE_OK = ['Finalisé', 'Non demandé']
const OFFRE_OK = ['Validée', 'Non demandée']

const JOURS_ALERTE = 7

export function piecesManquantes(dossier) {
  const demandees = dossier?.piecesDemandees || []
  const fournies = dossier?.piecesFournies || []
  return demandees.filter(p => !fournies.includes(p))
}

// Un dossier est « bloqué » si l'échéance approche ET qu'un chantier n'est pas
// prêt. C'est le seul indicateur qui justifie d'ouvrir l'intranet le matin.
export function estBloque(dossier, maintenant = new Date()) {
  if (!dossier?.dateLimite) return false

  const limite = new Date(dossier.dateLimite)
  if (Number.isNaN(limite.getTime())) return false

  const joursRestants = (limite - maintenant) / 86400000
  if (joursRestants < 0 || joursRestants > JOURS_ALERTE) return false

  if (piecesManquantes(dossier).length > 0) return true
  if (!MEMOIRE_OK.includes(dossier.memoire)) return true
  if (!OFFRE_OK.includes(dossier.offre)) return true
  return false
}

export function filterDossierForRole(dossier, role) {
  if (!ROLES.includes(role)) return null
  if (role === 'Macao') return dossier

  const copie = { ...dossier }
  for (const champ of CHAMPS_INTERNES) delete copie[champ]
  return copie
}
