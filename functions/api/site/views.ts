const KV_KEY = 'site:views'
const KV_BASE_KEY = 'site:views:base'
const DEFAULT_BASE = 5_000_000

async function getBase(ctx: { env: { SESSIONS: KVNamespace } }): Promise<number> {
  const raw = await ctx.env.SESSIONS.get(KV_BASE_KEY)
  return raw ? parseInt(raw, 10) : DEFAULT_BASE
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestGet(ctx: any): Promise<Response> {
  const [rawReal, base] = await Promise.all([ctx.env.SESSIONS.get(KV_KEY), getBase(ctx)])
  const real = rawReal ? parseInt(rawReal, 10) : 0
  return Response.json({ views: base + real }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

// Increment on page visit (public)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestPost(ctx: any): Promise<Response> {
  const [rawReal, base] = await Promise.all([ctx.env.SESSIONS.get(KV_KEY), getBase(ctx)])
  const real = rawReal ? parseInt(rawReal, 10) : 0
  const next = real + 1
  await ctx.env.SESSIONS.put(KV_KEY, String(next))
  return Response.json({ views: base + next }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

// Admin: set total view count manually
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestPut(ctx: any): Promise<Response> {
  const body = await ctx.request.json() as { views?: number }
  const total = Math.max(0, Math.floor(body.views ?? 0))
  // Store total as base, reset real counter to 0
  await Promise.all([
    ctx.env.SESSIONS.put(KV_BASE_KEY, String(total)),
    ctx.env.SESSIONS.put(KV_KEY, '0'),
  ])
  return Response.json({ views: total }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
