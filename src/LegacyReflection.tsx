import { useReducer } from 'react'

import ReflectionSession from './components/ReflectionSession'
import RestPanel from './components/RestPanel'
import SummaryPanel from './components/SummaryPanel'
import { reflectionSteps } from './data/reflectionSteps'
import type { SessionAction, SessionState } from './types/session'

const initialState: SessionState = {
  currentStepIndex: 0,
  answers: Array.from({ length: reflectionSteps.length }, () => ''),
  draft: '',
  view: 'reflection',
  reviewOpen: false,
  reviewText: '',
  reviewStatus: '',
}

function rememberCurrentAnswer(state: SessionState) {
  return state.answers.map((answer, index) =>
    index === state.currentStepIndex ? state.draft.trim() : answer,
  )
}

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'set-draft':
      return { ...state, draft: action.value }

    case 'continue': {
      const answers = rememberCurrentAnswer(state)
      const isFinalStep = state.currentStepIndex === reflectionSteps.length - 1

      if (isFinalStep) return { ...state, answers, view: 'summary' }

      const currentStepIndex = state.currentStepIndex + 1
      return {
        ...state,
        answers,
        currentStepIndex,
        draft: answers[currentStepIndex] ?? '',
      }
    }

    case 'back': {
      if (state.currentStepIndex === 0) return state

      const answers = rememberCurrentAnswer(state)
      const currentStepIndex = state.currentStepIndex - 1
      return {
        ...state,
        answers,
        currentStepIndex,
        draft: answers[currentStepIndex] ?? '',
      }
    }

    case 'pause':
      return { ...state, answers: rememberCurrentAnswer(state), view: 'rest' }

    case 'resume':
      return { ...state, view: 'reflection' }

    case 'edit-answers':
      return {
        ...state,
        currentStepIndex: 0,
        draft: state.answers[0] ?? '',
        view: 'reflection',
      }

    case 'open-review':
      return { ...state, reviewOpen: true }

    case 'set-review':
      return { ...state, reviewText: action.value, reviewStatus: '' }

    case 'save-review':
      return {
        ...state,
        reviewStatus: state.reviewText.trim()
          ? '复盘已留在当前页面，仍可修改。刷新或关闭前，请自行复制保留。'
          : '可以暂时留白，等有了实际经历再回来写。',
      }
  }
}

export default function LegacyReflection() {
  const [state, dispatch] = useReducer(sessionReducer, initialState)
  const step = reflectionSteps[state.currentStepIndex]

  if (!step) return null

  return (
    <>
      <header>
        <strong>AI Coaching Lab</strong>
        <span className="tag">交互原型 · v0.2 foundation</span>
      </header>

      <main>
        <div className="eyebrow">THINK WITH ME</div>
        <h1>给思绪一点空间。</h1>
        <p className="intro">从眼前的一件事开始。一次一个问题，按你的节奏来。</p>

        {state.view === 'reflection' && (
          <ReflectionSession
            step={step}
            currentStepIndex={state.currentStepIndex}
            totalSteps={reflectionSteps.length}
            draft={state.draft}
            onDraftChange={(value) => dispatch({ type: 'set-draft', value })}
            onBack={() => dispatch({ type: 'back' })}
            onContinue={() => dispatch({ type: 'continue' })}
            onSkip={() => dispatch({ type: 'continue' })}
            onPause={() => dispatch({ type: 'pause' })}
          />
        )}

        {state.view === 'summary' && (
          <SummaryPanel
            steps={reflectionSteps}
            answers={state.answers}
            reviewOpen={state.reviewOpen}
            reviewText={state.reviewText}
            reviewStatus={state.reviewStatus}
            onEdit={() => dispatch({ type: 'edit-answers' })}
            onOpenReview={() => dispatch({ type: 'open-review' })}
            onReviewChange={(value) => dispatch({ type: 'set-review', value })}
            onSaveReview={() => dispatch({ type: 'save-review' })}
          />
        )}

        {state.view === 'rest' && (
          <RestPanel onResume={() => dispatch({ type: 'resume' })} />
        )}
      </main>

      <footer className="muted">
        预设问题体验，尚未接入 AI。此页面不主动上传或持久保存你的输入。刷新或关闭后内容清空。
        本工具用于一般自我反思，不提供诊断或治疗。
      </footer>
    </>
  )
}
