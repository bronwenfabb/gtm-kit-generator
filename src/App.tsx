import { useState, type FormEvent } from 'react'
import type { GtmKit, LaunchInputs } from './types'
import { ErrorBoundary } from './ErrorBoundary'
import './App.css'

const EMPTY_INPUTS: LaunchInputs = {
  productName: '',
  oneLiner: '',
  targetAudience: '',
  keyFeatures: '',
  problemSolved: '',
  competitors: '',
  pricingModel: '',
  launchDate: '',
  tone: '',
}

function App() {
  const [inputs, setInputs] = useState<LaunchInputs>(EMPTY_INPUTS)
  const [kit, setKit] = useState<GtmKit | null>(null)
  const [generationId, setGenerationId] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateField(field: keyof LaunchInputs, value: string) {
    setInputs((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setKit(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate kit')
      }
      setKit(data as GtmKit)
      setGenerationId((id) => id + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function downloadMarkdown() {
    if (!kit) return
    const md = kitToMarkdown(inputs.productName, kit)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${inputs.productName.replace(/\s+/g, '-').toLowerCase() || 'gtm-kit'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page">
      <header>
        <h1>GTM Kit Generator</h1>
        <p>Fill in your launch details, get a complete go-to-market kit.</p>
      </header>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Product name *
          <input
            required
            value={inputs.productName}
            onChange={(e) => updateField('productName', e.target.value)}
            placeholder="Acme Flow"
          />
        </label>
        <label>
          One-liner *
          <input
            required
            value={inputs.oneLiner}
            onChange={(e) => updateField('oneLiner', e.target.value)}
            placeholder="Workflow automation for revenue teams"
          />
        </label>
        <label>
          Target audience *
          <input
            required
            value={inputs.targetAudience}
            onChange={(e) => updateField('targetAudience', e.target.value)}
            placeholder="RevOps leaders at 200-2000 person B2B SaaS companies"
          />
        </label>
        <label>
          Key features
          <textarea
            value={inputs.keyFeatures}
            onChange={(e) => updateField('keyFeatures', e.target.value)}
            placeholder="No-code workflow builder, CRM sync, approval routing"
          />
        </label>
        <label>
          Problem it solves
          <textarea
            value={inputs.problemSolved}
            onChange={(e) => updateField('problemSolved', e.target.value)}
            placeholder="Manual handoffs between sales and finance slow deal approval"
          />
        </label>
        <label>
          Known competitors
          <input
            value={inputs.competitors}
            onChange={(e) => updateField('competitors', e.target.value)}
            placeholder="Zapier, Workato"
          />
        </label>
        <label>
          Pricing model
          <input
            value={inputs.pricingModel}
            onChange={(e) => updateField('pricingModel', e.target.value)}
            placeholder="Per-seat, tiered, $49/user/mo"
          />
        </label>
        <label>
          Target launch date
          <input
            value={inputs.launchDate}
            onChange={(e) => updateField('launchDate', e.target.value)}
            placeholder="September 2026"
          />
        </label>
        <label>
          Desired tone
          <input
            value={inputs.tone}
            onChange={(e) => updateField('tone', e.target.value)}
            placeholder="Confident, plain-English, no jargon"
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Generating…' : 'Generate GTM kit'}
        </button>
        {loading && (
          <p className="hint">
            Writing your full kit — positioning, personas, messaging, launch copy, and more.
            This usually takes 30–60 seconds, please don't close this tab.
          </p>
        )}
      </form>

      {error && <p className="error">{error}</p>}

      {kit && (
        <ErrorBoundary key={generationId}>
          <div className="results">
            <button className="download" onClick={downloadMarkdown} type="button">
              Download as Markdown
            </button>

            <section>
              <h2>Positioning statement</h2>
              <p>{kit.positioningStatement}</p>
            </section>

            <section>
              <h2>Target personas</h2>
              {(kit.personas ?? []).map((p, i) => (
                <div key={i} className="card">
                  <h3>{p.name} — {p.role}</h3>
                  <p><strong>Pain points:</strong> {(p.painPoints ?? []).join('; ')}</p>
                  <p><strong>Goals:</strong> {(p.goals ?? []).join('; ')}</p>
                </div>
              ))}
            </section>

            <section>
              <h2>Messaging pillars</h2>
              {(kit.messagingPillars ?? []).map((m, i) => (
                <div key={i} className="card">
                  <h3>{m.pillar}</h3>
                  <p>{m.description}</p>
                  <ul>
                    {(m.proofPoints ?? []).map((pp, j) => (
                      <li key={j}>{pp}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            <section>
              <h2>Competitive positioning</h2>
              {(kit.competitiveNotes ?? []).map((c, i) => (
                <div key={i} className="card">
                  <h3>{c.competitor}</h3>
                  <p><strong>Their positioning:</strong> {c.theirPositioning}</p>
                  <p><strong>Our angle:</strong> {c.ourAngle}</p>
                </div>
              ))}
            </section>

            <section>
              <h2>Pricing talking points</h2>
              <ul>
                {(kit.pricingTalkingPoints ?? []).map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2>Launch checklist</h2>
              {(kit.launchChecklist ?? []).map((c, i) => (
                <div key={i} className="card">
                  <h3>{c.phase}</h3>
                  <ul>
                    {(c.tasks ?? []).map((t, j) => (
                      <li key={j}>{t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            <section>
              <h2>Launch timeline</h2>
              <ul>
                {(kit.launchTimeline ?? []).map((t, i) => (
                  <li key={i}><strong>{t.timeframe}:</strong> {t.milestone}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2>Announcement email</h2>
              <div className="card">
                <p><strong>Subject:</strong> {kit.announcementEmail?.subject}</p>
                <p className="pre">{kit.announcementEmail?.body}</p>
              </div>
            </section>

            <section>
              <h2>Social posts</h2>
              {(kit.socialPosts ?? []).map((s, i) => (
                <div key={i} className="card">
                  <h3>{s.platform}</h3>
                  <p className="pre">{s.text}</p>
                </div>
              ))}
            </section>

            <section>
              <h2>One-pager</h2>
              <p className="pre">{kit.onePager}</p>
            </section>
          </div>
        </ErrorBoundary>
      )}
    </div>
  )
}

function kitToMarkdown(productName: string, kit: GtmKit): string {
  const lines: string[] = []
  lines.push(`# GTM Kit: ${productName}`, '')
  lines.push('## Positioning statement', kit.positioningStatement, '')

  lines.push('## Target personas')
  ;(kit.personas ?? []).forEach((p) => {
    lines.push(`### ${p.name} — ${p.role}`)
    lines.push(`- Pain points: ${(p.painPoints ?? []).join('; ')}`)
    lines.push(`- Goals: ${(p.goals ?? []).join('; ')}`, '')
  })

  lines.push('## Messaging pillars')
  ;(kit.messagingPillars ?? []).forEach((m) => {
    lines.push(`### ${m.pillar}`, m.description)
    ;(m.proofPoints ?? []).forEach((pp) => lines.push(`- ${pp}`))
    lines.push('')
  })

  lines.push('## Competitive positioning')
  ;(kit.competitiveNotes ?? []).forEach((c) => {
    lines.push(`### ${c.competitor}`)
    lines.push(`- Their positioning: ${c.theirPositioning}`)
    lines.push(`- Our angle: ${c.ourAngle}`, '')
  })

  lines.push('## Pricing talking points')
  ;(kit.pricingTalkingPoints ?? []).forEach((pt) => lines.push(`- ${pt}`))
  lines.push('')

  lines.push('## Launch checklist')
  ;(kit.launchChecklist ?? []).forEach((c) => {
    lines.push(`### ${c.phase}`)
    ;(c.tasks ?? []).forEach((t) => lines.push(`- [ ] ${t}`))
    lines.push('')
  })

  lines.push('## Launch timeline')
  ;(kit.launchTimeline ?? []).forEach((t) => lines.push(`- **${t.timeframe}:** ${t.milestone}`))
  lines.push('')

  lines.push('## Announcement email')
  lines.push(`**Subject:** ${kit.announcementEmail?.subject ?? ''}`, '')
  lines.push(kit.announcementEmail?.body ?? '', '')

  lines.push('## Social posts')
  ;(kit.socialPosts ?? []).forEach((s) => {
    lines.push(`### ${s.platform}`, s.text, '')
  })

  lines.push('## One-pager', kit.onePager)

  return lines.join('\n')
}

export default App
