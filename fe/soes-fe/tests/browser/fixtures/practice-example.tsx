import { createRoot } from 'react-dom/client'
import '../../../src/index.css'
import PracticeProgrammingQuestion from '../../../src/pages/student/components/PracticeProgrammingQuestion'

export function Fixture() {
  return <PracticeProgrammingQuestion setId="fixture" completed value="" onChange={() => undefined}
    item={{ id: 'question', kind: 'PROGRAMMING', orderIndex: 1, stem: 'Read n and an integer array.',
      language: 'JAVA', starterCode: '', sampleInput: '5\n1 2 3 4 5', sampleOutput: '15\n5',
    }} />
}
const root = document.getElementById('root')
if (!root) throw new Error('Fixture root missing')
createRoot(root).render(<Fixture />)
