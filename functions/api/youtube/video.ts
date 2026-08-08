import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  YOUTUBE_API_KEY: string
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
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.YOUTUBE_API_KEY) {
    return Response.json({ error: 'YOUTUBE_API_KEY not configured' }, { status: 503 })
  }

  const url = new URL(request.url)
  const videoId = url.searchParams.get('id')
  if (!videoId) return Response.json({ error: 'Missing id' }, { status: 400 })

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

  return Response.json(
    {
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
    },
    { headers: { 'Cache-Control': 'private, max-age=300' } },
  )
}
