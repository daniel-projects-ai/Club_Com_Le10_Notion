import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculerHistorique, filterOrganisationForRole } from '../server/services/organisations.js'

const opportunites = [
  { id: 'recO1', name: 'Refonte site', status: 'Gagné', deadline: '2026-03-01' },
  { id: 'recO2', name: 'Charte graphique', status: 'Perdu', deadline: '2026-05-01' },
  { id: 'recO3', name: 'Campagne été', status: 'À analyser', deadline: '2026-09-01' }
]

const dossiers = [
  { id: 'recD1', opportuniteIds: ['recO1'], depot: 'Déposé', resultat: 'Gagné' },
  { id: 'recD2', opportuniteIds: ['recO2'], depot: 'Accusé reçu', resultat: 'Perdu' },
  { id: 'recD3', opportuniteIds: ['recO3'], depot: 'Non préparé', resultat: 'En cours' }
]

test('l\'historique compte les opportunités liées', () => {
  assert.equal(calculerHistorique(opportunites, dossiers).nbOpportunites, 3)
})

test('seuls les dossiers réellement déposés sont comptés', () => {
  assert.equal(calculerHistorique(opportunites, dossiers).nbDossiersDeposes, 2)
})

test('les gagnés et les perdus sont comptés séparément', () => {
  const h = calculerHistorique(opportunites, dossiers)
  assert.equal(h.nbGagnes, 1)
  assert.equal(h.nbPerdus, 1)
})

test('la dernière opportunité est la plus récente par échéance', () => {
  assert.equal(calculerHistorique(opportunites, dossiers).derniereOpportunite, '2026-09-01')
})

test('une organisation sans opportunité renvoie null, jamais zéro', () => {
  const h = calculerHistorique([], [])
  assert.equal(h.nbOpportunites, null)
  assert.equal(h.nbDossiersDeposes, null)
  assert.equal(h.nbGagnes, null)
  assert.equal(h.nbPerdus, null)
  assert.equal(h.derniereOpportunite, null)
})

test('des opportunités sans échéance ne cassent pas le calcul', () => {
  const h = calculerHistorique(
    [{ id: 'recO9', name: 'Sans date', status: 'À analyser', deadline: null }],
    []
  )
  assert.equal(h.nbOpportunites, 1)
  assert.equal(h.derniereOpportunite, null)
})

test('des arguments absents ne cassent pas le calcul', () => {
  const h = calculerHistorique()
  assert.equal(h.nbOpportunites, null)
})

test('Macao reçoit l\'organisation entière', () => {
  const org = { id: 'recA1', nom: 'Mairie de Colomiers', notes: 'Contact via le maire', niveauRelation: 'Contact pris' }
  const r = filterOrganisationForRole(org, 'Macao')
  assert.equal(r.notes, 'Contact via le maire')
  assert.equal(r.niveauRelation, 'Contact pris')
})

test('un Coworker ne reçoit rien du CRM', () => {
  const org = { id: 'recA1', nom: 'Mairie de Colomiers' }
  assert.equal(filterOrganisationForRole(org, 'Coworker'), null)
  assert.equal(filterOrganisationForRole(org, 'Freelance'), null)
})

test('un rôle inconnu ne reçoit rien', () => {
  assert.equal(filterOrganisationForRole({ id: 'recA1' }, 'Inconnu'), null)
})
