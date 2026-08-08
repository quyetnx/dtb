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

// GET /api/youtube/list
// Default: popular videos (order=viewCount, type=video), filtered to published only
// ?admin=1: all videos, no filter (auth enforced by worker)
// ?q=keyword: relevance order
// ?maxResults=N&pageToken=...
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

  // For admin: fetch more to show full catalogue
  const fetchMax = isAdmin ? String(Math.min(50, parseInt(maxResults) * 3)) : maxResults

  const apiUrl = new URL('https://www.googleapis.com/youtube/v3/search')
  apiUrl.searchParams.set('part', 'snippet')
  apiUrl.searchParams.set('channelId', channelId)
  apiUrl.searchParams.set('type', 'video')
  apiUrl.searchParams.set('order', q ? 'relevance' : 'viewCount')
  apiUrl.searchParams.set('maxResults', fetchMax)
  apiUrl.searchParams.set('key', env.YOUTUBE_API_KEY)
  if (q) apiUrl.searchParams.set('q', q)
  if (pageToken) apiUrl.searchParams.set('pageToken', pageToken)

  const res = await fetch(apiUrl.toString())
  if (!res.ok) {
    const err = await res.text()
    console.error('[youtube/list] Search API error', res.status, err)
    return Response.json({ items: [], error: `YouTube API ${res.status}` }, { status: 502 })
  }

  const data = (await res.json()) as { items: SearchItem[]; nextPageToken?: string; prevPageToken?: string }

  let items = (data.items ?? [])
    .filter((item) => item.id?.videoId)
    .map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.medium?.url ?? '',
      channelTitle: item.snippet.channelTitle,
    }))

  // Public mode: only return published videos
  if (!isAdmin) {
    const publishedIds = await getPublishedIds(env)
    items = items.filter((v) => publishedIds.has(v.id))
  }

  // Cache: short TTL so publish changes appear within 2 minutes
  return Response.json(
    {
      items,
      nextPageToken: isAdmin ? (data.nextPageToken ?? null) : null,
      prevPageToken: isAdmin ? (data.prevPageToken ?? null) : null,
    },
    { headers: { 'Cache-Control': 'public, max-age=120' } },
  )
}
