import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { GtmKit } from '../types'
import { ErrorBoundary } from '../ErrorBoundary'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { EditableText } from '../components/EditableText'
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
  const [stored, setStored] = useState<StoredKit | null>(() => {
    const raw = sessionStorage.getItem(KIT_STORAGE_KEY)
    if (raw) {
      try {
        return JSON.parse(raw) as StoredKit
      } catch {
        // fall through
      }
    }
    return (location.state as StoredKit | null) ?? null
  })
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['positioning']))
  const [slackStatus, setSlackStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [slackError, setSlackError] = useState<string | null>(null)

  useEffect(() => {
    if (!stored) navigate('/', { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!stored) return null

  const { productName, kit } = stored

  function updateKit(mutate: (kit: GtmKit) => void) {
    setStored((prev) => {
      if (!prev) return prev
      const next = structuredClone(prev)
      mutate(next.kit)
      sessionStorage.setItem(KIT_STORAGE_KEY, JSON.stringify(next))
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

  async function shareToSlack() {
    setSlackStatus('sending')
    setSlackError(null)
    try {
      const res = await fetch('/api/share-slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          positioningStatement: kit.positioningStatement,
          pillars: (kit.messagingPillars ?? []).map((m) => m.pillar),
          launchDate: (kit.launchTimeline ?? []).at(-1)?.timeframe ?? '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to share to Slack')
      setSlackStatus('sent')
      setTimeout(() => setSlackStatus('idle'), 4000)
    } catch (err) {
      setSlackStatus('error')
      setSlackError(err instanceof Error ? err.message : 'Failed to share to Slack')
    }
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
        <button
          className="download"
          onClick={shareToSlack}
          type="button"
          disabled={slackStatus === 'sending'}
        >
          {slackStatus === 'sending'
            ? 'Sharing…'
            : slackStatus === 'sent'
              ? 'Shared ✓'
              : 'Share to Slack'}
        </button>
        {slackStatus === 'error' && slackError && <p className="error small">{slackError}</p>}
        <p className="edit-hint">Click any text in the kit to edit it. Changes save automatically.</p>
      </aside>

      <main className="kit-content">
        <h1>
          <EditableText
            value={productName}
            onSave={(v) =>
              setStored((prev) => {
                if (!prev) return prev
                const next = { ...prev, productName: v }
                sessionStorage.setItem(KIT_STORAGE_KEY, JSON.stringify(next))
                return next
              })
            }
          />
        </h1>

        <ErrorBoundary>
          <CollapsibleSection
            id="positioning"
            title="Positioning statement"
            open={openIds.has('positioning')}
            onToggle={toggleSection}
          >
            <p className="callout">
              <EditableText
                multiline
                value={kit.positioningStatement}
                onSave={(v) => updateKit((k) => (k.positioningStatement = v))}
              />
            </p>
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
                        <strong>
                          <EditableText
                            value={p.name}
                            onSave={(v) => updateKit((k) => (k.personas[i].name = v))}
                          />
                        </strong>
                        <div className="muted">
                          <EditableText
                            value={p.role}
                            onSave={(v) => updateKit((k) => (k.personas[i].role = v))}
                          />
                        </div>
                      </td>
                      <td>
                        <ul>
                          {(p.painPoints ?? []).map((pp, j) => (
                            <li key={j}>
                              <EditableText
                                multiline
                                value={pp}
                                onSave={(v) => updateKit((k) => (k.personas[i].painPoints[j] = v))}
                              />
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <ul>
                          {(p.goals ?? []).map((g, j) => (
                            <li key={j}>
                              <EditableText
                                multiline
                                value={g}
                                onSave={(v) => updateKit((k) => (k.personas[i].goals[j] = v))}
                              />
                            </li>
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
                      <td>
                        <strong>
                          <EditableText
                            value={m.pillar}
                            onSave={(v) => updateKit((k) => (k.messagingPillars[i].pillar = v))}
                          />
                        </strong>
                      </td>
                      <td>
                        <EditableText
                          multiline
                          value={m.description}
                          onSave={(v) => updateKit((k) => (k.messagingPillars[i].description = v))}
                        />
                      </td>
                      <td>
                        <ul>
                          {(m.proofPoints ?? []).map((pp, j) => (
                            <li key={j}>
                              <EditableText
                                multiline
                                value={pp}
                                onSave={(v) =>
                                  updateKit((k) => (k.messagingPillars[i].proofPoints[j] = v))
                                }
                              />
                            </li>
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
                      <td>
                        <strong>
                          <EditableText
                            value={c.competitor}
                            onSave={(v) => updateKit((k) => (k.competitiveNotes[i].competitor = v))}
                          />
                        </strong>
                      </td>
                      <td>
                        <EditableText
                          multiline
                          value={c.theirPositioning}
                          onSave={(v) =>
                            updateKit((k) => (k.competitiveNotes[i].theirPositioning = v))
                          }
                        />
                      </td>
                      <td>
                        <EditableText
                          multiline
                          value={c.ourAngle}
                          onSave={(v) => updateKit((k) => (k.competitiveNotes[i].ourAngle = v))}
                        />
                      </td>
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
                      <td>
                        <EditableText
                          multiline
                          value={pt}
                          onSave={(v) => updateKit((k) => (k.pricingTalkingPoints[i] = v))}
                        />
                      </td>
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
                      <td>
                        <strong>
                          <EditableText
                            value={c.phase}
                            onSave={(v) => updateKit((k) => (k.launchChecklist[i].phase = v))}
                          />
                        </strong>
                      </td>
                      <td>
                        <ul>
                          {(c.tasks ?? []).map((t, j) => (
                            <li key={j}>
                              <EditableText
                                multiline
                                value={t}
                                onSave={(v) => updateKit((k) => (k.launchChecklist[i].tasks[j] = v))}
                              />
                            </li>
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
                      <td>
                        <strong>
                          <EditableText
                            value={t.timeframe}
                            onSave={(v) => updateKit((k) => (k.launchTimeline[i].timeframe = v))}
                          />
                        </strong>
                      </td>
                      <td>
                        <EditableText
                          multiline
                          value={t.milestone}
                          onSave={(v) => updateKit((k) => (k.launchTimeline[i].milestone = v))}
                        />
                      </td>
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
              <p>
                <strong>Subject:</strong>{' '}
                <EditableText
                  value={kit.announcementEmail?.subject ?? ''}
                  onSave={(v) => updateKit((k) => (k.announcementEmail.subject = v))}
                />
              </p>
              <p className="pre">
                <EditableText
                  multiline
                  value={kit.announcementEmail?.body ?? ''}
                  onSave={(v) => updateKit((k) => (k.announcementEmail.body = v))}
                />
              </p>
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
                      <td>
                        <strong>
                          <EditableText
                            value={s.platform}
                            onSave={(v) => updateKit((k) => (k.socialPosts[i].platform = v))}
                          />
                        </strong>
                      </td>
                      <td className="pre">
                        <EditableText
                          multiline
                          value={s.text}
                          onSave={(v) => updateKit((k) => (k.socialPosts[i].text = v))}
                        />
                      </td>
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
            <p className="pre">
              <EditableText
                multiline
                value={kit.onePager}
                onSave={(v) => updateKit((k) => (k.onePager = v))}
              />
            </p>
          </CollapsibleSection>
        </ErrorBoundary>

        <div className="next-step">
          <button type="button" className="next-cta" onClick={() => navigate('/collateral')}>
            Next — generate marketing collateral →
          </button>
        </div>
      </main>
    </div>
  )
}
