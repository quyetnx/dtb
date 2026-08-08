import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  YOUTUBE_API_KEY: string
  YOUTUBE_CHANNEL_ID: string
  SESSIONS: KVNamespace
}

interface SearchItem {
  id: { videoId: string }
  snippet: {
    title: string
    description: string
    publishedAt: string
    thumbnails: { high?: { url: string }; medium?: { url: string } }
    channelTitle: string
  }
}

interface VideoItem {
  id: string
  title: string
  description: string
  publishedAt: string
  thumbnail: string
  channelTitle: string
}

interface CachedPage {
  items: VideoItem[]
  nextPageToken: string | null
  prevPageToken: string | null
}

async function resolveChannelId(handle: string, apiKey: string): Promise<string> {
  if (handle.startsWith('UC')) return handle
  const lookup = handle.startsWith('@') ? handle : `@${handle}`
  const url = new URL('https://www.googleapis.com/youtube/v3/channels')
  url.searchParams.set('part', 'id')
  url.searchParams.set('forHandle', lookup)
  url.searchParams.set('key', apiKey)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Channel lookup failed: ${res.status}`)
  const data = (await res.json()) as { items?: { id: string }[] }
  const channelId = data.items?.[0]?.id
  if (!channelId) throw new Error(`Channel not found for handle: ${lookup}`)
  return channelId
}

// Simple hash of published IDs → part of cache key so CDN auto-busts when list changes
function hashPublished(ids: string[]): string {
  const str = [...ids].sort().join(',')
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  return h.toString(36)
}

async function getPublishedIds(env: Env): Promise<string[]> {
  const data = await env.SESSIONS.get('youtube:published', { type: 'json' }) as { ids: string[] } | null
  return data?.ids ?? []
}

async function fetchFromYouTube(
  channelId: string,
  maxResults: string,
  q: string,
  pageToken: string,
  apiKey: string,
  env: Env,
  cacheKey: string,
  filterFn: (items: VideoItem[]) => VideoItem[],
): Promise<CachedPage | null> {
  // Check KV cache first (1-hour TTL reduces KV writes to max 24/day per key)
  const cached = await env.SESSIONS.get(cacheKey, { type: 'json' }) as CachedPage | null
  if (cached) return cached

  const apiUrl = new URL('https://www.googleapis.com/youtube/v3/search')
  apiUrl.searchParams.set('part', 'snippet')
  apiUrl.searchParams.set('channelId', channelId)
  apiUrl.searchParams.set('type', 'video')
  apiUrl.searchParams.set('order', q ? 'relevance' : 'viewCount')
  apiUrl.searchParams.set('maxResults', maxResults)
  apiUrl.searchParams.set('key', apiKey)
  if (q) apiUrl.searchParams.set('q', q)
  if (pageToken) apiUrl.searchParams.set('pageToken', pageToken)

  const res = await fetch(apiUrl.toString())
  if (!res.ok) {
    const err = await res.text()
    console.error('[youtube/list] Search API error', res.status, err)
    return null
  }

  const data = (await res.json()) as { items: SearchItem[]; nextPageToken?: string; prevPageToken?: string }
  const allItems: VideoItem[] = (data.items ?? [])
    .filter((item) => item.id?.videoId)
    .map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.medium?.url ?? '',
      channelTitle: item.snippet.channelTitle,
    }))

  const page: CachedPage = {
    items: filterFn(allItems),
    nextPageToken: data.nextPageToken ?? null,
    prevPageToken: data.prevPageToken ?? null,
  }
  // 1-hour TTL: max 24 KV writes/day per unique cache key (well within 1K free limit)
  await env.SESSIONS.put(cacheKey, JSON.stringify(page), { expirationTtl: 3600 })
  return page
}

// GET /api/youtube/list
//
// Public (default): only published videos, result cached in CDN 1 hour.
//   Cache key includes hash of published IDs → CDN auto-busts on publish toggle.
//
// Admin (?admin=1, auth enforced in worker): all videos, private cache.
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.YOUTUBE_API_KEY || !env.YOUTUBE_CHANNEL_ID) {
    return Response.json({ items: [], error: 'YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID not configured' })
  }

  const url = new URL(request.url)
  const maxResults = url.searchParams.get('maxResults') ?? '12'
  const q = url.searchParams.get('q') ?? ''
  const pageToken = url.searchParams.get('pageToken') ?? ''
  const isAdmin = url.searchParams.get('admin') === '1'

  let channelId: string
  try {
    channelId = await resolveChannelId(env.YOUTUBE_CHANNEL_ID, env.YOUTUBE_API_KEY)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[youtube/list] channel resolve error:', msg)
    return Response.json({ items: [], error: msg }, { status: 502 })
  }

  if (isAdmin) {
    // Admin: all videos, KV cache of raw YouTube response (no publish filter)
    const cacheKey = `yt:raw:${channelId}:${maxResults}:${q}:${pageToken}`
    const page = await fetchFromYouTube(channelId, maxResults, q, pageToken, env.YOUTUBE_API_KEY, env, cacheKey, (items) => items)
    if (!page) return Response.json({ items: [], error: 'YouTube API error' }, { status: 502 })
    return Response.json(page, { headers: { 'Cache-Control': 'private, no-store' } })
  }

  // Public: include published hash in cache key so CDN busts automatically on toggle
  const publishedIds = await getPublishedIds(env)
  const pubHash = hashPublished(publishedIds)
  const publishedSet = new Set(publishedIds)
  const cacheKey = `yt:pub:${channelId}:${maxResults}:${q}:${pageToken}:${pubHash}`

  const page = await fetchFromYouTube(
    channelId, maxResults, q, pageToken, env.YOUTUBE_API_KEY, env, cacheKey,
    (items) => items.filter((v) => publishedSet.has(v.id)),
  )
  if (!page) return Response.json({ items: [], error: 'YouTube API error' }, { status: 502 })

  // Cache at CDN for 1 hour — Worker only invoked on cache miss (~24 times/day max)
  return Response.json(page, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } })
}
