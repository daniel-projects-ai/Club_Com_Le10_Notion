// Fonctions pures du module Dossiers de réponse : aucune I/O, donc testables
// sans réseau. C'est ici que vivent les règles métier.

import { ROLES } from './permissions.js'

// Un chantier « non demandé » par l'acheteur est considéré comme réglé.
const MEMOIRE_OK = ['Finalisé', 'Non demandé']
const OFFRE_OK = ['Validée', 'Non demandée']

const JOURS_ALERTE = 7

// Listes fermées des valeurs acceptées à l'écriture. Airtable est appelé avec
// `typecast: true` : sans ce garde, une valeur inconnue ne serait pas rejetée
// mais *ajoutée* comme nouvelle option du single select, polluant le schéma.
export const ETATS_MEMOIRE = ['Non commencé', 'Plan créé', 'V1 rédigée', 'En relecture', 'Finalisé', 'Non demandé']
export const ETATS_OFFRE = ['Non commencée', 'En cours', 'À valider', 'Validée', 'Non demandée']
export const ETATS_DEPOT = ['Non préparé', 'Plateforme identifiée', 'Compte à vérifier', 'En cours', 'Déposé', 'Accusé reçu']
export const STATUTS_DOSSIER = ['À créer', 'En préparation', 'Pièces admin en cours', 'Mémoire en cours', 'Offre financière en cours', 'Relecture finale', 'Prêt à déposer', 'Déposé', 'Gagné', 'Perdu', 'Abandonné']
export const PIECES = ['Kbis', 'RIB', 'Attestation URSSAF', 'Attestation fiscale', 'Assurance RC Pro', 'DC1', 'DC2', 'Acte d’engagement', 'Mémoire technique', 'Offre financière']

// Champs qu'un non-Macao a le droit de voir. Liste blanche assumée : tout
// champ ajouté demain reste invisible tant qu'il n'est pas listé ici.
const CHAMPS_PUBLICS = [
  'id', 'nom', 'statut', 'responsable', 'modeReponse',
  'piecesDemandees', 'piecesFournies', 'piecesManquantes', 'bloque',
  'memoire', 'offre', 'dateLimite', 'depot', 'dateDepot',
  'drive', 'resultat', 'equipeIds', 'opportuniteIds', 'acheteur', 'equipe'
]

export function piecesManquantes(dossier) {
  const demandees = dossier?.piecesDemandees || []
  const fournies = dossier?.piecesFournies || []
  return demandees.filter(p => !fournies.includes(p))
}

// Ramène un instant (ou une date Airtable « AAAA-MM-JJ ») au début de sa
// journée locale. Sans cela, `new Date('2026-07-19')` vaut minuit UTC : une
// échéance du jour paraîtrait dépassée dès 2 h du matin à Paris.
function debutDeJour(valeur) {
  if (valeur instanceof Date) {
    const d = new Date(valeur.getTime())
    d.setHours(0, 0, 0, 0)
    return d
  }
  const texte = String(valeur)
  const jourSeul = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texte)
  if (jourSeul) return new Date(Number(jourSeul[1]), Number(jourSeul[2]) - 1, Number(jourSeul[3]))
  const d = new Date(texte)
  if (Number.isNaN(d.getTime())) return d
  d.setHours(0, 0, 0, 0)
  return d
}

// Nombre de journées entières entre la date de référence et l'échéance.
// 0 = échéance aujourd'hui, donc toujours dans la fenêtre d'alerte.
export function joursAvantEcheance(dateLimite, maintenant = new Date()) {
  if (!dateLimite) return null
  const limite = debutDeJour(dateLimite)
  if (Number.isNaN(limite.getTime())) return null
  return Math.round((limite - debutDeJour(maintenant)) / 86400000)
}

// Un dossier est « bloqué » si l'échéance approche ET qu'un chantier n'est pas
// prêt. C'est le seul indicateur qui justifie d'ouvrir l'intranet le matin.
export function estBloque(dossier, maintenant = new Date()) {
  const joursRestants = joursAvantEcheance(dossier?.dateLimite, maintenant)
  if (joursRestants === null) return false
  if (joursRestants < 0 || joursRestants > JOURS_ALERTE) return false

  if (piecesManquantes(dossier).length > 0) return true
  if (!MEMOIRE_OK.includes(dossier.memoire)) return true
  if (!OFFRE_OK.includes(dossier.offre)) return true
  return false
}

// Valide les champs d'une mise à jour contre les listes fermées, avant tout
// appel réseau. Renvoie un message d'erreur, ou null si tout est conforme.
export function validerChampsDossier(corps = {}) {
  const listes = {
    memoire: ETATS_MEMOIRE,
    offre: ETATS_OFFRE,
    depot: ETATS_DEPOT,
    statut: STATUTS_DOSSIER
  }

  for (const [cle, valeurs] of Object.entries(listes)) {
    const v = corps[cle]
    if (v === undefined) continue
    if (!valeurs.includes(v)) return `Valeur invalide pour ${cle} : ${v}`
  }

  const pieces = corps.piecesFournies
  if (pieces !== undefined) {
    // Le tableau vide est légitime : il sert à tout décocher.
    if (!Array.isArray(pieces)) return 'piecesFournies doit être un tableau'
    for (const p of pieces) {
      if (!PIECES.includes(p)) return `Pièce inconnue : ${p}`
    }
  }

  return null
}

export function filterDossierForRole(dossier, role) {
  if (!ROLES.includes(role)) return null
  if (role === 'Macao') return dossier

  const copie = {}
  for (const champ of CHAMPS_PUBLICS) {
    if (dossier?.[champ] !== undefined) copie[champ] = dossier[champ]
  }
  return copie
}
