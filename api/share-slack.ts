interface VercelRequest {
  method?: string
  body: unknown
}

interface VercelResponse {
  status(code: number): VercelResponse
  json(body: unknown): void
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    res.status(501).json({
      error:
        'Slack sharing is not configured yet. Add a SLACK_WEBHOOK_URL environment variable in Vercel (create an incoming webhook at api.slack.com/apps).',
    })
    return
  }

  const body = req.body as
    | { productName?: string; positioningStatement?: string; pillars?: string[]; launchDate?: string }
    | undefined
  const { productName, positioningStatement, pillars, launchDate } = body ?? {}

  if (!productName) {
    res.status(400).json({ error: 'productName is required' })
    return
  }

  const lines = [
    `*New GTM kit ready for review: ${productName}*`,
    '',
    positioningStatement ? `>${positioningStatement}` : '',
    pillars?.length ? `*Messaging pillars:* ${pillars.join(' · ')}` : '',
    launchDate ? `*Target launch:* ${launchDate}` : '',
    '',
    'Full kit (personas, checklist, launch copy, one-pager) available in the GTM Kit Generator — download the Markdown for the complete version.',
  ].filter((l) => l !== '')

  try {
    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: lines.join('\n') }),
    })
    if (!slackRes.ok) {
      const detail = await slackRes.text()
      res.status(502).json({ error: `Slack rejected the message: ${detail.slice(0, 200)}` })
      return
    }
    res.status(200).json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(502).json({ error: `Could not reach Slack: ${message}` })
  }
}
