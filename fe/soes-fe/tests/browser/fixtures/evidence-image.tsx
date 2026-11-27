import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../../../src/index.css'
import { tokenStorage } from '../../../src/utils/token'
import EvidenceImageModal from '../../../src/pages/teacher/components/proctoring/EvidenceImageModal'

tokenStorage.setAccessToken('evidence-test-token')
export function Fixture() {
  const [open, setOpen] = useState(true)
  const image = new URLSearchParams(window.location.search).get('image')
    ?? '/api/teacher/proctoring/schedules/schedule/violations/violation/evidence/image'
  return <EvidenceImageModal imageUrl={open ? image : null} onClose={() => setOpen(false)} />
}
const root = document.getElementById('root')
if (!root) throw new Error('Fixture root missing')
createRoot(root).render(<Fixture />)
