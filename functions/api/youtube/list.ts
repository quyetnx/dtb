import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  YOUTUBE_API_KEY: string
  YOUTUBE_CHANNEL_ID: string
}

interface PlaylistItem {
  snippet: {
    title: string
    description: string
    publishedAt: string
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } }
    channelTitle: string
    resourceId: { kind: string; videoId: string }
  }
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

// GET /api/youtube/list — latest videos from the channel uploads playlist
// Supports ?maxResults=N&pageToken=... and ?q=keyword (falls back to Search API)
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.YOUTUBE_API_KEY || !env.YOUTUBE_CHANNEL_ID) {
    return Response.json({ items: [], error: 'YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID not configured' })
  }

  const url = new URL(request.url)
  const maxResults = url.searchParams.get('maxResults') ?? '12'
  const q = url.searchParams.get('q') ?? ''
  const pageToken = url.searchParams.get('pageToken') ?? ''

  let channelId: string
  try {
    channelId = await resolveChannelId(env.YOUTUBE_CHANNEL_ID, env.YOUTUBE_API_KEY)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[youtube/list] channel resolve error:', msg)
    return Response.json({ items: [], error: msg }, { status: 502 })
  }

  // Keyword search → use Search API (100 quota units per call)
  if (q) {
    const apiUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    apiUrl.searchParams.set('part', 'snippet')
    apiUrl.searchParams.set('channelId', channelId)
    apiUrl.searchParams.set('type', 'video')
    apiUrl.searchParams.set('order', 'relevance')
    apiUrl.searchParams.set('maxResults', maxResults)
    apiUrl.searchParams.set('q', q)
    apiUrl.searchParams.set('key', env.YOUTUBE_API_KEY)
    if (pageToken) apiUrl.searchParams.set('pageToken', pageToken)

    const res = await fetch(apiUrl.toString())
    if (!res.ok) {
      const err = await res.text()
      console.error('[youtube/list] Search API error', res.status, err)
      return Response.json({ items: [], error: `YouTube API ${res.status}` }, { status: 502 })
    }
    const data = (await res.json()) as { items: SearchItem[]; nextPageToken?: string; prevPageToken?: string }
    const items = (data.items ?? [])
      .filter((item) => item.id?.videoId)
      .map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.medium?.url ?? '',
        channelTitle: item.snippet.channelTitle,
      }))
    return Response.json(
      { items, nextPageToken: data.nextPageToken ?? null, prevPageToken: data.prevPageToken ?? null },
      { headers: { 'Cache-Control': 'public, max-age=900' } },
    )
  }

  // No keyword → use Uploads Playlist (1 quota unit per call, only real video uploads)
  // Uploads playlist ID = replace "UC" prefix with "UU"
  const uploadsPlaylistId = 'UU' + channelId.slice(2)

  const apiUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
  apiUrl.searchParams.set('part', 'snippet')
  apiUrl.searchParams.set('playlistId', uploadsPlaylistId)
  apiUrl.searchParams.set('maxResults', maxResults)
  apiUrl.searchParams.set('key', env.YOUTUBE_API_KEY)
  if (pageToken) apiUrl.searchParams.set('pageToken', pageToken)

  const res = await fetch(apiUrl.toString())
  if (!res.ok) {
    const err = await res.text()
    console.error('[youtube/list] PlaylistItems API error', res.status, err)
    return Response.json({ items: [], error: `YouTube API ${res.status}` }, { status: 502 })
  }
  const data = (await res.json()) as { items: PlaylistItem[]; nextPageToken?: string; prevPageToken?: string }

  const items = (data.items ?? [])
    .filter((item) => item.snippet.resourceId?.kind === 'youtube#video')
    .map((item) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails.high?.url
        ?? item.snippet.thumbnails.medium?.url
        ?? item.snippet.thumbnails.default?.url
        ?? '',
      channelTitle: item.snippet.channelTitle,
    }))

  return Response.json(
    { items, nextPageToken: data.nextPageToken ?? null, prevPageToken: data.prevPageToken ?? null },
    { headers: { 'Cache-Control': 'public, max-age=1800' } },
  )
}
