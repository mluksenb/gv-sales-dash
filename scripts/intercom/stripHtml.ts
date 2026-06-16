const BLOCK_TAGS = new Set([
  'p',
  'div',
  'br',
  'li',
  'tr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
])

export function stripHtml(html: string): string {
  let text = html

  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')

  text = text.replace(/<[^>]+>/g, '')

  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")

  text = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line, index, lines) => {
      if (line.length > 0) return true
      return index > 0 && lines[index - 1]?.length > 0
    })
    .join('\n')
    .trim()

  return text
}

export function stripHtmlInline(html: string): string {
  const withBreaks = html.replace(/<br\s*\/?>/gi, ' ')
  return stripHtml(withBreaks).replace(/\n+/g, ' ').trim()
}

export function hasMeaningfulHtmlContent(html: string | null | undefined): boolean {
  if (!html) return false
  return stripHtml(html).length > 0
}
