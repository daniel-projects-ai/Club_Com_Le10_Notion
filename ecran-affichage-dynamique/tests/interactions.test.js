import { test } from 'node:test'
import assert from 'node:assert/strict'
import { peutEtreDemarche, classerRelances, referenceInteraction } from '../server/services/interactions.js'

const libre = { id: 'recI1', nom: 'Jean Dupont', opposition: false, consentementSmsWhatsapp: 'Non renseigné' }
const oppose = { id: 'recI2', nom: 'Marie Martin', opposition: true, consentementSmsWhatsapp: 'Accordé' }
const consentant = { id: 'recI3', nom: 'Paul Durand', opposition: false, consentementSmsWhatsapp: 'Accordé' }

test('une opposition interdit tous les canaux, consentement compris', () => {
  for (const canal of ['Email', 'Appel', 'SMS', 'WhatsApp', 'Courrier']) {
    assert.equal(peutEtreDemarche(oppose, canal), false, `${canal} devrait être interdit`)
  }
})

test('email, appel et courrier sont permis sans opposition', () => {
  assert.equal(peutEtreDemarche(libre, 'Email'), true)
  assert.equal(peutEtreDemarche(libre, 'Appel'), true)
  assert.equal(peutEtreDemarche(libre, 'Courrier'), true)
})

test('SMS et WhatsApp exigent un consentement explicite', () => {
  assert.equal(peutEtreDemarche(libre, 'SMS'), false)
  assert.equal(peutEtreDemarche(libre, 'WhatsApp'), false)
  assert.equal(peutEtreDemarche(consentant, 'SMS'), true)
  assert.equal(peutEtreDemarche(consentant, 'WhatsApp'), true)
})

test('un consentement refusé vaut interdiction', () => {
  assert.equal(peutEtreDemarche({ ...libre, consentementSmsWhatsapp: 'Refusé' }, 'SMS'), false)
})

test('LinkedIn n\'est jamais automatisable', () => {
  assert.equal(peutEtreDemarche(consentant, 'LinkedIn'), false)
})

test('un interlocuteur absent n\'est jamais démarchable', () => {
  assert.equal(peutEtreDemarche(null, 'Email'), false)
  assert.equal(peutEtreDemarche(undefined, 'Email'), false)
})

const t = (id, echeance, statut = 'À faire') => ({ id, intitule: id, echeance, statut })

test('une relance due aujourd\'hui n\'est pas en retard', () => {
  const r = classerRelances([t('a', '2026-07-20')], new Date(2026, 6, 20, 2, 0, 0))
  assert.deepEqual(r.enRetard.map(x => x.id), [])
  assert.deepEqual(r.cetteSemaine.map(x => x.id), ['a'])
})

test('une relance d\'hier est en retard', () => {
  const r = classerRelances([t('a', '2026-07-19')], new Date(2026, 6, 20, 12, 0, 0))
  assert.deepEqual(r.enRetard.map(x => x.id), ['a'])
})

test('les échéances à plus de sept jours sont classées plus tard', () => {
  const r = classerRelances(
    [t('proche', '2026-07-26'), t('lointaine', '2026-08-15')],
    new Date(2026, 6, 20, 12, 0, 0)
  )
  assert.deepEqual(r.cetteSemaine.map(x => x.id), ['proche'])
  assert.deepEqual(r.plusTard.map(x => x.id), ['lointaine'])
})

test('seules les tâches à faire sont classées', () => {
  const r = classerRelances(
    [t('faite', '2026-07-19', 'Faite'), t('annulee', '2026-07-19', 'Annulée')],
    new Date(2026, 6, 20, 12, 0, 0)
  )
  assert.deepEqual(r.enRetard.map(x => x.id), [])
  assert.deepEqual(r.cetteSemaine.map(x => x.id), [])
  assert.deepEqual(r.plusTard.map(x => x.id), [])
})

test('une tâche sans échéance est classée plus tard, jamais en retard', () => {
  const r = classerRelances([t('sansDate', null)], new Date(2026, 6, 20, 12, 0, 0))
  assert.deepEqual(r.enRetard.map(x => x.id), [])
  assert.deepEqual(r.plusTard.map(x => x.id), ['sansDate'])
})

test('les relances en retard sont triées de la plus ancienne à la plus récente', () => {
  const r = classerRelances(
    [t('recente', '2026-07-19'), t('ancienne', '2026-07-01')],
    new Date(2026, 6, 20, 12, 0, 0)
  )
  assert.deepEqual(r.enRetard.map(x => x.id), ['ancienne', 'recente'])
})

test('une liste vide ou absente ne casse pas le classement', () => {
  assert.deepEqual(classerRelances([], new Date(2026, 6, 20)).enRetard, [])
  assert.deepEqual(classerRelances(undefined, new Date(2026, 6, 20)).plusTard, [])
})

test('la référence est lisible et datée', () => {
  assert.equal(
    referenceInteraction({ date: '2026-07-20', canal: 'Appel' }, 'Mairie de Colomiers'),
    '2026-07-20 · Appel · Mairie de Colomiers'
  )
})

test('la référence tolère des données manquantes', () => {
  assert.equal(referenceInteraction({}, null), 'Échange')
})
