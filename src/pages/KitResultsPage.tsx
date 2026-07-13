import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { GtmKit } from '../types'
import { ErrorBoundary } from '../ErrorBoundary'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { kitToMarkdown } from '../lib/markdown'
import { KIT_STORAGE_KEY } from '../lib/storage'

interface StoredKit {
  productName: string
  kit: GtmKit
}

const SECTIONS = [
  { id: 'positioning', label: 'Positioning' },
  { id: 'personas', label: 'Personas' },
  { id: 'messaging', label: 'Messaging pillars' },
  { id: 'competitive', label: 'Competitive positioning' },
  { id: 'pricing', label: 'Pricing talking points' },
  { id: 'checklist', label: 'Launch checklist' },
  { id: 'timeline', label: 'Launch timeline' },
  { id: 'email', label: 'Announcement email' },
  { id: 'social', label: 'Social posts' },
  { id: 'onepager', label: 'One-pager' },
]

const ALL_IDS = SECTIONS.map((s) => s.id)

export function KitResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [stored, setStored] = useState<StoredKit | null>(
    (location.state as StoredKit | null) ?? null,
  )
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['positioning']))

  useEffect(() => {
    if (stored) return
    const raw = sessionStorage.getItem(KIT_STORAGE_KEY)
    if (raw) {
      try {
        setStored(JSON.parse(raw) as StoredKit)
        return
      } catch {
        // fall through to redirect
      }
    }
    navigate('/', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!stored) return null

  const { productName, kit } = stored

  function toggleSection(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function goToSection(id: string) {
    setOpenIds((prev) => new Set(prev).add(id))
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function downloadMarkdown() {
    const md = kitToMarkdown(productName, kit)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${productName.replace(/\s+/g, '-').toLowerCase() || 'gtm-kit'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="kit-page">
      <aside className="kit-nav">
        <button className="back-link" onClick={() => navigate('/')} type="button">
          ← New kit
        </button>
        <nav>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault()
                goToSection(s.id)
              }}
            >
              {s.label}
            </a>
          ))}
        </nav>
        <div className="nav-actions">
          <button type="button" onClick={() => setOpenIds(new Set(ALL_IDS))}>
            Expand all
          </button>
          <button type="button" onClick={() => setOpenIds(new Set())}>
            Collapse all
          </button>
        </div>
        <button className="download" onClick={downloadMarkdown} type="button">
          Download as Markdown
        </button>
      </aside>

      <main className="kit-content">
        <h1>{productName}</h1>

        <ErrorBoundary>
          <CollapsibleSection
            id="positioning"
            title="Positioning statement"
            open={openIds.has('positioning')}
            onToggle={toggleSection}
          >
            <p className="callout">{kit.positioningStatement}</p>
          </CollapsibleSection>

          <CollapsibleSection
            id="personas"
            title="Target personas"
            open={openIds.has('personas')}
            onToggle={toggleSection}
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>Pain points</th>
                    <th>Goals</th>
                  </tr>
                </thead>
                <tbody>
                  {(kit.personas ?? []).map((p, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{p.name}</strong>
                        <div className="muted">{p.role}</div>
                      </td>
                      <td>
                        <ul>
                          {(p.painPoints ?? []).map((pp, j) => (
                            <li key={j}>{pp}</li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <ul>
                          {(p.goals ?? []).map((g, j) => (
                            <li key={j}>{g}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="messaging"
            title="Messaging pillars"
            open={openIds.has('messaging')}
            onToggle={toggleSection}
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pillar</th>
                    <th>Description</th>
                    <th>Proof points</th>
                  </tr>
                </thead>
                <tbody>
                  {(kit.messagingPillars ?? []).map((m, i) => (
                    <tr key={i}>
                      <td><strong>{m.pillar}</strong></td>
                      <td>{m.description}</td>
                      <td>
                        <ul>
                          {(m.proofPoints ?? []).map((pp, j) => (
                            <li key={j}>{pp}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="competitive"
            title="Competitive positioning"
            open={openIds.has('competitive')}
            onToggle={toggleSection}
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Competitor</th>
                    <th>Their positioning</th>
                    <th>Our angle</th>
                  </tr>
                </thead>
                <tbody>
                  {(kit.competitiveNotes ?? []).map((c, i) => (
                    <tr key={i}>
                      <td><strong>{c.competitor}</strong></td>
                      <td>{c.theirPositioning}</td>
                      <td>{c.ourAngle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="pricing"
            title="Pricing talking points"
            open={openIds.has('pricing')}
            onToggle={toggleSection}
          >
            <div className="table-wrap">
              <table>
                <tbody>
                  {(kit.pricingTalkingPoints ?? []).map((pt, i) => (
                    <tr key={i}>
                      <td>{pt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="checklist"
            title="Launch checklist"
            open={openIds.has('checklist')}
            onToggle={toggleSection}
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Phase</th>
                    <th>Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {(kit.launchChecklist ?? []).map((c, i) => (
                    <tr key={i}>
                      <td><strong>{c.phase}</strong></td>
                      <td>
                        <ul>
                          {(c.tasks ?? []).map((t, j) => (
                            <li key={j}>{t}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="timeline"
            title="Launch timeline"
            open={openIds.has('timeline')}
            onToggle={toggleSection}
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Timeframe</th>
                    <th>Milestone</th>
                  </tr>
                </thead>
                <tbody>
                  {(kit.launchTimeline ?? []).map((t, i) => (
                    <tr key={i}>
                      <td><strong>{t.timeframe}</strong></td>
                      <td>{t.milestone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="email"
            title="Announcement email"
            open={openIds.has('email')}
            onToggle={toggleSection}
          >
            <div className="card">
              <p><strong>Subject:</strong> {kit.announcementEmail?.subject}</p>
              <p className="pre">{kit.announcementEmail?.body}</p>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="social"
            title="Social posts"
            open={openIds.has('social')}
            onToggle={toggleSection}
          >
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Post</th>
                  </tr>
                </thead>
                <tbody>
                  {(kit.socialPosts ?? []).map((s, i) => (
                    <tr key={i}>
                      <td><strong>{s.platform}</strong></td>
                      <td className="pre">{s.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="onepager"
            title="One-pager"
            open={openIds.has('onepager')}
            onToggle={toggleSection}
          >
            <p className="pre">{kit.onePager}</p>
          </CollapsibleSection>
        </ErrorBoundary>
      </main>
    </div>
  )
}
