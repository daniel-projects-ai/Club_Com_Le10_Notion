import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterOpportunityForRole, canAccess } from '../server/services/permissions.js'

const opp = {
  id: 'rec1', name: 'Refonte site', client: 'Ville X', objet: 'Description',
  deadline: '2026-09-01', budget: 30000, status: 'GO', territoire: 'Agen',
  score: 95, notesInternes: 'Contact chez le DGS', referent: 'Daniel', visible: true
}

test('Macao voit le score et les notes internes', () => {
  const r = filterOpportunityForRole(opp, 'Macao')
  assert.equal(r.score, 95)
  assert.equal(r.notesInternes, 'Contact chez le DGS')
  assert.equal(r.referent, 'Daniel')
})

test('un Coworker ne reçoit ni score ni notes internes ni référent', () => {
  const r = filterOpportunityForRole(opp, 'Coworker')
  assert.equal(r.score, undefined)
  assert.equal(r.notesInternes, undefined)
  assert.equal(r.referent, undefined)
  assert.equal(r.name, 'Refonte site')
  assert.equal(r.budget, 30000)
})

test('un Freelance est traité comme un Coworker en phase 1', () => {
  assert.deepEqual(
    filterOpportunityForRole(opp, 'Freelance'),
    filterOpportunityForRole(opp, 'Coworker')
  )
})

test('un rôle inconnu ne reçoit rien', () => {
  assert.equal(filterOpportunityForRole(opp, 'Inconnu'), null)
})

test('seul Macao accède à l\'administration', () => {
  assert.equal(canAccess('Macao', 'admin'), true)
  assert.equal(canAccess('Coworker', 'admin'), false)
  assert.equal(canAccess('Freelance', 'admin'), false)
})

test('tous les rôles connus accèdent à l\'annuaire', () => {
  assert.equal(canAccess('Coworker', 'directory'), true)
  assert.equal(canAccess('Macao', 'directory'), true)
  assert.equal(canAccess('Inconnu', 'directory'), false)
})
