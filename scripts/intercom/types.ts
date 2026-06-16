export type ConversationMedium = 'chat' | 'email' | 'sms' | 'whatsapp' | 'other'

export type InitiatedBy = 'customer' | 'company'

export type ConversationState = 'open' | 'closed' | 'snoozed'

export type Resolution =
  | 'fin_confirmed'
  | 'fin_assumed'
  | 'fin_escalated'
  | 'human_only'

export interface StoredConversation {
  id: string
  medium: ConversationMedium
  initiatedBy: InitiatedBy
  state: ConversationState
  createdAt: string
  firstReplyAt: string | null
  lastMessageAt: string
  resolution: Resolution
  transcript: string
  subject?: string
  aiTitle?: string
  aiSummary?: string
  /** Gemini-generated summary of the customer's problem / reason for contact. */
  issueSummary?: string
  /** Primary support taxonomy subcategory label (e.g. "Sécurité"). */
  topic?: string
  /** Parent category for `topic` (e.g. "Transactions" for "Versements et prélèvements"). */
  topicCategory?: string
  /** Up to two additional subcategory labels when multiple distinct needs apply. */
  secondaryTopics?: string[]
  /** Parent categories for `secondaryTopics`, same order. */
  secondaryTopicCategories?: string[]
  /** Classifier confidence in topic assignment. */
  topicConfidence?: 'high' | 'medium' | 'low'
  /** False for spam, prospection, or non-customer mail — still has a topic for analytics. */
  isSupportTicket?: boolean
  language?: string
}

export type TopicConfidence = 'high' | 'medium' | 'low'

export interface TopicClassification {
  topic: string
  secondaryTopics: string[]
  topicConfidence: TopicConfidence
  isSupportTicket: boolean
  classifiedBy?: 'rule' | 'gemini'
}

export interface ManifestEntry {
  id: string
  medium: ConversationMedium
  resolution: Resolution
  createdAt: string
  lastMessageAt: string
  exportedAt: string
}

/** Minimal shapes for parsing raw Intercom get_conversation responses. */
export interface IntercomAttachment {
  name?: string
}

export interface IntercomAuthor {
  type?: string
  name?: string
  from_ai_agent?: boolean
}

export interface IntercomConversationPart {
  part_type?: string
  body?: string | null
  created_at?: number
  author?: IntercomAuthor
  attachments?: IntercomAttachment[]
}

export interface IntercomSource {
  type?: string
  delivered_as?: string
  subject?: string
  body?: string | null
  author?: IntercomAuthor
  attachments?: IntercomAttachment[]
}

export interface IntercomStatistics {
  first_contact_reply_at?: number | null
  first_admin_reply_at?: number | null
}

export interface IntercomAiAgent {
  resolution_state?: string | null
}

export interface RawIntercomConversation {
  id: string | number
  created_at?: number
  updated_at?: number
  state?: string
  title?: string | null
  source?: IntercomSource
  statistics?: IntercomStatistics
  custom_attributes?: Record<string, unknown>
  ai_agent_participated?: boolean
  ai_agent?: IntercomAiAgent | null
  conversation_parts?: {
    conversation_parts?: IntercomConversationPart[]
  }
}
