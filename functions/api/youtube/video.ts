import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  YOUTUBE_API_KEY: string
  SESSIONS: KVNamespace
}

interface YTVideoItem {
  id: string
  snippet: {
    title: string
    description: string
    publishedAt: string
    channelTitle: string
    thumbnails: { high?: { url: string }; maxres?: { url: string }; medium?: { url: string } }
  }
  contentDetails: { duration: string }
}

// GET /api/youtube/video?id=<videoId> — fetch single video metadata
// KV-cached 24h + CDN-cached 24h → YouTube API called at most once per day per video
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.YOUTUBE_API_KEY) {
    return Response.json({ error: 'YOUTUBE_API_KEY not configured' }, { status: 503 })
  }

  const url = new URL(request.url)
  const videoId = url.searchParams.get('id')
  if (!videoId) return Response.json({ error: 'Missing id' }, { status: 400 })

  const cacheKey = `yt:video:${videoId}`
  const cached = await env.SESSIONS.get(cacheKey, { type: 'json' })
  if (cached) {
    return Response.json(cached, { headers: { 'Cache-Control': 'public, max-age=86400' } })
  }

  const apiUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
  apiUrl.searchParams.set('part', 'snippet,contentDetails')
  apiUrl.searchParams.set('id', videoId)
  apiUrl.searchParams.set('key', env.YOUTUBE_API_KEY)

  const res = await fetch(apiUrl.toString())
  if (!res.ok) {
    const err = await res.text()
    console.error('[youtube/video] API error', res.status, err)
    return Response.json({ error: `YouTube API ${res.status}` }, { status: 502 })
  }

  const data = (await res.json()) as { items: YTVideoItem[] }
  const item = data.items?.[0]
  if (!item) return Response.json({ error: 'Video not found' }, { status: 404 })

  const payload = {
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: item.snippet.publishedAt,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.maxres?.url
      ?? item.snippet.thumbnails.high?.url
      ?? item.snippet.thumbnails.medium?.url
      ?? '',
    duration: item.contentDetails.duration,
  }

  // KV TTL 24h — videos.list costs only 1 quota unit; cache keeps it to ≤1 call/day per video
  await env.SESSIONS.put(cacheKey, JSON.stringify(payload), { expirationTtl: 86400 })
  return Response.json(payload, { headers: { 'Cache-Control': 'public, max-age=86400' } })
}
