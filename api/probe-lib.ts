import { getDocDefinition } from './_lib/kyc.js'

export function GET(): Response {
  return Response.json({ style: 'web+lib', criteria: getDocDefinition('rib')?.criteria.length ?? -1 })
}
