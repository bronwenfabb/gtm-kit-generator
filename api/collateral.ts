import Anthropic from '@anthropic-ai/sdk'

interface VercelRequest {
  method?: string
  body: unknown
}

interface VercelResponse {
  status(code: number): VercelResponse
  json(body: unknown): void
}

const COLLATERAL_TOOL = {
  name: 'emit_collateral_briefs',
  description: 'Return Canva-ready design briefs for the selected collateral types.',
  input_schema: {
    type: 'object' as const,
    properties: {
      briefs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'The collateral type id this brief is for.' },
            title: { type: 'string', description: 'Short human title, e.g. "LinkedIn announcement card".' },
            formats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  dimensions: { type: 'string', description: 'e.g. "1200 x 627 px"' },
                },
                required: ['name', 'dimensions'],
              },
            },
            headline: { type: 'string', description: 'The exact headline copy to place on the design.' },
            subcopy: { type: 'string', description: 'Supporting copy for the design.' },
            cta: { type: 'string', description: 'Call-to-action text.' },
            visualDirection: {
              type: 'string',
              description: 'Layout and imagery direction a designer or Canva user can follow.',
            },
            brandNotes: {
              type: 'string',
              description: 'Color, typography, and logo placement notes.',
            },
            canvaKeywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'Search terms to find suitable Canva templates.',
            },
            imagePrompt: {
              type: 'string',
              description: 'A prompt for AI image generation or stock photo search.',
            },
          },
          required: [
            'type',
            'title',
            'formats',
            'headline',
            'subcopy',
            'cta',
            'visualDirection',
            'brandNotes',
            'canvaKeywords',
            'imagePrompt',
          ],
        },
      },
    },
    required: ['briefs'],
  },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY' })
    return
  }

  const body = req.body as
    | {
        productName?: string
        positioningStatement?: string
        pillars?: string[]
        tone?: string
        selectedTypes?: { id: string; label: string; description: string }[]
      }
    | undefined
  const { productName, positioningStatement, pillars, tone, selectedTypes } = body ?? {}

  if (!productName || !selectedTypes?.length) {
    res.status(400).json({ error: 'productName and at least one selected collateral type are required' })
    return
  }

  const anthropic = new Anthropic({ apiKey })

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8192,
      tools: [COLLATERAL_TOOL],
      tool_choice: { type: 'tool', name: 'emit_collateral_briefs' },
      messages: [
        {
          role: 'user',
          content: `Create Canva-ready design briefs for a product launch. One brief per selected collateral type.

Product: ${productName}
Positioning: ${positioningStatement || 'not specified'}
Messaging pillars: ${pillars?.join('; ') || 'not specified'}
Tone: ${tone || 'confident, clear, no jargon'}

Selected collateral types:
${selectedTypes.map((t) => `- id: ${t.id} — ${t.label}: ${t.description}`).join('\n')}

For each type produce specific, ready-to-use content: exact headline/subcopy/CTA text (not placeholders), correct pixel dimensions for each format, concrete visual direction, brand notes, Canva template search keywords, and an image prompt. Use the emit_collateral_briefs tool.`,
        },
      ],
    })

    const toolUse = message.content.find((block) => block.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      res.status(502).json({ error: 'Model did not return structured output' })
      return
    }

    res.status(200).json(toolUse.input)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(502).json({ error: `Claude API error: ${message}` })
  }
}
