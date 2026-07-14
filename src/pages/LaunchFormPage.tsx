import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GtmKit, LaunchInputs } from '../types'
import { KIT_STORAGE_KEY } from '../lib/storage'

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

const DEMO_INPUTS: LaunchInputs = {
  productName: 'ShiftReady',
  oneLiner: 'Digital pre-start checks and shift handovers for frontline teams',
  targetAudience:
    'Operations and HSE managers at mid-market industrial companies (manufacturing, logistics, construction) with 200-5,000 frontline workers across multiple sites',
  keyFeatures:
    'Mobile-first inspection checklists with photo capture, automated shift handover reports, real-time issue escalation to supervisors, offline mode for low-connectivity sites, analytics dashboard showing completion rates and recurring hazards by site',
  problemSolved:
    'Paper-based pre-start checks get skipped or pencil-whipped, and critical issues raised at the end of one shift never reach the next crew — leading to equipment damage, near-misses, and compliance gaps that only surface during audits',
  competitors: 'SafetyCulture (iAuditor), UpKeep, Lumiform',
  pricingModel: 'Per-seat, $24/user/month billed annually, volume discounts above 500 seats, free 30-day pilot for one site',
  launchDate: 'October 2026',
  tone: 'Confident and practical, plain English, respects the intelligence of frontline workers — no corporate jargon',
}

export function LaunchFormPage() {
  const navigate = useNavigate()
  const [inputs, setInputs] = useState<LaunchInputs>(EMPTY_INPUTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateField(field: keyof LaunchInputs, value: string) {
    setInputs((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

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
      const kit = data as GtmKit
      const stored = { productName: inputs.productName, kit }
      sessionStorage.setItem(KIT_STORAGE_KEY, JSON.stringify(stored))
      navigate('/kit', { state: stored })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <header>
        <h1>GTM Kit Generator</h1>
        <p>Fill in your launch details, get a complete go-to-market kit.</p>
      </header>

      <form onSubmit={handleSubmit} className="form">
        <button
          type="button"
          className="demo-fill"
          onClick={() => setInputs(DEMO_INPUTS)}
          disabled={loading}
        >
          Fill with demo data
        </button>
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
    </div>
  )
}
