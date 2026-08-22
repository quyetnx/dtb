const KV_KEY = 'site:views'
const BASE_VIEWS = 5_000_000

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestGet(ctx: any): Promise<Response> {
  const raw = await ctx.env.SESSIONS.get(KV_KEY)
  const real = raw ? parseInt(raw, 10) : 0
  return Response.json({ views: BASE_VIEWS + real }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestPost(ctx: any): Promise<Response> {
  const raw = await ctx.env.SESSIONS.get(KV_KEY)
  const real = raw ? parseInt(raw, 10) : 0
  const next = real + 1
  await ctx.env.SESSIONS.put(KV_KEY, String(next))
  return Response.json({ views: BASE_VIEWS + next }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
