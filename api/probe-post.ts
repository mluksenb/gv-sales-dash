export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null)
  return Response.json({ style: 'web-post', received: body })
}
