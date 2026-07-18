import { test } from 'node:test'
import assert from 'node:assert/strict'
process.env.JWT_SECRET = 'secret-de-test'
const { signMagicToken, verifyMagicToken, signSession, verifySession } =
  await import('../server/services/auth.js')

const user = { id: 'recABC', email: 'a@b.fr', role: 'Macao' }

test('un jeton magique valide se vérifie et rend l\'utilisateur', () => {
  const t = signMagicToken(user)
  const out = verifyMagicToken(t)
  assert.equal(out.email, 'a@b.fr')
  assert.equal(out.role, 'Macao')
})

test('un jeton magique falsifié est rejeté', () => {
  assert.equal(verifyMagicToken('abc.def.ghi'), null)
})

test('un jeton magique expiré est rejeté', () => {
  const t = signMagicToken(user, -1)
  assert.equal(verifyMagicToken(t), null)
})

test('un jeton de session ne peut pas servir de jeton magique', () => {
  const s = signSession(user)
  assert.equal(verifyMagicToken(s), null)
})

test('un jeton de session valide se vérifie', () => {
  const s = signSession(user)
  assert.equal(verifySession(s).id, 'recABC')
})
