import { useEffect, useRef } from 'react'

import type { ReflectionStep } from '../types/session'

interface ReflectionSessionProps {
  step: ReflectionStep
  currentStepIndex: number
  totalSteps: number
  draft: string
  onDraftChange: (value: string) => void
  onBack: () => void
  onContinue: () => void
  onSkip: () => void
  onPause: () => void
}

export default function ReflectionSession({
  step,
  currentStepIndex,
  totalSteps,
  draft,
  onDraftChange,
  onBack,
  onContinue,
  onSkip,
  onPause,
}: ReflectionSessionProps) {
  const questionRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    questionRef.current?.focus()
  }, [step.id])

  const isFinalStep = currentStepIndex === totalSteps - 1

  return (
    <section className="card" aria-labelledby="question">
      <div className="muted">
        思考 {currentStepIndex + 1} / {totalSteps}
      </div>
      <h2 id="question" ref={questionRef} tabIndex={-1}>
        {step.title}
      </h2>
      <p className="muted" id="hint">
        {step.hint}
      </p>
      <textarea
        aria-labelledby="question"
        aria-describedby="hint"
        placeholder="写一句也可以……"
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
      />
      <div className="buttons">
        {currentStepIndex > 0 && (
          <button type="button" onClick={onBack}>
            上一步
          </button>
        )}
        <button className="primary" type="button" onClick={onContinue}>
          {isFinalStep ? '查看我的总结' : '继续'}
        </button>
        <button type="button" onClick={onSkip}>
          暂时不知道
        </button>
        <button type="button" onClick={onPause}>
          先休息一下
        </button>
      </div>
    </section>
  )
}
