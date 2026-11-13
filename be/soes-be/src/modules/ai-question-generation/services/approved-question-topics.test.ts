import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertApprovedQuestionTopics } from './approved-question-topics'

test('rejects missing topics and topics from another subject', () => {
  const topics = [{ id: 'topic-1', subjectId: 'java' }]
  assert.doesNotThrow(() => assertApprovedQuestionTopics([{ subjectId: 'java', topicIds: ['topic-1'] }], topics))
  assert.throws(() => assertApprovedQuestionTopics([{ subjectId: 'cpp', topicIds: ['topic-1'] }], topics))
  assert.throws(() => assertApprovedQuestionTopics([{ subjectId: 'java', topicIds: ['missing'] }], topics))
})
