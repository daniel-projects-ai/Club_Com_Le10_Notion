// Fonctions pures du journal des échanges : aucune I/O, donc testables sans
// réseau. C'est ici que vivent les règles de démarchage et le classement des
// relances. L'I/O vit dans interactionsClient.js.

import { joursAvantEcheance } from './dossiers.js'

// Listes fermées des valeurs acceptées à l'écriture, calquées sur les single
// selects Airtable. Airtable est appelé avec `typecast: true` : sans ce garde,
// une valeur inconnue ne serait pas rejetée mais *ajoutée* comme nouvelle
// option, polluant le schéma. Même motif que validerChampsDossier.
export const CANAUX = ['Email', 'Appel', 'SMS', 'WhatsApp', 'Visioconférence', 'Rendez-vous', 'LinkedIn', 'Courrier', 'Formulaire du site', 'Autre']
export const SENS = ['Sortant', 'Entrant']
export const STATUTS_TACHE = ['À faire', 'Faite', 'Annulée']
// Les single selects « Auteur » et « Responsable » ne listent que l'équipe
// Macao. Un nom hors liste créerait une option : on filtre avant d'écrire.
export const AUTEURS = ['Daniel', 'Dominique', 'Mathieu']

// Canaux exigeant un accord préalable et explicite. L'email B2B repose sur
// l'intérêt légitime ; SMS et WhatsApp, non : l'absence de réponse ne vaut
// pas consentement.
const CANAUX_A_CONSENTEMENT = ['SMS', 'WhatsApp']

// LinkedIn n'est jamais automatisable : la plateforme interdit l'automatisation
// et restreint les comptes qui s'y risquent. Interdit même avec consentement.
const CANAUX_INTERDITS = ['LinkedIn']

const JOURS_FENETRE = 7

// Un interlocuteur peut-il être démarché sur ce canal ? Règle de conformité,
// pas de confort : dans le doute, on répond non.
export function peutEtreDemarche(interlocuteur, canal) {
  // Un interlocuteur inconnu n'a jamais donné son accord.
  if (!interlocuteur) return false
  // L'opposition prime sur tout, y compris un consentement antérieur : se
  // désinscrire doit couper tous les canaux d'un coup, sans exception.
  if (interlocuteur.opposition === true) return false
  if (CANAUX_INTERDITS.includes(canal)) return false
  if (CANAUX_A_CONSENTEMENT.includes(canal)) {
    return interlocuteur.consentementSmsWhatsapp === 'Accordé'
  }
  return true
}

// Tri par échéance croissante. Une tâche sans échéance passe en dernier :
// elle n'a pas de position naturelle dans une file chronologique.
function parEcheance(a, b) {
  if (!a.echeance) return b.echeance ? 1 : 0
  if (!b.echeance) return -1
  return a.echeance < b.echeance ? -1 : a.echeance > b.echeance ? 1 : 0
}

// Range les relances en trois paniers d'action. On compare des JOURNÉES
// locales via joursAvantEcheance (cf. dossiers.js) et jamais des instants :
// `new Date('2026-07-20')` vaut minuit UTC, donc une échéance du jour
// paraîtrait dépassée dès 2 h du matin à Paris.
export function classerRelances(taches = [], maintenant = new Date()) {
  const enRetard = []
  const cetteSemaine = []
  const plusTard = []

  for (const tache of taches || []) {
    // Une tâche close n'est plus une relance : ni retard, ni rappel.
    if (tache?.statut !== 'À faire') continue

    const jours = joursAvantEcheance(tache.echeance, maintenant)
    // Sans échéance exploitable, la tâche existe mais n'est due nulle part :
    // « plus tard » plutôt qu'un faux retard qui crierait au loup.
    if (jours === null) plusTard.push(tache)
    else if (jours < 0) enRetard.push(tache)
    else if (jours <= JOURS_FENETRE) cetteSemaine.push(tache)
    else plusTard.push(tache)
  }

  return {
    enRetard: enRetard.sort(parEcheance),
    cetteSemaine: cetteSemaine.sort(parEcheance),
    plusTard: plusTard.sort(parEcheance)
  }
}

// Libellé d'affichage de l'interaction, généré à la création. Chaque partie
// manquante est simplement omise plutôt que de laisser un séparateur orphelin.
export function referenceInteraction(interaction = {}, nomOrganisation = null) {
  const parties = [interaction?.date, interaction?.canal, nomOrganisation].filter(Boolean)
  return parties.length ? parties.join(' · ') : 'Échange'
}

export default { peutEtreDemarche, classerRelances, referenceInteraction }
