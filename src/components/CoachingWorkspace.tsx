import { useEffect, useRef, useState } from 'react'
import { createContext } from '../coaching/context'
import { runTurn } from '../coaching/engine'
import { changeStages } from '../coaching/types'
import type { ChangeStage, CoachingTurn, MemoryItem, TurnContext } from '../coaching/types'
import type { AnalyticsEvent, EventName, OutcomeRatingKey } from '../coaching/measurement'
import { IndexedDbLocalCache } from '../data/localCache'
import { confirmMemory, loadActiveMemories } from '../coaching/memory'
import { DevAnalyticsStore, recordMetric, recordOutcomeFeedback } from '../coaching/measurement'
import { resourceCatalog } from '../knowledge/resources'
import { safetyResources } from '../coaching/safety'
import { OpenAIAdapterPlaceholder } from '../coaching/model'

const stageLabels: Record<ChangeStage, string> = {
  OBSERVE: '观察', UNDERSTAND: '理解', ASK: '提问', REFLECT: '反思', CHALLENGE: '检验解释',
  DECIDE: '选择', ACT: '小步行动', TRACK: '计划与现实', LEARN: '学习偏差', ADAPT: '调整一个变量',
}
type Fault = 'none' | 'safety' | 'provider' | 'memory' | 'analytics' | 'resource'
export default function CoachingWorkspace({ onSafety }: { onSafety: () => void }) {
  const [context, setContext] = useState<TurnContext>(() => createContext())
  const [input, setInput] = useState('')
  const [turns, setTurns] = useState<CoachingTurn[]>([])
  const [busy, setBusy] = useState(false)
  const [paused, setPaused] = useState(false)
  const [message, setMessage] = useState('')
  const [proposals, setProposals] = useState<MemoryItem[]>([])
  const [fault, setFault] = useState<Fault>('none')
  const [analytics] = useState(() => new DevAnalyticsStore())
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([])
  const [cache] = useState(() => new IndexedDbLocalCache())
  const alive = useRef(true)
  const generation = useRef(0)
  const memoryGeneration = useRef(0)
  const latest = turns.at(-1)
  const safetyActive = context.safetyLatched
  const track = context.track ?? { plan: '', reality: '', learned: '', adaptation: '' }
  useEffect(() => {
    alive.current = true
    return () => { alive.current = false; generation.current += 1 }
  }, [])

  async function toggleMemory(enabled: boolean) {
    const request = ++memoryGeneration.current
    setContext(c => ({ ...c, consent: { ...c.consent, memory: enabled }, memories: [] }))
    setProposals([])
    if (!enabled) { setMessage('本轮已关闭记忆使用；已有缓存可通过“删除全部本地规律”清除。'); return }
    try {
      const memories = await loadActiveMemories(cache)
      if (alive.current && request === memoryGeneration.current) setContext(c => ({ ...c, memories }))
    } catch { if (alive.current) setMessage('本地规律读取失败，尚未加载；你仍可继续反思。') }
  }
  async function submit() {
    if (!input.trim() || busy) return
    setBusy(true)
    setMessage('')
    const request = ++generation.current
    try {
      const turn = await runTurn(input, context, {
        ...(fault === 'safety' ? { safetyEvaluator: async () => { throw new Error('simulated') } } : {}),
        ...(fault === 'provider' ? { model: new OpenAIAdapterPlaceholder() } : {}),
        ...(fault === 'resource' ? { resourceLookup: () => { throw new Error('simulated') } } : {}),
        analytics: fault === 'analytics' ? { append: async () => { throw new Error('simulated') } } : analytics,
      })
      if (!alive.current || request !== generation.current) return
      if (turn.safety.state === 'SAFETY_MODE') onSafety()
      setAnalyticsEvents(analytics.snapshot())
      setTurns(t => [...t, turn])
      setProposals(turn.memoryProposals)
      setContext(c => ({
        ...c, safetyLatched: c.safetyLatched || turn.safety.state === 'SAFETY_MODE',
        recentConversation: [...c.recentConversation, input].slice(-6),
        previousQuestionAsked: turn.response.questions.length > 0,
        resourceCount: c.resourceCount + (turn.resource ? 1 : 0),
        stage: turn.changeStage === 'SUSPENDED' ? c.stage : turn.changeStage,
        history: {
          interventions: [...c.history.interventions, ...(turn.plan.intervention ? [turn.plan.intervention.interventionId] : [])],
          resources: [...c.history.resources, ...(turn.resource ? [turn.resource.resourceId] : [])],
          actions: [...c.history.actions, ...(turn.action ? [{ accepted: false }] : [])],
        },
      }))
      if (turn.errors.includes('PROVIDER_UNAVAILABLE')) setMessage('模型暂不可用，已使用本地反思回应。你的输入仍保留，可使用原五步反思。')
      else if (turn.errors.includes('INVALID_RESPONSE')) setMessage('回应未通过检查，已切换到本地反思回应。你的输入仍保留。')
      else if (turn.errors.includes('RESOURCE_UNAVAILABLE')) setMessage('资源暂不可用，反思仍可继续。')
    } catch { if (alive.current) setMessage('本轮未完成，你的输入仍保留。可以稍后重试或打开原五步反思。') }
    finally { if (alive.current) setBusy(false) }
  }
  async function saveMemory(item: MemoryItem, text: string) {
    try {
      if (fault === 'memory') throw new Error('simulated')
      const saved = await confirmMemory(cache, item, text, context.consent.memory)
      setContext(c => ({ ...c, memories: [...c.memories.filter(m => m.id !== saved.id), saved] }))
      setProposals(p => p.filter(m => m.id !== item.id))
      setMessage('已确认并保存到此浏览器本地缓存。')
      void recordMetric(analytics, context.consent, item.kind === 'CONFIRMED_PATTERN' ? 'memory_edited' : 'memory_confirmed')
    } catch { setMessage('未保存。请检查记忆授权或本地存储；只接受你认可的具体策略，不保存诊断或人格标签。') }
  }
  async function removeMemory(item: MemoryItem) {
    try {
      await cache.delete(item.id)
      setContext(c => ({ ...c, memories: c.memories.filter(m => m.id !== item.id) }))
      setProposals(p => p.filter(m => m.id !== item.id))
      setMessage('该规律已从本地缓存删除。')
    } catch { setMessage('删除失败，规律可能仍留在本地缓存。请重试。') }
  }
  async function clearMemories() {
    try {
      await cache.clear()
      setContext(c => ({ ...c, memories: [] }))
      setProposals([])
      setMessage('全部本地规律已删除。')
    } catch { setMessage('删除失败，本地规律可能仍存在。') }
  }
  function consentChange(key: 'challenge' | 'resources' | 'analytics', checked: boolean) {
    if (key === 'analytics' && !checked) { analytics.clear(); setAnalyticsEvents([]) }
    setContext(c => ({ ...c, consent: { ...c.consent, [key]: checked } }))
  }
  function metric(name: EventName) {
    void recordMetric(analytics, context.consent, name).then(saved => {
      setAnalyticsEvents(analytics.snapshot())
      setMessage(saved ? '已记录本页内容无关的计数；没有上传。' : '已收到反馈，但当前计数关闭或保存失败；没有记录或上传。')
    })
  }
  function outcome(key: OutcomeRatingKey, value: number) {
    if (!latest) return
    setTurns(ts => ts.map(t => t.id === latest.id ? { ...t, outcome: { ...t.outcome, [key]: value } } : t))
    void recordOutcomeFeedback(analytics, context.consent, key, value).then(() => setAnalyticsEvents(analytics.snapshot()))
  }
  return <>
    <header><strong>AI Coaching Lab</strong><span className="tag">V0.3 · 本地 Mock 体验</span></header>
    <main>
      <h1>一起想清楚，下一步由你选择。</h1>
      <p className="intro">AI doesn't think for you. It helps you think better.</p>
      <p className="muted">当前使用预设本地回应，未接入真实 AI。聊天只留在当前页面；刷新后清空。可主动确认保存具体策略到此浏览器。</p>
      {safetyActive ? <section className="card safety" aria-label="安全支持">
        <h2>先照顾当下安全</h2>
        <p>本次会话已暂停普通 Coaching。不会自动联系任何第三方。</p>
        {safetyResources.map(r => <p key={r.url}><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a><br />{r.note}</p>)}
      </section> : <details>
        <summary>本轮偏好与隐私</summary>
        <label><input type="checkbox" checked={context.lowLoad} disabled={busy} onChange={e => setContext(c => ({ ...c, lowLoad: e.target.checked }))} />简单一点，一次一个问题</label>
        <label><input type="checkbox" checked={context.consent.challenge} disabled={busy} onChange={e => consentChange('challenge', e.target.checked)} />允许本轮温和检验我的解释（可随时关闭）</label>
        <label><input type="checkbox" checked={context.consent.resources} disabled={busy} onChange={e => consentChange('resources', e.target.checked)} />我愿意看一个相关练习资源</label>
        <label><input type="checkbox" checked={context.consent.memory} disabled={busy} onChange={e => void toggleMemory(e.target.checked)} />允许使用与确认本地规律</label>
        <label><input type="checkbox" checked={context.consent.analytics} disabled={busy} onChange={e => consentChange('analytics', e.target.checked)} />允许本页去标识计数（不含聊天正文，不上传，关闭或刷新清除）</label>
        <p>研究授权：关闭。当前版本不提供研究数据收集；拒绝研究不影响 Coaching。</p>
        <p>主动关怀：关闭。当前版本不会自动提醒或联系你。</p>
        <button type="button" disabled={busy} onClick={() => void clearMemories()}>删除全部本地规律</button>
      </details>}
      {!safetyActive && <section className="preferences">
        <label>本轮方向（可跳过、回退或重复）
          <select value={context.stage} disabled={busy} onChange={e => setContext(c => ({ ...c, stage: e.target.value as ChangeStage }))}>
            {changeStages.map(s => <option key={s} value={s}>{stageLabels[s]}</option>)}
          </select>
        </label>
        <label>你选择的目标（可留空）<input value={context.goal} maxLength={240} disabled={busy} onChange={e => setContext(c => ({ ...c, goal: e.target.value }))} /></label>
      </section>}
      {!safetyActive && !context.lowLoad && ['TRACK', 'LEARN', 'ADAPT'].includes(context.stage) && <fieldset>
        <legend>计划 → 现实 → 学习 → 调整</legend>
        {([['plan', '原来的计划'], ['reality', '实际发生的事'], ['learned', '你认为偏差来自哪里'], ['adaptation', '下一次调整一个变量']] as const).map(([key, label]) =>
          <label key={key}>{label}<input value={track[key]} maxLength={500} disabled={busy} onChange={e => setContext(c => ({ ...c, track: { ...track, [key]: e.target.value } }))} /></label>)}
        <button type="button" onClick={() => metric('follow_up_completed')}>这次复盘完成了</button>
      </fieldset>}
      <section className="card">
        <label htmlFor="coaching-input">此刻你想说些什么？</label>
        <textarea id="coaching-input" value={input} maxLength={4000} disabled={busy || paused} onChange={e => setInput(e.target.value)} placeholder="不知道、不想说、今天不解决问题，也都可以。" />
        <div className="buttons">
          <button type="button" className="primary" disabled={busy || paused || !input.trim()} onClick={() => void submit()}>{busy ? '正在整理…' : '继续这轮思考'}</button>
          <button type="button" disabled={busy} onClick={() => setPaused(p => !p)}>{paused ? '恢复' : '暂停一下'}</button>
        </div>
        {paused && <p role="status">先休息一下也可以。输入仍保留在这里。</p>}
      </section>
      <p role="status">{message}</p>
      <section aria-label="本次对话" aria-live="polite">
        {turns.map(turn => <article className="card turn" key={turn.id}>
          <p className="muted">你的表达</p><p className="user-text">{turn.userInput}</p>
          <p>{turn.response.text}</p>
          {turn.response.questions.map(q => <p key={q}>{q}</p>)}
          {turn.plan.intervention && <p className="muted">练习证据等级 {turn.plan.intervention.evidenceTier}：启发式练习，不作疗效承诺。</p>}
          {turn.action && !safetyActive && <div><h3>可选择的小行动</h3>
            <p>{turn.action.nextAction}</p><p>开始：{turn.action.startTrigger}；退路：{turn.action.fallback}</p>
            <button type="button" disabled={turn.action.accepted} onClick={() => {
              setTurns(ts => ts.map(t => t.id === turn.id && t.action ? { ...t, action: { ...t.action, accepted: true }, outcome: { ...t.outcome, nextStepAccepted: true } } : t))
              setContext(c => ({ ...c, recentOutcomes: [...c.recentOutcomes, { nextStepAccepted: true }] }))
              void recordMetric(analytics, context.consent, 'next_step_accepted')
            }}>{turn.action.accepted ? '已选择，随时可以调整' : '我愿意尝试这个小行动'}</button>
            <button type="button" onClick={() => {
              setTurns(ts => ts.map(t => t.id === turn.id && t.action ? { ...t, action: { ...t.action, accepted: false }, outcome: { ...t.outcome, nextStepAccepted: false } } : t))
              setContext(c => ({ ...c, recentOutcomes: [...c.recentOutcomes, { nextStepAccepted: false }] }))
              setMessage('已取消本轮行动选择，今天不行动也可以。')
            }}>本轮不采用这个行动</button>
          </div>}
        </article>)}
      </section>
      {latest?.resource && !safetyActive && <section className="card" aria-label="一个可选练习">
        <h2>一个可选练习</h2>
        <p>{latest.resource.whyNow}</p><p>{latest.resource.focusOn}</p>
        <a href={resourceCatalog.find(r => r.id === latest.resource?.resourceId)?.url} target="_blank" rel="noreferrer">打开两分钟下一步卡片</a>
        <p>{latest.resource.reflectionQuestion}</p><p>{latest.resource.behaviorBridge}</p>
        <p className="muted">Evidence Tier {latest.resource.evidenceTier} · 项目原创 · 可以跳过</p>
        <button type="button" onClick={() => metric('resource_completed')}>我看过这个练习</button>
        <button type="button" onClick={() => metric('resource_transfer')}>我把它用到了实际行动中</button>
      </section>}
      {context.consent.memory && !safetyActive && <section className="card" aria-label="我的规律">
        <h2>我的规律</h2><p>只有你确认的具体策略才会保存。未经确认的建议只在本次页面存在。</p>
        {proposals.map(item => <MemoryEditor key={item.id} item={item} onSave={text => void saveMemory(item, text)} onRemove={() => {
          setProposals(p => p.filter(m => m.id !== item.id)); setMessage('已拒绝，没有保存。')
          void recordMetric(analytics, context.consent, 'memory_rejected')
        }} />)}
        {context.memories.map(item => <MemoryEditor key={item.id} item={item} onSave={text => void saveMemory(item, text)} onRemove={() => void removeMemory(item)} />)}
        {!proposals.length && !context.memories.length && <p>暂无保存的规律。</p>}
      </section>}
      {latest && !safetyActive && <details key={latest.id}><summary>这次有帮助吗？（可跳过）</summary>
        {([
          ['feltUnderstood', '感觉被理解的程度'],
          ['clarityBefore', '开始时的清晰程度'],
          ['clarityAfter', '此刻的清晰程度'],
          ['agencyBefore', '开始时自主行动的把握'],
          ['agencyAfter', '此刻自主行动的把握'],
          ['helpfulness', '这轮对你有帮助吗'],
        ] as const).map(([key, label]) => <label key={key}>{label}<select defaultValue="" onChange={e => outcome(key, Number(e.target.value))}>
          <option value="" disabled>不填写也可以</option>{[1, 2, 3, 4, 5].map(v => <option key={v}>{v}</option>)}</select></label>)}
        <button type="button" onClick={() => metric('insight_recognized')}>我认出了一个对自己有用的线索</button>
        <button type="button" onClick={() => metric('intervention_accepted')}>这个练习适合我</button>
        <button type="button" onClick={() => metric('intervention_outcome')}>这个练习帮助了我的下一步</button>
        <button type="button" onClick={() => metric('repair')}>这轮需要重新理解我的意思</button>
      </details>}
      {import.meta.env.DEV && <details className="dev-tools"><summary>开发验收：故障模拟</summary>
        <label>模拟故障<select value={fault} disabled={busy} onChange={e => setFault(e.target.value as Fault)}>
          <option value="none">无</option><option value="safety">安全评估失败</option>
          <option value="provider">模型不可用</option><option value="memory">记忆保存失败</option>
          <option value="analytics">计数失败</option><option value="resource">资源查询失败</option>
        </select></label><p>仅开发服务器显示，不在生产构建中提供。</p>
        {context.consent.analytics && <pre aria-label="本页内容无关的计数">{JSON.stringify(analyticsEvents)}</pre>}
      </details>}
    </main>
    <footer>本工具支持一般自我反思，不提供诊断、治疗或紧急救援。当前开发版安全判断仍有漏判和误判风险。</footer>
  </>
}
function MemoryEditor({ item, onSave, onRemove }: { item: MemoryItem; onSave: (text: string) => void; onRemove: () => void }) {
  const [text, setText] = useState(item.text)
  return <fieldset><legend>{item.kind === 'WORKING_HYPOTHESIS' ? '待确认的假设（尚未保存）' : '你确认的规律（本地缓存）'}</legend>
    <label>可编辑的具体策略<input value={text} maxLength={240} onChange={e => setText(e.target.value)} /></label>
    <div className="buttons"><button type="button" onClick={() => onSave(text)}>{item.kind === 'WORKING_HYPOTHESIS' ? '确认并保存' : '保存修改'}</button>
      <button type="button" onClick={onRemove}>{item.kind === 'WORKING_HYPOTHESIS' ? '拒绝，不保存' : '删除这条规律'}</button></div>
  </fieldset>
}
