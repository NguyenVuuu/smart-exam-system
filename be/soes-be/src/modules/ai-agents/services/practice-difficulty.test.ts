import test from 'node:test'
import assert from 'node:assert/strict'
import { choosePracticeDifficulty } from './practice-difficulty'

test('keeps a neutral level until enough practice answers are available', () => {
  assert.equal(choosePracticeDifficulty([{ score: 0, questionCount: 5 }]), 'INTERMEDIATE')
})

test('uses completed practice accuracy to adjust the next set', () => {
  assert.equal(choosePracticeDifficulty([{ score: 4, questionCount: 10 }]), 'BASIC')
  assert.equal(choosePracticeDifficulty([{ score: 6, questionCount: 10 }]), 'INTERMEDIATE')
  assert.equal(choosePracticeDifficulty([{ score: 8, questionCount: 10 }]), 'ADVANCED')
})
