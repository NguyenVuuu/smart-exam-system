import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assignTopicsSchema, createTopicSchema } from './learning-topics.validator'

test('rejects duplicate topic assignments', () => {
  const topicId = 'b796a80c-1e4b-4a5f-a947-0345d34c1993'
  assert.equal(assignTopicsSchema.safeParse({ topicIds: [topicId, topicId] }).success, false)
})

test('normalizes subject topic code', () => {
  assert.equal(createTopicSchema.parse({ code: ' join ', name: 'SQL joins' }).code, 'JOIN')
})
