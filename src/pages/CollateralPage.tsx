import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CollateralBrief, GtmKit } from '../types'
import { ErrorBoundary } from '../ErrorBoundary'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { COLLATERAL_STORAGE_KEY, KIT_STORAGE_KEY } from '../lib/storage'

interface StoredKit {
  productName: string
  kit: GtmKit
}

const COLLATERAL_OPTIONS = [
  {
    id: 'social-cards',
    label: 'Social media cards',
    description: 'Announcement graphics for LinkedIn, Instagram, and X',
  },
  {
    id: 'posters',
    label: 'Posters & flyers',
    description: 'Print-ready A4/A3 posters for events or office/site walls',
  },
  {
    id: 'email-graphics',
    label: 'Email graphics',
    description: 'Header banner and CTA graphics for the announcement email',
  },
  {
    id: 'landing-imagery',
    label: 'Landing page imagery',
    description: 'Hero image direction and stock/AI imagery for the launch page',
  },
  {
    id: 'ad-banners',
    label: 'Digital ad banners',
    description: 'Standard display sizes: 300x250, 728x90, 160x600',
  },
  {
    id: 'deck-cover',
    label: 'Sales deck cover',
    description: 'Title slide and section divider designs for the launch deck',
  },
]

export function CollateralPage() {
  const navigate = useNavigate()
  const [stored] = useState<StoredKit | null>(() => {
    const raw = sessionStorage.getItem(KIT_STORAGE_KEY)
    if (raw) {
      try {
        return JSON.parse(raw) as StoredKit
      } catch {
        // fall through
      }
    }
    return null
  })
  const [selected, setSelected] = useState<Set<string>>(
    new Set(['social-cards', 'email-graphics', 'landing-imagery']),
  )
  const [briefs, setBriefs] = useState<CollateralBrief[] | null>(() => {
    const raw = sessionStorage.getItem(COLLATERAL_STORAGE_KEY)
    if (raw) {
      try {
        return JSON.parse(raw) as CollateralBrief[]
      } catch {
        // fall through
      }
    }
    return null
  })
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!stored) navigate('/', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!stored) return null

  const { productName, kit } = stored

  function toggleOption(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSection(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/collateral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          positioningStatement: kit.positioningStatement,
          pillars: (kit.messagingPillars ?? []).map((m) => m.pillar),
          selectedTypes: COLLATERAL_OPTIONS.filter((o) => selected.has(o.id)),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate collateral briefs')
      const result = (data.briefs ?? []) as CollateralBrief[]
      setBriefs(result)
      setOpenIds(new Set(result.map((b) => b.type)))
      sessionStorage.setItem(COLLATERAL_STORAGE_KEY, JSON.stringify(result))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function downloadMarkdown() {
    if (!briefs) return
    const lines: string[] = [`# Marketing collateral briefs: ${productName}`, '']
    briefs.forEach((b) => {
      lines.push(`## ${b.title}`)
      lines.push('', '**Formats:**')
      b.formats.forEach((f) => lines.push(`- ${f.name}: ${f.dimensions}`))
      lines.push('', `**Headline:** ${b.headline}`)
      lines.push(`**Subcopy:** ${b.subcopy}`)
      lines.push(`**CTA:** ${b.cta}`, '')
      lines.push(`**Visual direction:** ${b.visualDirection}`)
      lines.push(`**Brand notes:** ${b.brandNotes}`)
      lines.push(`**Canva template keywords:** ${b.canvaKeywords.join(', ')}`)
      lines.push(`**Image prompt:** ${b.imagePrompt}`, '')
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${productName.replace(/\s+/g, '-').toLowerCase()}-collateral-briefs.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page collateral-page">
      <header>
        <h1>Marketing collateral</h1>
        <p>
          Pick the assets you need for the <strong>{productName}</strong> launch — get a Canva-ready
          design brief for each, using your kit's positioning and messaging.
        </p>
      </header>

      <button className="back-link" onClick={() => navigate('/kit')} type="button">
        ← Back to GTM kit
      </button>

      <div className="option-grid">
        {COLLATERAL_OPTIONS.map((o) => (
          <label key={o.id} className={`option-card ${selected.has(o.id) ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={selected.has(o.id)}
              onChange={() => toggleOption(o.id)}
            />
            <div>
              <strong>{o.label}</strong>
              <p className="muted">{o.description}</p>
            </div>
          </label>
        ))}
      </div>

      <button
        type="button"
        className="generate-cta"
        onClick={generate}
        disabled={loading || selected.size === 0}
      >
        {loading ? 'Generating briefs…' : `Generate ${selected.size} design brief${selected.size === 1 ? '' : 's'}`}
      </button>
      {loading && (
        <p className="hint">
          Writing design briefs with copy, dimensions, and visual direction. This usually takes
          20–40 seconds.
        </p>
      )}
      {error && <p className="error">{error}</p>}

      {briefs && briefs.length > 0 && (
        <ErrorBoundary>
          <div className="briefs">
            <button className="download" onClick={downloadMarkdown} type="button">
              Download briefs as Markdown
            </button>
            {briefs.map((b) => (
              <CollapsibleSection
                key={b.type}
                id={b.type}
                title={b.title}
                open={openIds.has(b.type)}
                onToggle={toggleSection}
              >
                <div className="table-wrap">
                  <table>
                    <tbody>
                      <tr>
                        <td>Formats</td>
                        <td>
                          <ul>
                            {(b.formats ?? []).map((f, i) => (
                              <li key={i}>
                                {f.name} — {f.dimensions}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <td>Headline</td>
                        <td>{b.headline}</td>
                      </tr>
                      <tr>
                        <td>Subcopy</td>
                        <td>{b.subcopy}</td>
                      </tr>
                      <tr>
                        <td>CTA</td>
                        <td>{b.cta}</td>
                      </tr>
                      <tr>
                        <td>Visual direction</td>
                        <td>{b.visualDirection}</td>
                      </tr>
                      <tr>
                        <td>Brand notes</td>
                        <td>{b.brandNotes}</td>
                      </tr>
                      <tr>
                        <td>Canva keywords</td>
                        <td>{(b.canvaKeywords ?? []).join(', ')}</td>
                      </tr>
                      <tr>
                        <td>Image prompt</td>
                        <td>{b.imagePrompt}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CollapsibleSection>
            ))}
          </div>
        </ErrorBoundary>
      )}
    </div>
  )
}
