export interface CoachResponseMetadata {
  provider: 'gemini' | 'openai' | 'rule_based'
  facts?: string[]
  calculations?: string[]
  estimates?: string[]
  suggestions?: string[]
  missingData?: string[]
  actionHref?: string
  actionLabel?: string
  limitations?: string
}

export interface CoachChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  metadata?: CoachResponseMetadata
}

export interface CoachQueryPayload {
  message: string
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
}

