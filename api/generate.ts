import Anthropic from '@anthropic-ai/sdk'

interface VercelRequest {
  method?: string
  body: unknown
}

interface VercelResponse {
  status(code: number): VercelResponse
  json(body: unknown): void
}

const GTM_KIT_TOOL = {
  name: 'emit_gtm_kit',
  description: 'Return a complete go-to-market kit for the product launch.',
  input_schema: {
    type: 'object' as const,
    properties: {
      positioningStatement: {
        type: 'string',
        description:
          'Full positioning statement in the "For [target] who [need], [product] is a [category] that [benefit]. Unlike [alternative], we [differentiator]." format.',
      },
      personas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            painPoints: { type: 'array', items: { type: 'string' } },
            goals: { type: 'array', items: { type: 'string' } },
          },
          required: ['name', 'role', 'painPoints', 'goals'],
        },
      },
      messagingPillars: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            pillar: { type: 'string' },
            description: { type: 'string' },
            proofPoints: { type: 'array', items: { type: 'string' } },
          },
          required: ['pillar', 'description', 'proofPoints'],
        },
      },
      competitiveNotes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            competitor: { type: 'string' },
            theirPositioning: { type: 'string' },
            ourAngle: { type: 'string' },
          },
          required: ['competitor', 'theirPositioning', 'ourAngle'],
        },
      },
      pricingTalkingPoints: { type: 'array', items: { type: 'string' } },
      launchChecklist: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            phase: { type: 'string' },
            tasks: { type: 'array', items: { type: 'string' } },
          },
          required: ['phase', 'tasks'],
        },
      },
      launchTimeline: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            timeframe: { type: 'string' },
            milestone: { type: 'string' },
          },
          required: ['timeframe', 'milestone'],
        },
      },
      announcementEmail: {
        type: 'object',
        properties: {
          subject: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['subject', 'body'],
      },
      socialPosts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            text: { type: 'string' },
          },
          required: ['platform', 'text'],
        },
      },
      onePager: {
        type: 'string',
        description: 'A markdown-formatted one-pager summarizing the launch.',
      },
    },
    required: [
      'positioningStatement',
      'personas',
      'messagingPillars',
      'competitiveNotes',
      'pricingTalkingPoints',
      'launchChecklist',
      'launchTimeline',
      'announcementEmail',
      'socialPosts',
      'onePager',
    ],
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

  const body = req.body as Record<string, string> | undefined
  const {
    productName,
    oneLiner,
    targetAudience,
    keyFeatures,
    problemSolved,
    competitors,
    pricingModel,
    launchDate,
    tone,
  } = body ?? {}

  if (!productName || !oneLiner || !targetAudience) {
    res.status(400).json({ error: 'productName, oneLiner, and targetAudience are required' })
    return
  }

  const anthropic = new Anthropic({ apiKey })

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      tools: [GTM_KIT_TOOL],
      tool_choice: { type: 'tool', name: 'emit_gtm_kit' },
      messages: [
        {
          role: 'user',
          content: `Create a complete go-to-market kit for this software product launch.

Product name: ${productName}
One-liner: ${oneLiner}
Target audience: ${targetAudience}
Key features: ${keyFeatures || 'not specified'}
Problem it solves: ${problemSolved || 'not specified'}
Known competitors: ${competitors || 'not specified'}
Pricing model: ${pricingModel || 'not specified'}
Target launch date: ${launchDate || 'not specified'}
Desired tone: ${tone || 'confident, clear, no jargon'}

Produce specific, launch-ready content (not generic placeholders). Use the emit_gtm_kit tool.`,
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
