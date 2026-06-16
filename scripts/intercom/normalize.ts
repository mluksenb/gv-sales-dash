import { classifyResolution, mapInitiatedBy, mapMedium } from './classify.ts'
import { hasMeaningfulHtmlContent, stripHtml, stripHtmlInline } from './stripHtml.ts'
import type {
  IntercomAttachment,
  IntercomAuthor,
  IntercomConversationPart,
  RawIntercomConversation,
  StoredConversation,
} from './types.ts'

interface TranscriptLine {
  speaker: string
  text: string
  createdAt: number
}

function unixToIso(timestamp: number | null | undefined): string | null {
  if (timestamp == null) return null
  return new Date(timestamp * 1000).toISOString()
}

function stripSubjectHtml(subject: string): string {
  return stripHtmlInline(subject)
}

function getAttachmentNames(attachments: IntercomAttachment[] | undefined): string[] {
  if (!attachments?.length) return []
  return attachments.map((a) => a.name).filter((name): name is string => Boolean(name))
}

function formatAttachmentSuffix(attachments: IntercomAttachment[] | undefined): string {
  const names = getAttachmentNames(attachments)
  if (!names.length) return ''
  return ` [Attachment: ${names.join(', ')}]`
}

function speakerLabel(author: IntercomAuthor | undefined): string {
  const type = author?.type

  if (type === 'user' || type === 'lead') return 'Customer'

  if (type === 'admin') {
    const name = author?.name?.trim()
    if (!name) return 'Agent'
    return name.split(/\s+/)[0] ?? 'Agent'
  }

  if (type === 'bot') {
    if (author?.from_ai_agent) return 'Fin'
    return 'System'
  }

  return 'Unknown'
}

function redactCustomerName(text: string, customerName: string | undefined): string {
  if (!customerName?.trim()) return text
  const escaped = customerName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(escaped, 'gi'), 'Customer')
}

function buildLineText(
  body: string | null | undefined,
  attachments: IntercomAttachment[] | undefined,
  customerName: string | undefined,
): string | null {
  const hasBody = hasMeaningfulHtmlContent(body)
  const attachmentSuffix = formatAttachmentSuffix(attachments)

  if (!hasBody && !attachmentSuffix) return null

  let text = hasBody ? stripHtml(body!) : ''
  text = redactCustomerName(text, customerName)

  if (!text && attachmentSuffix) {
    return attachmentSuffix.trim()
  }

  return `${text}${attachmentSuffix}`.trim()
}

function isTranscriptPart(part: IntercomConversationPart): boolean {
  if (part.part_type === 'comment') return true
  // Email admin replies are often posted on assignment parts.
  if (part.part_type === 'assignment') {
    return (
      hasMeaningfulHtmlContent(part.body) ||
      getAttachmentNames(part.attachments).length > 0
    )
  }
  return false
}

function extractAiSummary(parts: IntercomConversationPart[]): string | undefined {
  const summaries: string[] = []

  for (const part of parts) {
    if (part.part_type !== 'note' && part.part_type !== 'note_and_reopen') continue
    if (part.author?.type === 'admin') continue
    if (!hasMeaningfulHtmlContent(part.body)) continue

    const text = stripHtml(part.body!)
    if (text) summaries.push(text)
  }

  if (!summaries.length) return undefined
  return summaries.join('\n\n')
}

function buildTranscriptLines(raw: RawIntercomConversation): TranscriptLine[] {
  const parts = raw.conversation_parts?.conversation_parts ?? []
  const customerName = raw.source?.author?.name
  const lines: TranscriptLine[] = []

  const sourceBody = raw.source?.body
  const sourceAttachments = raw.source?.attachments
  const sourceLine = buildLineText(sourceBody, sourceAttachments, customerName)

  if (sourceLine && raw.created_at != null) {
    lines.push({
      speaker: speakerLabel(raw.source?.author),
      text: sourceLine,
      createdAt: raw.created_at,
    })
  }

  for (const part of parts) {
    if (!isTranscriptPart(part)) continue
    if (part.created_at == null) continue

    const lineText = buildLineText(part.body, part.attachments, customerName)
    if (!lineText) continue

    lines.push({
      speaker: speakerLabel(part.author),
      text: lineText,
      createdAt: part.created_at,
    })
  }

  lines.sort((a, b) => a.createdAt - b.createdAt)

  if (lines.length > 1 && sourceLine) {
    const firstComment = lines.find(
      (line, index) =>
        index > 0 &&
        line.speaker === speakerLabel(raw.source?.author) &&
        line.text === sourceLine,
    )
    if (firstComment && lines[0]?.text === sourceLine) {
      return lines.filter((line, index) => !(index > 0 && line === firstComment))
    }
  }

  return dedupeConsecutiveLines(lines)
}

function dedupeConsecutiveLines(lines: TranscriptLine[]): TranscriptLine[] {
  const result: TranscriptLine[] = []

  for (const line of lines) {
    const previous = result[result.length - 1]
    if (
      previous &&
      previous.speaker === line.speaker &&
      previous.text === line.text &&
      previous.createdAt === line.createdAt
    ) {
      continue
    }
    result.push(line)
  }

  return result
}

function formatTranscript(lines: TranscriptLine[]): string {
  return lines.map((line) => `${line.speaker}: ${line.text}`).join('\n\n')
}

function resolveLastMessageAt(
  lines: TranscriptLine[],
  updatedAt: number | undefined,
  createdAt: number | undefined,
): string {
  if (lines.length > 0) {
    const maxTs = Math.max(...lines.map((line) => line.createdAt))
    return new Date(maxTs * 1000).toISOString()
  }

  const fallback = updatedAt ?? createdAt ?? 0
  return new Date(fallback * 1000).toISOString()
}

export function normalizeConversation(raw: RawIntercomConversation): StoredConversation {
  const medium = mapMedium(raw.source?.type)
  const lines = buildTranscriptLines(raw)
  const parts = raw.conversation_parts?.conversation_parts ?? []

  const stored: StoredConversation = {
    id: String(raw.id),
    medium,
    initiatedBy: mapInitiatedBy(raw.source?.delivered_as),
    state: (raw.state as StoredConversation['state']) ?? 'closed',
    createdAt: unixToIso(raw.created_at) ?? new Date(0).toISOString(),
    firstReplyAt: unixToIso(raw.statistics?.first_contact_reply_at),
    lastMessageAt: resolveLastMessageAt(lines, raw.updated_at, raw.created_at),
    resolution: classifyResolution(raw),
    transcript: formatTranscript(lines),
  }

  if (medium === 'email') {
    const subjectSource = raw.title ?? raw.source?.subject
    if (subjectSource) {
      const subject = stripSubjectHtml(subjectSource)
      if (subject) stored.subject = subject
    }
  }

  if (medium === 'chat') {
    const aiTitle = raw.custom_attributes?.['AI Title']
    if (typeof aiTitle === 'string' && aiTitle.trim()) {
      stored.aiTitle = aiTitle.trim()
    }

    const aiSummary = extractAiSummary(parts)
    if (aiSummary) stored.aiSummary = aiSummary
  }

  const language = raw.custom_attributes?.Language
  if (typeof language === 'string' && language.trim()) {
    stored.language = language.trim()
  }

  return stored
}
