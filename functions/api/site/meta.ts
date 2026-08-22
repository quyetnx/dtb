const KV_KEY = 'site:meta'

export interface SiteMeta {
  siteTitle: string         // <title> tag default suffix
  siteDescription: string   // default meta description
  ogImage: string           // default og:image URL
  homeTitle: string         // homepage <title>
  homeDescription: string   // homepage meta description
  homeOgImage: string       // homepage og:image (overrides ogImage if set)
  twitterSite: string       // twitter:site handle e.g. @handle
  locale: string            // og:locale e.g. vi_VN
}

const DEFAULTS: SiteMeta = {
  siteTitle: 'Dương Thanh Biểu',
  siteDescription: 'Trang web của nhà văn, nhà thơ Dương Thanh Biểu — tác phẩm văn học, thơ và nghệ thuật.',
  ogImage: 'https://hoduongvietnam.com.vn/uploads/images/duong-thanh-bieu(1).png',
  homeTitle: 'Dương Thanh Biểu — Nhà văn, Nhà thơ',
  homeDescription: 'Trang web của TS, nhà văn, nhà báo Dương Thanh Biểu — tác phẩm văn học, thơ và nghệ thuật.',
  homeOgImage: '',
  twitterSite: '',
  locale: 'vi_VN',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestGet(ctx: any): Promise<Response> {
  const raw = await ctx.env.SESSIONS.get(KV_KEY)
  const meta: SiteMeta = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SiteMeta>) } : DEFAULTS
  return Response.json(meta, { headers: { 'Cache-Control': 'private, no-store' } })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequestPost(ctx: any): Promise<Response> {
  const body = await ctx.request.json() as Partial<SiteMeta>
  const raw = await ctx.env.SESSIONS.get(KV_KEY)
  const current: SiteMeta = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SiteMeta>) } : DEFAULTS
  const updated = { ...current, ...body }
  await ctx.env.SESSIONS.put(KV_KEY, JSON.stringify(updated))
  return Response.json(updated)
}
