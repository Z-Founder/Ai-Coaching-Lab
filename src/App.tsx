import { useState } from 'react'
import LegacyReflection from './LegacyReflection'
import CoachingWorkspace from './components/CoachingWorkspace'

export default function App() {
  const [legacy, setLegacy] = useState(false)
  const [safetyActive, setSafetyActive] = useState(false)
  return <>
    <nav className="mode-nav" aria-label="体验模式">
      <button type="button" disabled={safetyActive} onClick={() => setLegacy(!legacy)}>
        {legacy ? '返回 V0.3 Coaching' : '打开原五步反思（无需 AI）'}
      </button>
      <p className="muted">切换模式会清空当前会话；已确认的本地规律可单独删除。</p>
    </nav>
    {legacy ? <LegacyReflection /> : <CoachingWorkspace onSafety={() => setSafetyActive(true)} />}
  </>
}
