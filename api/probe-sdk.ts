import Anthropic from '@anthropic-ai/sdk'

export function GET(): Response {
  return Response.json({ style: 'web+sdk', sdkLoaded: typeof Anthropic === 'function', hasKey: Boolean(process.env.CLAUDE_API_KEY) })
}
