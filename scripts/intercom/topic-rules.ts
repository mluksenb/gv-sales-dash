import { TOPIC_PROSPECTION } from './taxonomy-labels.ts'
import { isSecurityIncidentResponse, TOPIC_SECURITY } from './topics.ts'
import type { StoredConversation, TopicClassification } from './types.ts'

const FORWARDED_SUBJECT = /^(re:\s*)?(fwd?|tr|fw)\s*:/i

const PROSPECTION_SUBJECT =
  /meta|facebook|trustpilot|badge\s*bleu|partenariat|optimisation.*(campagne|publicit)|troph[eé]es|innovation|programme.*avis/i

const PROSPECTION_BODY =
  /je (vous )?contacte pour vous proposer|offre de services|optimiser la performance de (vos|mes) campagnes|badge.{0,25}bleu|demande de partenariat suspect|arnaque|phishing|publicit[eé] meta|trustpilot/i

/** Job applications to Goodvest — not third-party job-board pricing mail. */
const RECRUITMENT =
  /candidature|alternance|\bstage\b|postuler|\bcv\b|travailler chez goodvest|rejoindre (?:l[''])?équipe goodvest|emploi chez goodvest/i

/** Bulk-mail footers and list-unsubscribe boilerplate. */
const NEWSLETTER_FOOTER =
  /unsubscribe|update your preferences|g[eé]rer vos pr[eé]f[eé]rences|si vous souhaitez vous d[eé]sinscrire de notre newsletter|\bSe d[eé]sinscrire\b|ne plus recevoir de messages|view (email )?in browser|afficher dans le navigateur|consultez la version en ligne|lire cette newsletter|all rights reserved|tous droits r[eé]serv[eé]s|this email was sent to|you(?:'ve| have) received this email|r[eé]siliable en ligne|si cette (?:lettre|newsletter) ne s'affiche pas|copyright/i

/** Promotional / event-invite copy typical of marketing blasts. */
const NEWSLETTER_PROMO =
  /newsletter|offre sp[eé]ciale|early bird|book your spot|register for|apply for a spot|places limitées|inscription\s*:|je profite de l'offre|j'en profite|limited time only|retrouvez-nous pr[eè]s de chez vous/i

/** Invisible-character padding used to evade spam filters in bulk mail. */
const INVISIBLE_CHAR_RUN = /[\u034F\u00AD\u200B-\u200D\u2060\uFEFF\u00A0]{40,}/

function conversationText(conversation: StoredConversation): string {
  return `${conversation.subject ?? ''}\n${conversation.transcript}`
}

/**
 * Customer-authored lines only — avoids agent boilerplate (e.g. "OPCVM") polluting rules.
 */
export function extractCustomerText(conversation: StoredConversation): string {
  const parts: string[] = []
  if (conversation.subject?.trim()) {
    parts.push(conversation.subject)
  }

  for (const line of conversation.transcript.split('\n')) {
    const match = line.match(/^([^:]+):(.*)$/)
    if (!match) continue
    const speaker = match[1].trim()
    if (speaker === 'Customer' || speaker === 'Unknown') {
      parts.push(match[2].trim())
    }
  }

  return parts.join('\n')
}

function countPatternMatches(pattern: RegExp, text: string): number {
  const flags = pattern.flags.replace('g', '')
  const global = new RegExp(pattern.source, `${flags}g`)
  return [...text.matchAll(global)].length
}

function isAgentSpeaker(speaker: string): boolean {
  if (speaker === 'Customer' || speaker === 'Unknown') return false
  if (speaker === 'Agent' || speaker === 'Fin' || speaker === 'System') return true
  // Admin replies use a single first name (e.g. "Joseph:").
  return /^[A-Z][a-z]+$/.test(speaker)
}

function hasNonCustomerReply(conversation: StoredConversation): boolean {
  for (const line of conversation.transcript.split('\n')) {
    const match = line.match(/^([^:]+):/)
    if (!match) continue
    if (isAgentSpeaker(match[1].trim())) {
      return true
    }
  }
  return false
}

/**
 * Inbound marketing newsletters and bulk promotional mail — safe to skip LLM when matched.
 */
export function isMarketingNewsletter(conversation: StoredConversation): boolean {
  if (isProspectionSpam(conversation)) return false
  if (hasNonCustomerReply(conversation)) return false

  const text = conversationText(conversation)
  const footerMatches = countPatternMatches(NEWSLETTER_FOOTER, text)
  const promoMatches = countPatternMatches(NEWSLETTER_PROMO, text)
  const hasInvisiblePadding = INVISIBLE_CHAR_RUN.test(text)

  if (footerMatches >= 2) return true
  if (footerMatches >= 1 && promoMatches >= 1) return true
  if (footerMatches >= 1 && hasInvisiblePadding) return true
  if (/newsletter/i.test(text) && footerMatches >= 1) return true

  return false
}

/**
 * Non-support inbound mail that should not receive a Gemini issue summary.
 */
export function shouldSkipSummarization(conversation: StoredConversation): boolean {
  return (
    isProspectionSpam(conversation) ||
    isMarketingNewsletter(conversation) ||
    isRecruitmentInquiry(conversation)
  )
}

/**
 * Strong prospection/spam signals — safe to skip LLM when matched.
 */
export function isProspectionSpam(conversation: StoredConversation): boolean {
  const subject = conversation.subject ?? ''
  const customerText = extractCustomerText(conversation)

  if (FORWARDED_SUBJECT.test(subject) && PROSPECTION_SUBJECT.test(`${subject}\n${customerText}`)) {
    return true
  }

  if (PROSPECTION_SUBJECT.test(subject) && PROSPECTION_BODY.test(customerText)) {
    return true
  }

  if (FORWARDED_SUBJECT.test(subject) && PROSPECTION_BODY.test(customerText)) {
    return true
  }

  return false
}

export function isRecruitmentInquiry(conversation: StoredConversation): boolean {
  const customerText = extractCustomerText(conversation)
  const text = customerText || (conversation.issueSummary ?? '')
  return RECRUITMENT.test(text) && !isProspectionSpam(conversation)
}

/**
 * Rule-based classification. Returns a full result when confidence is high
 * enough to skip Gemini; otherwise null.
 */
export function classifyByRules(
  conversation: StoredConversation,
): TopicClassification | null {
  if (isSecurityIncidentResponse(conversation)) {
    return {
      topic: TOPIC_SECURITY,
      secondaryTopics: [],
      topicConfidence: 'high',
      isSupportTicket: true,
      classifiedBy: 'rule',
    }
  }

  if (isProspectionSpam(conversation) || isMarketingNewsletter(conversation)) {
    return {
      topic: TOPIC_PROSPECTION,
      secondaryTopics: [],
      topicConfidence: 'high',
      isSupportTicket: false,
      classifiedBy: 'rule',
    }
  }

  if (isRecruitmentInquiry(conversation)) {
    return {
      topic: 'Recrutement',
      secondaryTopics: [],
      topicConfidence: 'high',
      isSupportTicket: false,
      classifiedBy: 'rule',
    }
  }

  return null
}
