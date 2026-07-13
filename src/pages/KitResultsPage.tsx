import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { GtmKit } from '../types'
import { ErrorBoundary } from '../ErrorBoundary'
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

export function KitResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [stored, setStored] = useState<StoredKit | null>(
    (location.state as StoredKit | null) ?? null,
  )

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
            <a key={s.id} href={`#${s.id}`}>
              {s.label}
            </a>
          ))}
        </nav>
        <button className="download" onClick={downloadMarkdown} type="button">
          Download as Markdown
        </button>
      </aside>

      <main className="kit-content">
        <h1>{productName}</h1>

        <ErrorBoundary>
          <section id="positioning">
            <h2>Positioning statement</h2>
            <p className="callout">{kit.positioningStatement}</p>
          </section>

          <section id="personas">
            <h2>Target personas</h2>
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
          </section>

          <section id="messaging">
            <h2>Messaging pillars</h2>
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
          </section>

          <section id="competitive">
            <h2>Competitive positioning</h2>
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
          </section>

          <section id="pricing">
            <h2>Pricing talking points</h2>
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
          </section>

          <section id="checklist">
            <h2>Launch checklist</h2>
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
          </section>

          <section id="timeline">
            <h2>Launch timeline</h2>
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
          </section>

          <section id="email">
            <h2>Announcement email</h2>
            <div className="card">
              <p><strong>Subject:</strong> {kit.announcementEmail?.subject}</p>
              <p className="pre">{kit.announcementEmail?.body}</p>
            </div>
          </section>

          <section id="social">
            <h2>Social posts</h2>
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
          </section>

          <section id="onepager">
            <h2>One-pager</h2>
            <p className="pre">{kit.onePager}</p>
          </section>
        </ErrorBoundary>
      </main>
    </div>
  )
}
