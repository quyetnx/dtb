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

interface PlaylistItem {
  snippet: {
    title: string
    description: string
    publishedAt: string
    channelTitle: string
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } }
    resourceId: { kind: string; videoId: string }
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

// Admin: Uploads Playlist API — returns EVERY uploaded video (not just search-indexed ones)
// Cost: 1 quota unit per call (vs 100 for Search API)
async function fetchUploadsPlaylist(
  channelId: string,
  maxResults: string,
  pageToken: string,
  apiKey: string,
): Promise<CachedPage | null> {
  const uploadsId = 'UU' + channelId.slice(2)
  const apiUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
  apiUrl.searchParams.set('part', 'snippet')
  apiUrl.searchParams.set('playlistId', uploadsId)
  apiUrl.searchParams.set('maxResults', maxResults)
  apiUrl.searchParams.set('key', apiKey)
  if (pageToken) apiUrl.searchParams.set('pageToken', pageToken)

  const res = await fetch(apiUrl.toString())
  if (!res.ok) {
    const err = await res.text()
    console.error('[youtube/list] PlaylistItems error', res.status, err)
    return null
  }

  const data = (await res.json()) as { items: PlaylistItem[]; nextPageToken?: string; prevPageToken?: string }
  const items: VideoItem[] = (data.items ?? [])
    .filter((item) => item.snippet.resourceId?.kind === 'youtube#video')
    .map((item) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? '',
      channelTitle: item.snippet.channelTitle,
    }))

  return { items, nextPageToken: data.nextPageToken ?? null, prevPageToken: data.prevPageToken ?? null }
}

// Public: Search API ordered by viewCount — most popular videos first
// Cost: 100 quota units per call; cached 1h in KV + CDN
async function searchByPopularity(
  channelId: string,
  maxResults: string,
  q: string,
  pageToken: string,
  apiKey: string,
): Promise<CachedPage | null> {
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
  const items: VideoItem[] = (data.items ?? [])
    .filter((item) => item.id?.videoId)
    .map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.medium?.url ?? '',
      channelTitle: item.snippet.channelTitle,
    }))

  return { items, nextPageToken: data.nextPageToken ?? null, prevPageToken: data.prevPageToken ?? null }
}

// GET /api/youtube/list
//
// Admin (?admin=1): Uploads Playlist — shows ALL videos with pagination, 2-min KV cache.
// Admin + ?q=keyword: Search API with relevance order.
//
// Public (default): Search API ordered by viewCount, filtered to published IDs.
//   Published hash embedded in cache key → CDN + KV auto-bust on toggle.
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
    // Admin: 2-min KV cache — fresh enough to see new uploads, avoids duplicate calls on page flip
    const mode = q ? 'search' : 'playlist'
    const cacheKey = `yt:adm:${mode}:${channelId}:${maxResults}:${q}:${pageToken}`
    const cached = await env.SESSIONS.get(cacheKey, { type: 'json' }) as CachedPage | null
    if (cached) return Response.json(cached, { headers: { 'Cache-Control': 'private, no-store' } })

    const page = q
      ? await searchByPopularity(channelId, maxResults, q, pageToken, env.YOUTUBE_API_KEY)
      : await fetchUploadsPlaylist(channelId, maxResults, pageToken, env.YOUTUBE_API_KEY)
    if (!page) return Response.json({ items: [], error: 'YouTube API error' }, { status: 502 })

    await env.SESSIONS.put(cacheKey, JSON.stringify(page), { expirationTtl: 120 })
    return Response.json(page, { headers: { 'Cache-Control': 'private, no-store' } })
  }

  // Public: published hash in cache key → CDN auto-busts on toggle
  const publishedIds = await getPublishedIds(env)
  const pubHash = hashPublished(publishedIds)
  const publishedSet = new Set(publishedIds)
  const cacheKey = `yt:pub:${channelId}:${maxResults}:${q}:${pageToken}:${pubHash}`

  const cached = await env.SESSIONS.get(cacheKey, { type: 'json' }) as CachedPage | null
  if (cached) {
    return Response.json(cached, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } })
  }

  const raw = await searchByPopularity(channelId, maxResults, q, pageToken, env.YOUTUBE_API_KEY)
  if (!raw) return Response.json({ items: [], error: 'YouTube API error' }, { status: 502 })

  const page: CachedPage = {
    items: raw.items.filter((v) => publishedSet.has(v.id)),
    nextPageToken: raw.nextPageToken,
    prevPageToken: raw.prevPageToken,
  }
  await env.SESSIONS.put(cacheKey, JSON.stringify(page), { expirationTtl: 3600 })
  return Response.json(page, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' } })
}
