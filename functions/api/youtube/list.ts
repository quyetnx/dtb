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

interface YTSearchResponse {
  items: SearchItem[]
  nextPageToken?: string
  prevPageToken?: string
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
  fetchedAt: number
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

async function getPublishedIds(env: Env): Promise<Set<string>> {
  const data = await env.SESSIONS.get('youtube:published', { type: 'json' }) as { ids: string[] } | null
  return new Set(data?.ids ?? [])
}

// Fetch from YouTube and cache result in KV for 5 minutes
async function fetchFromYouTube(
  channelId: string,
  maxResults: string,
  q: string,
  pageToken: string,
  apiKey: string,
  env: Env,
): Promise<CachedPage | null> {
  const cacheKey = `yt:list:${channelId}:${maxResults}:${q}:${pageToken}`
  const cached = await env.SESSIONS.get(cacheKey, { type: 'json' }) as CachedPage | null
  if (cached && Date.now() - cached.fetchedAt < 5 * 60 * 1000) return cached

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

  const data = (await res.json()) as YTSearchResponse
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

  const page: CachedPage = {
    items,
    nextPageToken: data.nextPageToken ?? null,
    prevPageToken: data.prevPageToken ?? null,
    fetchedAt: Date.now(),
  }
  await env.SESSIONS.put(cacheKey, JSON.stringify(page), { expirationTtl: 600 })
  return page
}

// GET /api/youtube/list
// Public (default): filter to published IDs only; response not cached at edge
// Admin (?admin=1): all videos, no publish filter; auth enforced in worker
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

  const page = await fetchFromYouTube(channelId, maxResults, q, pageToken, env.YOUTUBE_API_KEY, env)
  if (!page) {
    return Response.json({ items: [], error: 'YouTube API error' }, { status: 502 })
  }

  let items = page.items

  // Public mode: filter to published videos only
  if (!isAdmin) {
    const publishedIds = await getPublishedIds(env)
    items = items.filter((v) => publishedIds.has(v.id))
  }

  // No public HTTP caching — published filter must always reflect current KV state
  return Response.json(
    {
      items,
      nextPageToken: page.nextPageToken,
      prevPageToken: page.prevPageToken,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
