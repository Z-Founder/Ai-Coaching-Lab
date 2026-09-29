import { useEffect, useRef } from 'react'

import type { ReflectionStep } from '../types/session'

interface SummaryPanelProps {
  steps: ReflectionStep[]
  answers: string[]
  reviewOpen: boolean
  reviewText: string
  reviewStatus: string
  onEdit: () => void
  onOpenReview: () => void
  onReviewChange: (value: string) => void
  onSaveReview: () => void
}

export default function SummaryPanel({
  steps,
  answers,
  reviewOpen,
  reviewText,
  reviewStatus,
  onEdit,
  onOpenReview,
  onReviewChange,
  onSaveReview,
}: SummaryPanelProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const reviewRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    if (reviewOpen) reviewRef.current?.focus()
  }, [reviewOpen])

  return (
    <section className="card" aria-labelledby="summary-title">
      <div className="eyebrow">YOUR NOTES</div>
      <h2 id="summary-title" ref={titleRef} tabIndex={-1}>
        这次，你理清了这些
      </h2>
      <p className="muted">下面是你的原话。你可以回去修改，也可以先停在这里。</p>
      <div>
        {steps.map((step, index) => (
          <div className="entry" key={step.id}>
            <strong>{step.label}</strong>
            <p>{answers[index] || '暂时留白'}</p>
          </div>
        ))}
      </div>
      <div className="buttons">
        <button type="button" onClick={onEdit}>
          返回修改
        </button>
        <button className="primary" type="button" onClick={onOpenReview}>
          记录一次复盘
        </button>
      </div>

      {reviewOpen && (
        <div className="review-box">
          <h2 id="review-question">实际发生了什么？</h2>
          <p className="muted">
            做到了多少？什么帮到了你，或挡住了你？下一次想怎样调整？没有行动也可以如实记录。
          </p>
          <textarea
            ref={reviewRef}
            aria-labelledby="review-question"
            placeholder="从实际发生的事情写起……"
            value={reviewText}
            onChange={(event) => onReviewChange(event.target.value)}
          />
          <button className="primary review-save" type="button" onClick={onSaveReview}>
            整理到本页
          </button>
          <p className="muted" role="status">
            {reviewStatus}
          </p>
        </div>
      )}
    </section>
  )
}
