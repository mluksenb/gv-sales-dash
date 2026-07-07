import { getDocDefinition } from './_lib/kyc'

export function GET(): Response {
  return Response.json({ style: 'web+lib', criteria: getDocDefinition('rib')?.criteria.length ?? -1 })
}
