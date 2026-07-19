import { test } from 'node:test'
import assert from 'node:assert/strict'
import { piecesManquantes, estBloque, filterDossierForRole } from '../server/services/dossiers.js'

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

test('un rôle inconnu ne reçoit rien', () => {
  assert.equal(filterDossierForRole(base, 'Inconnu'), null)
})
