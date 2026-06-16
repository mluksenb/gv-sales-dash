import type {
  ConversationMedium,
  InitiatedBy,
  RawIntercomConversation,
  Resolution,
} from './types.ts'

const MEDIUM_MAP: Record<string, ConversationMedium> = {
  conversation: 'chat',
  email: 'email',
  sms: 'sms',
  whatsapp: 'whatsapp',
}

export function mapMedium(sourceType: string | undefined): ConversationMedium {
  if (!sourceType) return 'other'
  return MEDIUM_MAP[sourceType] ?? 'other'
}

export function mapInitiatedBy(deliveredAs: string | undefined): InitiatedBy {
  if (deliveredAs === 'customer_initiated') return 'customer'
  return 'company'
}

export function classifyResolution(raw: RawIntercomConversation): Resolution {
  if (!raw.ai_agent_participated) return 'human_only'

  const state = raw.ai_agent?.resolution_state
  const humanReplied = raw.statistics?.first_admin_reply_at != null

  if (state === 'confirmed_resolution') return 'fin_confirmed'
  if (state === 'escalated' || humanReplied) return 'fin_escalated'
  if (state === 'assumed_resolution') return 'fin_assumed'

  return humanReplied ? 'fin_escalated' : 'fin_assumed'
}
