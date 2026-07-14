export interface LaunchInputs {
  productName: string
  oneLiner: string
  targetAudience: string
  keyFeatures: string
  problemSolved: string
  competitors: string
  pricingModel: string
  launchDate: string
  tone: string
}

export interface Persona {
  name: string
  role: string
  painPoints: string[]
  goals: string[]
}

export interface MessagingPillar {
  pillar: string
  description: string
  proofPoints: string[]
}

export interface CompetitiveNote {
  competitor: string
  theirPositioning: string
  ourAngle: string
}

export interface ChecklistPhase {
  phase: string
  tasks: string[]
}

export interface TimelineMilestone {
  timeframe: string
  milestone: string
}

export interface SocialPost {
  platform: string
  text: string
}

export interface CollateralFormat {
  name: string
  dimensions: string
}

export interface CollateralBrief {
  type: string
  title: string
  formats: CollateralFormat[]
  headline: string
  subcopy: string
  cta: string
  visualDirection: string
  brandNotes: string
  canvaKeywords: string[]
  imagePrompt: string
}

export interface GtmKit {
  positioningStatement: string
  personas: Persona[]
  messagingPillars: MessagingPillar[]
  competitiveNotes: CompetitiveNote[]
  pricingTalkingPoints: string[]
  launchChecklist: ChecklistPhase[]
  launchTimeline: TimelineMilestone[]
  announcementEmail: {
    subject: string
    body: string
  }
  socialPosts: SocialPost[]
  onePager: string
}
