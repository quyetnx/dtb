import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  YOUTUBE_API_KEY: string
  YOUTUBE_CHANNEL_ID: string
}

interface YTSearchItem {
  id: { videoId: string }
  snippet: {
    title: string
    description: string
    publishedAt: string
    thumbnails: { high: { url: string }; medium: { url: string } }
    channelTitle: string
  }
}

// GET /api/youtube/list?maxResults=12 — public: list latest videos from channel
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.YOUTUBE_API_KEY || !env.YOUTUBE_CHANNEL_ID) {
    return Response.json({ items: [] })
  }

  const url = new URL(request.url)
  const maxResults = url.searchParams.get('maxResults') ?? '12'

  const apiUrl = new URL('https://www.googleapis.com/youtube/v3/search')
  apiUrl.searchParams.set('part', 'snippet')
  apiUrl.searchParams.set('channelId', env.YOUTUBE_CHANNEL_ID)
  apiUrl.searchParams.set('type', 'video')
  apiUrl.searchParams.set('order', 'date')
  apiUrl.searchParams.set('maxResults', maxResults)
  apiUrl.searchParams.set('key', env.YOUTUBE_API_KEY)

  const res = await fetch(apiUrl.toString())
  if (!res.ok) {
    const err = await res.text()
    console.error('[youtube/list] API error', res.status, err)
    return Response.json({ items: [], error: `YouTube API error: ${res.status}` }, { status: 502 })
  }

  const data = (await res.json()) as { items: YTSearchItem[] }

  const items = (data.items ?? []).map((item) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: item.snippet.publishedAt,
    thumbnail: item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.medium?.url,
    channelTitle: item.snippet.channelTitle,
  }))

  return Response.json({ items }, {
    headers: { 'Cache-Control': 'public, max-age=1800' },
  })
}
