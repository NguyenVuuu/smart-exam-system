import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isDistinctProposedTopic } from './topic-suggestion.rules'

test('a new AI topic must differ from existing topics after Vietnamese normalization', () => {
  const topics = [{ code: 'OOP', name: 'Lập trình hướng đối tượng' }]
  assert.equal(isDistinctProposedTopic('OOP', 'Kế thừa', topics), false)
  assert.equal(isDistinctProposedTopic('OBJECTS', 'Lap trinh huong doi tuong', topics), false)
  assert.equal(isDistinctProposedTopic('CH3', 'Chương 3', topics), false)
  assert.equal(isDistinctProposedTopic('EXCEPTION', 'Xử lý ngoại lệ', topics), true)
})
