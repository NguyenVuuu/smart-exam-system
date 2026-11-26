import { createRoot } from 'react-dom/client'
import { apiClient } from '../../../src/api/axios'
import { useStudentScorePage } from '../../../src/pages/student/hooks/useStudentScorePage'

apiClient.defaults.baseURL = '/api'

export function Fixture() {
  const state = useStudentScorePage()
  return <>
    <input aria-label="search" value={state.keyword} onChange={event => state.setKeyword(event.target.value)} />
    <button onClick={() => state.setPage(page => page + 1)} disabled={state.loading}>Next</button>
    <button onClick={state.load}>Reload</button>
    <output aria-label="status">{state.loading ? 'loading' : 'ready'}</output>
    <output aria-label="summary">{JSON.stringify({ page: state.page, total: state.totalItems, average: state.averageScore })}</output>
    <output aria-label="rows">{state.scores.map(item => item.title).join(',')}</output>
  </>
}
const root = document.getElementById('root')
if (!root) throw new Error('Fixture root missing')
createRoot(root).render(<Fixture />)
