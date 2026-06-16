export type Medium = 'chat' | 'email' | 'sms' | 'whatsapp' | 'other'

export type Resolution =
  | 'fin_confirmed'
  | 'fin_assumed'
  | 'fin_escalated'
  | 'human_only'

export type Confidence = 'high' | 'medium' | 'low'

export interface Conversation {
  id: string
  medium: Medium
  resolution: Resolution
  createdAt: string
  lastMessageAt: string
  title?: string
  summary?: string
  topic: string
  topicCategory: string
  secondaryTopics?: string[]
  topicConfidence?: Confidence
  isSupportTicket: boolean
  language?: string
}

export interface DashboardMeta {
  generatedAt: string
  count: number
  dateMin: string
  dateMax: string
  intercomWorkspaceId: string
  categories: string[]
  topicsByCategory: Record<string, string[]>
  topicOrder: string[]
}

export interface DashboardData {
  meta: DashboardMeta
  conversations: Conversation[]
}
