export type SessionView = 'reflection' | 'summary' | 'rest'

export type ReflectionPhase =
  | 'Observe'
  | 'Ask'
  | 'Reflect'
  | 'Dispute'
  | 'Act'

export interface ReflectionStep {
  id: ReflectionPhase
  title: string
  hint: string
  label: string
}

export interface SessionState {
  currentStepIndex: number
  answers: string[]
  draft: string
  view: SessionView
  reviewOpen: boolean
  reviewText: string
  reviewStatus: string
}

export type SessionAction =
  | { type: 'set-draft'; value: string }
  | { type: 'continue' }
  | { type: 'back' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'edit-answers' }
  | { type: 'open-review' }
  | { type: 'set-review'; value: string }
  | { type: 'save-review' }
