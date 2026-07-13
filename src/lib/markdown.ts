import type { GtmKit } from '../types'

export function kitToMarkdown(productName: string, kit: GtmKit): string {
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
