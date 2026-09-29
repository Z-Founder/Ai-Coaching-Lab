import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createOpenAIProvider, startLocalServer } from '../server/local-openai.mjs'

const request = {
  input: '我想把今天的项目推进一点，但有些累。',
  plan: { stage: 'ASK', relationshipMode: 'COACH', objective: '澄清下一步', questionBudget: 1,
    challengeAllowed: false, question: { question: '哪一件事最值得先做？' } },
  relationship: { responseLength: 180 },
}

test('missing key prevents network request', async () => {
  let called = false
  const provider = createOpenAIProvider({ key: '', fetcher: async () => { called = true } })
  await assert.rejects(provider.generate(request, AbortSignal.timeout(100)), /NOT_CONFIGURED/)
  assert.equal(called, false)
})

test('provider sends no stored response and returns structured output', async () => {
  let sent
  const provider = createOpenAIProvider({ key: 'test-only', fetcher: async (_url, init) => {
    sent = init
    return { ok: true, json: async () => ({ output: [{ content: [{ type: 'output_text',
      text: JSON.stringify({ kind: 'COACHING', text: '先从一件事开始。', questions: ['哪一件事最值得先做？'],
        challenge: false, scientificClaim: false }) }] }] }) }
  } })
  const response = await provider.generate(request, AbortSignal.timeout(100))
  assert.equal(response.kind, 'COACHING')
  assert.equal(JSON.parse(sent.body).store, false)
  assert.equal(sent.headers.Authorization, 'Bearer test-only')
})

test('local service is loopback-only and does not echo input on provider failure', async () => {
  const server = startLocalServer({ provider: { generate: async () => { throw new Error('secret') } }, port: 0 })
  await new Promise(resolve => server.once('listening', resolve))
  try {
    assert.equal(server.address().address, '127.0.0.1')
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/coach`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, input: 'private text' }),
    })
    assert.equal(response.status, 503)
    const body = await response.text()
    assert.equal(body.includes('private text'), false)
    assert.equal(body.includes('secret'), false)
    const denied = await fetch(`http://127.0.0.1:${server.address().port}/api/coach`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://other.example' },
      body: JSON.stringify(request),
    })
    assert.equal(denied.status, 403)
  } finally { server.close() }
})
