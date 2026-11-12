import assert from 'node:assert/strict'
import { test } from 'node:test'
import { gradePractice } from './practice-grading'

const question = { stem: 'INNER JOIN trả về các hàng nào?',
  options: ['Hàng khớp', 'Bên trái', 'Bên phải', 'Không hàng nào'],
  correctIndex: 0, explanation: 'Các hàng có khóa khớp ở cả hai bảng.',
  supportQuote: 'INNER JOIN chỉ trả các hàng có khóa khớp.' }
const items = [{ id: 'a', snapshot: question }, { id: 'b', snapshot: question }]

test('grades every practice response once without awarding unselected answers', () => {
  assert.deepEqual(gradePractice(items, [
    { itemId: 'a', selectedIndex: 0 }, { itemId: 'b', selectedIndex: 2 },
  ]).map(({ score }) => score), [1, 0])
})

test('rejects missing, repeated, and foreign practice item IDs', () => {
  for (const answers of [
    [{ itemId: 'a', selectedIndex: 0 }],
    [{ itemId: 'a', selectedIndex: 0 }, { itemId: 'a', selectedIndex: 0 }],
    [{ itemId: 'a', selectedIndex: 0 }, { itemId: 'other', selectedIndex: 0 }],
  ]) assert.throws(() => gradePractice(items, answers), { statusCode: 422 })
})
