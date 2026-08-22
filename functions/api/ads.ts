import type { PagesFunction } from '@cloudflare/workers-types'

interface Env { SESSIONS: KVNamespace }

export interface Ad {
  id: string
  title: string
  imageId: string
  link: string
  position: string   // 'home' | 'article' | 'video'
  size?: string      // e.g. '728x90', '300x250', '320x50'
  active: boolean
  order: number
  createdAt: string
}

const KV_KEY = 'ads:list'

async function getAds(env: Env): Promise<Ad[]> {
  const raw = await env.SESSIONS.get(KV_KEY)
  if (!raw) return []
  return (JSON.parse(raw) as { ads: Ad[] }).ads ?? []
}

async function saveAds(env: Env, ads: Ad[]): Promise<void> {
  await env.SESSIONS.put(KV_KEY, JSON.stringify({ ads }))
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const ads = await getAds(env)
  return Response.json({ ads }, { headers: { 'Cache-Control': 'private, no-store' } })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json() as Omit<Ad, 'id' | 'createdAt'>
  const ads = await getAds(env)
  const newAd: Ad = { ...body, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  ads.push(newAd)
  await saveAds(env, ads)
  return Response.json(newAd, { status: 201 })
}

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })
  const body = await request.json() as Partial<Ad>
  const ads = await getAds(env)
  const idx = ads.findIndex((a) => a.id === id)
  if (idx === -1) return Response.json({ error: 'Not found' }, { status: 404 })
  ads[idx] = { ...ads[idx], ...body }
  await saveAds(env, ads)
  return Response.json(ads[idx])
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })
  const ads = await getAds(env)
  await saveAds(env, ads.filter((a) => a.id !== id))
  return Response.json({ success: true })
}
