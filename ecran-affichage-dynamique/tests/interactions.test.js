import { test } from 'node:test'
import assert from 'node:assert/strict'
import { peutEtreDemarche, classerRelances, referenceInteraction, resoudreAuteur } from '../server/services/interactions.js'

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

// Valeurs réelles des trois comptes Macao dans Airtable : un nom de famille
// pour l'un, un espace final pour les deux autres.
test('l\'auteur est résolu depuis le nom affiché malgré nom de famille et espaces', () => {
  assert.equal(resoudreAuteur({ nom: 'Daniel Such' }), 'Daniel')
  assert.equal(resoudreAuteur({ nom: 'Dominique ' }), 'Dominique')
  assert.equal(resoudreAuteur({ nom: 'Mathieu' }), 'Mathieu')
})

test('le prénom fourni l\'emporte sur le nom affiché', () => {
  assert.equal(resoudreAuteur({ prenom: 'Mathieu', nom: 'Daniel Such' }), 'Mathieu')
  assert.equal(resoudreAuteur({ prenom: ' Dominique ', nom: 'Sans nom' }), 'Dominique')
})

test('la valeur renvoyée est exactement celle du single select', () => {
  // Une variante de casse créerait une option par typecast : on renvoie la
  // valeur canonique, jamais la saisie.
  assert.equal(resoudreAuteur({ prenom: 'DANIEL' }), 'Daniel')
  assert.equal(resoudreAuteur({ nom: 'daniel such' }), 'Daniel')
})

test('un nom hors de l\'équipe Macao ne donne aucun auteur', () => {
  assert.equal(resoudreAuteur({ nom: 'Camille Dupont' }), null)
  assert.equal(resoudreAuteur({ prenom: 'Jean-Pierre', nom: 'Jean-Pierre Martin' }), null)
})

test('une entrée vide ou absente ne donne aucun auteur', () => {
  assert.equal(resoudreAuteur(null), null)
  assert.equal(resoudreAuteur(undefined), null)
  assert.equal(resoudreAuteur({}), null)
  assert.equal(resoudreAuteur({ prenom: '', nom: '' }), null)
  assert.equal(resoudreAuteur({ prenom: '   ' }), null)
})
