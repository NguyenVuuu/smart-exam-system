import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyExamIntegrity } from './exam-integrity-policy'

test('local match without a chain record is not verified', () => {
  assert.equal(classifyExamIntegrity('abc', 'abc', false, null), 'NOT_ANCHORED')
  assert.equal(classifyExamIntegrity('abc', 'abc', false, ''), 'NOT_ANCHORED')
})

test('a disconnected chain cannot produce VALID', () => {
  assert.equal(classifyExamIntegrity('abc', 'abc', true, null), 'BLOCKCHAIN_UNAVAILABLE')
})

test('both local and independent on-chain hashes must match', () => {
  assert.equal(classifyExamIntegrity('abc', 'abc', true, 'abc'), 'VALID')
  assert.equal(classifyExamIntegrity('abc', 'other', true, 'abc'), 'TAMPERED')
  assert.equal(classifyExamIntegrity('abc', 'abc', true, 'other'), 'TAMPERED')
  assert.equal(classifyExamIntegrity('abc', 'abc', false, 'abc'), 'VALID')
  assert.equal(classifyExamIntegrity('abc', 'abc', false, 'other'), 'TAMPERED')
})
