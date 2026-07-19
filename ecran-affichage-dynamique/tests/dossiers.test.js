import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  piecesManquantes,
  estBloque,
  filterDossierForRole,
  validerChampsDossier
} from '../server/services/dossiers.js'

// Date locale au format Airtable « AAAA-MM-JJ », décalée de n jours.
function jourRelatif(n) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const base = {
  id: 'recD1',
  nom: 'Refonte site — Grand Villeneuvois',
  statut: 'En préparation',
  piecesDemandees: ['Kbis', 'RIB', 'DC1'],
  piecesFournies: ['Kbis'],
  memoire: 'V1 rédigée',
  offre: 'En cours',
  dateLimite: '2026-08-01',
  depot: 'Non préparé',
  montantPropose: 30000,
  notesInternes: 'Contact au service achats',
  retoursAcheteur: 'Ils veulent plus de références',
  niveauRisque: 'Moyen'
}

test('les pièces manquantes sont les demandées non fournies', () => {
  assert.deepEqual(piecesManquantes(base), ['RIB', 'DC1'])
})

test('aucune pièce manquante quand tout est fourni', () => {
  assert.deepEqual(
    piecesManquantes({ piecesDemandees: ['Kbis'], piecesFournies: ['Kbis', 'RIB'] }),
    []
  )
})

test('aucune pièce demandée donne une liste vide', () => {
  assert.deepEqual(piecesManquantes({}), [])
})

test('un dossier dont l\'échéance est lointaine n\'est jamais bloqué', () => {
  assert.equal(estBloque({ ...base, dateLimite: '2026-12-31' }, new Date('2026-07-19')), false)
})

test('échéance proche et pièce manquante bloque', () => {
  assert.equal(estBloque({ ...base, dateLimite: '2026-07-22' }, new Date('2026-07-19')), true)
})

test('échéance proche mais tout est prêt ne bloque pas', () => {
  const pret = {
    ...base,
    dateLimite: '2026-07-22',
    piecesFournies: ['Kbis', 'RIB', 'DC1'],
    memoire: 'Finalisé',
    offre: 'Validée'
  }
  assert.equal(estBloque(pret, new Date('2026-07-19')), false)
})

test('un mémoire non demandé ne bloque pas', () => {
  const pret = {
    ...base,
    dateLimite: '2026-07-22',
    piecesFournies: ['Kbis', 'RIB', 'DC1'],
    memoire: 'Non demandé',
    offre: 'Non demandée'
  }
  assert.equal(estBloque(pret, new Date('2026-07-19')), false)
})

test('un dossier sans date limite n\'est pas bloqué', () => {
  assert.equal(estBloque({ ...base, dateLimite: null }, new Date('2026-07-19')), false)
})

test('Macao voit les données commerciales', () => {
  const r = filterDossierForRole(base, 'Macao')
  assert.equal(r.montantPropose, 30000)
  assert.equal(r.notesInternes, 'Contact au service achats')
  assert.equal(r.retoursAcheteur, 'Ils veulent plus de références')
  assert.equal(r.niveauRisque, 'Moyen')
})

// Décalage de fuseau : `new Date('AAAA-MM-JJ')` vaut minuit UTC. Comparé à un
// instant local, un dossier dû aujourd'hui paraissait déjà dépassé le matin.
test('une échéance à aujourd\'hui bloque encore', () => {
  assert.equal(estBloque({ ...base, dateLimite: jourRelatif(0) }), true)
})

test('une échéance dépassée ne bloque plus', () => {
  assert.equal(estBloque({ ...base, dateLimite: jourRelatif(-1) }), false)
})

test('une échéance à exactement 7 jours est dans la fenêtre d\'alerte', () => {
  assert.equal(estBloque({ ...base, dateLimite: jourRelatif(7) }), true)
})

test('une échéance à 8 jours est hors fenêtre', () => {
  assert.equal(estBloque({ ...base, dateLimite: jourRelatif(8) }), false)
})

test('une heure tardive ne fait pas sortir l\'échéance du jour de la fenêtre', () => {
  const soir = new Date(2026, 6, 19, 23, 30)
  assert.equal(estBloque({ ...base, dateLimite: '2026-07-19' }, soir), true)
})

test('une valeur hors liste est refusée', () => {
  assert.match(validerChampsDossier({ memoire: 'Inventé' }), /Valeur invalide pour memoire/)
  assert.match(validerChampsDossier({ offre: 'Presque' }), /Valeur invalide pour offre/)
  assert.match(validerChampsDossier({ depot: 'Envoyé' }), /Valeur invalide pour depot/)
  assert.match(validerChampsDossier({ statut: 'Nouveau' }), /Valeur invalide pour statut/)
})

test('les valeurs des listes fermées sont acceptées', () => {
  assert.equal(
    validerChampsDossier({ memoire: 'Finalisé', offre: 'Validée', depot: 'Déposé', statut: 'Prêt à déposer' }),
    null
  )
})

test('chaque pièce fournie est validée, le tableau vide est légitime', () => {
  assert.equal(validerChampsDossier({ piecesFournies: [] }), null)
  assert.equal(validerChampsDossier({ piecesFournies: ['Kbis', 'Acte d’engagement'] }), null)
  assert.match(validerChampsDossier({ piecesFournies: ['Kbis', 'Faux'] }), /Pièce inconnue : Faux/)
  assert.match(validerChampsDossier({ piecesFournies: 'Kbis' }), /doit être un tableau/)
})

test('un corps sans champ contrôlé ne déclenche aucune erreur', () => {
  assert.equal(validerChampsDossier({}), null)
})

test('un Coworker ne reçoit ni montant, ni notes, ni retours, ni risque', () => {
  const r = filterDossierForRole(base, 'Coworker')
  assert.equal(r.montantPropose, undefined)
  assert.equal(r.notesInternes, undefined)
  assert.equal(r.retoursAcheteur, undefined)
  assert.equal(r.niveauRisque, undefined)
  assert.equal(r.nom, 'Refonte site — Grand Villeneuvois')
  assert.deepEqual(r.piecesDemandees, ['Kbis', 'RIB', 'DC1'])
})

test('un Freelance est traité comme un Coworker', () => {
  assert.deepEqual(
    filterDossierForRole(base, 'Freelance'),
    filterDossierForRole(base, 'Coworker')
  )
})

// Liste blanche : un champ ajouté demain ne doit pas fuiter par défaut.
test('un champ non listé n\'atteint pas un Coworker', () => {
  const r = filterDossierForRole(
    { ...base, nouveauChampSensible: 'marge nette', checklist: 'interne' },
    'Coworker'
  )
  assert.equal(r.nouveauChampSensible, undefined)
  assert.equal(r.checklist, undefined)
})

test('Macao reçoit aussi les champs non listés', () => {
  const r = filterDossierForRole({ ...base, nouveauChampSensible: 'marge nette' }, 'Macao')
  assert.equal(r.nouveauChampSensible, 'marge nette')
})

test('acheteur et équipe résolus atteignent un Coworker', () => {
  const r = filterDossierForRole(
    { ...base, acheteur: 'Grand Villeneuvois', equipe: ['Alice', 'Bob'] },
    'Coworker'
  )
  assert.equal(r.acheteur, 'Grand Villeneuvois')
  assert.deepEqual(r.equipe, ['Alice', 'Bob'])
})

test('un rôle inconnu ne reçoit rien', () => {
  assert.equal(filterDossierForRole(base, 'Inconnu'), null)
})
