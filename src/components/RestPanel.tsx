import { useEffect, useRef } from 'react'

interface RestPanelProps {
  onResume: () => void
}

export default function RestPanel({ onResume }: RestPanelProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <section className="card" aria-labelledby="rest-title">
      <h2 id="rest-title" ref={titleRef} tabIndex={-1}>
        先到这里，也可以。
      </h2>
      <p>不用急着想清楚，更不用立刻做出承诺。</p>
      <p className="muted">页面保持打开时，可以回来接着写；刷新或关闭后内容会清空。</p>
      <button className="primary" type="button" onClick={onResume}>
        继续刚才的思考
      </button>
    </section>
  )
}
