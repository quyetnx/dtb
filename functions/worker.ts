import { onRequestGet as handleAuthGoogle } from './api/auth/google'
import { onRequestGet as handleAuthCallback } from './api/auth/callback'
import { onRequestGet as handleAuthMe } from './api/auth/me'
import { onRequestPost as handleAuthLogout } from './api/auth/logout'
import { onRequestGet as handleDriveList } from './api/drive/list'
import {
  onRequestGet as handleDriveFileGet,
  onRequestPost as handleDriveFilePost,
  onRequestPatch as handleDriveFilePatch,
  onRequestDelete as handleDriveFileDelete,
} from './api/drive/file'
import { onRequestGet as handleDriveImage } from './api/drive/image'
import { onRequestPost as handleUploadImage } from './api/drive/upload-image'
import { onRequestGet as handleSiteStatusGet, onRequestPost as handleSiteStatusPost } from './api/site/status'
import { onRequestGet as handleSiteBioGet, onRequestPost as handleSiteBioPost } from './api/site/bio'
import { onRequestGet as handleSiteViewsGet, onRequestPost as handleSiteViewsPost, onRequestPut as handleSiteViewsPut } from './api/site/views'
import { onRequestGet as handleSiteMetaGet, onRequestPost as handleSiteMetaPost } from './api/site/meta'
import type { SiteMeta } from './api/site/meta'
import { onRequestGet as handleYoutubeList } from './api/youtube/list'
import { onRequestGet as handleYoutubeVideo } from './api/youtube/video'
import { onRequestGet as handleYoutubePublishedGet, onRequestPost as handleYoutubePublishedPost } from './api/youtube/published'
import { onRequestGet as handleDriveStatus } from './api/drive/status'
import { onRequestPost as handleDriveDisconnect } from './api/drive/disconnect'
import { onRequestGet as handleDriveFolders } from './api/drive/folders'
import { onRequestGet as handleSiteFolderGet, onRequestPost as handleSiteFolderPost } from './api/site/folder'
import {
  onRequestGet as handleAdsGet,
  onRequestPost as handleAdsPost,
  onRequestPatch as handleAdsPatch,
  onRequestDelete as handleAdsDelete,
} from './api/ads'
import { getDriveToken } from './api/drive/_token'

interface Env {
  ASSETS: Fetcher
  SESSIONS: KVNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  ADMIN_EMAILS: string
  SESSION_SECRET: string
  GOOGLE_DRIVE_FOLDER_ID?: string
  DRIVE_ACCOUNT_EMAIL?: string
  YOUTUBE_API_KEY: string
  YOUTUBE_CHANNEL_ID: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeCtx = (request: Request, env: Env): any => ({
  request,
  env,
  next: () => new Response('Not Found', { status: 404 }),
  waitUntil: () => {},
  functionPath: '',
  params: {},
  data: {},
})

async function isAuthenticated(request: Request, env: Env): Promise<boolean> {
  const cookie = request.headers.get('Cookie') ?? ''
  const match = cookie.match(/session_id=([^;]+)/)
  if (!match) return false
  const data = await env.SESSIONS.get(`session:${match[1]}`)
  return !!data
}

// ── Content token (HMAC-SHA256, rotates hourly) ────────────────────────────

async function hmacToken(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function generateContentToken(fileId: string, secret: string): Promise<string> {
  const hour = Math.floor(Date.now() / 3600000)
  return hmacToken(`${fileId}:${hour}`, secret)
}

async function validateContentToken(fileId: string, secret: string, token: string): Promise<boolean> {
  const hour = Math.floor(Date.now() / 3600000)
  for (const h of [hour, hour - 1]) {
    const expected = await hmacToken(`${fileId}:${h}`, secret)
    if (expected === token) return true
  }
  return false
}

// ── OG meta injection for social bots ──────────────────────────────────────

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Remove existing title/description/og/twitter tags so injected ones don't duplicate
function stripExistingMeta(html: string): string {
  return html
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+name="description"[^>]*\/?>/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*\/?>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*\/?>/gi, '')
}

interface FileMeta {
  name?: string
  description?: string
  thumbnailLink?: string
  appProperties?: { type?: string; category?: string }
}

async function getOGMeta(fileId: string, env: Env): Promise<FileMeta | null> {
  const cacheKey = `og:meta:${fileId}`
  const cached = await env.SESSIONS.get(cacheKey, { type: 'json' })
  if (cached) return cached as FileMeta

  let token: string
  try { token = await getDriveToken(env) } catch { return null }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,description,thumbnailLink,appProperties`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) return null

  const meta = await res.json() as FileMeta
  // Cache 2 hours
  await env.SESSIONS.put(cacheKey, JSON.stringify(meta), { expirationTtl: 7200 })
  return meta
}

async function injectOGMeta(
  htmlRes: Response,
  fileId: string,
  env: Env,
  origin: string,
  isPoem: boolean,
): Promise<Response> {
  const meta = await getOGMeta(fileId, env)
  if (!meta) return htmlRes

  const contentToken = env.SESSION_SECRET
    ? await generateContentToken(fileId, env.SESSION_SECRET)
    : ''

  const title = (meta.name ?? '').replace(/\.md$/, '')
  const desc = meta.description
    ?? (isPoem
      ? `Bài thơ "${title}" của Dương Thanh Biểu.`
      : `Tác phẩm "${title}" của Dương Thanh Biểu.`)
  const pageUrl = `${origin}${isPoem ? '/tho/' : '/van-tho/'}${fileId}`
  const imageUrl = meta.thumbnailLink
    ? `${origin}/api/drive/thumb?id=${fileId}`
    : 'https://hoduongvietnam.com.vn/uploads/images/duong-thanh-bieu(1).png'

  const ogBlock = `
  <title>${escHtml(title)} — Dương Thanh Biểu</title>
  <meta name="description" content="${escHtml(desc)}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escHtml(title)} — Dương Thanh Biểu">
  <meta property="og:description" content="${escHtml(desc)}">
  <meta property="og:image" content="${escHtml(imageUrl)}">
  <meta property="og:url" content="${escHtml(pageUrl)}">
  <meta property="og:site_name" content="Dương Thanh Biểu">
  <meta property="og:locale" content="vi_VN">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(title)} — Dương Thanh Biểu">
  <meta name="twitter:description" content="${escHtml(desc)}">
  <meta name="twitter:image" content="${escHtml(imageUrl)}">`.trim()

  let html = stripExistingMeta(await htmlRes.text())
  const tokenScript = contentToken ? `<script>window.__ct="${contentToken}"</script>` : ''
  html = html.replace(/<\/head>/, `  ${ogBlock}\n  ${tokenScript}\n  </head>`)

  const headers = new Headers(htmlRes.headers)
  headers.set('Content-Type', 'text/html; charset=utf-8')
  headers.set('Cache-Control', 'private, no-store')
  headers.delete('Content-Length')
  return new Response(html, { status: htmlRes.status, headers })
}

// ── Site-wide OG meta injection (homepage + listing pages) ────────────────

async function getSiteMeta(env: Env): Promise<SiteMeta> {
  const raw = await env.SESSIONS.get('site:meta')
  const defaults: SiteMeta = {
    siteTitle: 'Dương Thanh Biểu',
    siteDescription: 'Trang web của nhà văn, nhà thơ Dương Thanh Biểu — tác phẩm văn học, thơ và nghệ thuật.',
    ogImage: 'https://hoduongvietnam.com.vn/uploads/images/duong-thanh-bieu(1).png',
    homeTitle: 'Dương Thanh Biểu — Nhà văn, Nhà thơ',
    homeDescription: 'Trang web của TS, nhà văn, nhà báo Dương Thanh Biểu — tác phẩm văn học, thơ và nghệ thuật.',
    homeOgImage: '',
    twitterSite: '',
    locale: 'vi_VN',
  }
  return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<SiteMeta>) } : defaults
}

interface PageOGConfig {
  title: string
  description: string
  image: string
  url: string
  type?: string
}

async function injectPageOGMeta(htmlRes: Response, cfg: PageOGConfig, meta: SiteMeta): Promise<Response> {
  const ogBlock = `
  <title>${escHtml(cfg.title)}</title>
  <meta name="description" content="${escHtml(cfg.description)}">
  <meta property="og:type" content="${cfg.type ?? 'website'}">
  <meta property="og:title" content="${escHtml(cfg.title)}">
  <meta property="og:description" content="${escHtml(cfg.description)}">
  <meta property="og:image" content="${escHtml(cfg.image)}">
  <meta property="og:url" content="${escHtml(cfg.url)}">
  <meta property="og:site_name" content="${escHtml(meta.siteTitle)}">
  <meta property="og:locale" content="${escHtml(meta.locale)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(cfg.title)}">
  <meta name="twitter:description" content="${escHtml(cfg.description)}">
  <meta name="twitter:image" content="${escHtml(cfg.image)}">
  ${meta.twitterSite ? `<meta name="twitter:site" content="${escHtml(meta.twitterSite)}">` : ''}`.trim()

  let html = stripExistingMeta(await htmlRes.text())
  html = html.replace(/<\/head>/, `  ${ogBlock}\n  </head>`)

  const headers = new Headers(htmlRes.headers)
  headers.set('Content-Type', 'text/html; charset=utf-8')
  headers.set('Cache-Control', 'private, no-store')
  headers.delete('Content-Length')
  return new Response(html, { status: htmlRes.status, headers })
}

// ── Drive list cache bust (called after any file write) ────────────────────

async function bustDriveListCache(env: Env): Promise<void> {
  const folder = await getDriveFolder(env).catch(() => null)
  const key = folder ?? 'default'
  await Promise.all([
    env.SESSIONS.delete(`drive:list:${key}:all`),
    env.SESSIONS.delete(`drive:list:${key}:image`),
    env.SESSIONS.delete('drive:list:default:all'),
    env.SESSIONS.delete('drive:list:default:image'),
  ].map((p) => p.catch(() => {})))
}

// ── Drive thumbnail proxy ───────────────────────────────────────────────────

async function handleDriveThumb(request: Request, env: Env): Promise<Response> {
  const fileId = new URL(request.url).searchParams.get('id')
  if (!fileId) return new Response('Missing id', { status: 400 })

  let token: string
  try { token = await getDriveToken(env) } catch {
    return new Response('Drive not connected', { status: 503 })
  }

  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=thumbnailLink`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!metaRes.ok) return new Response('Not found', { status: 404 })

  const { thumbnailLink } = await metaRes.json() as { thumbnailLink?: string }
  if (!thumbnailLink) return new Response('No thumbnail', { status: 404 })

  // Use a larger thumbnail (replace trailing size param)
  const largeThumb = thumbnailLink.replace(/=s\d+$/, '=s800')

  const imgRes = await fetch(largeThumb)
  if (!imgRes.ok) return new Response('Fetch failed', { status: 502 })

  return new Response(imgRes.body, {
    headers: {
      'Content-Type': imgRes.headers.get('Content-Type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    if (!path.startsWith('/api/')) {
      // Inject OG meta for article/poem/news detail pages
      const articleMatch = path.match(/^\/van-tho\/([A-Za-z0-9_-]{10,})$/)
      const poemMatch = path.match(/^\/tho\/([A-Za-z0-9_-]{10,})$/)
      const newsMatch = path.match(/^\/tin-tuc\/([A-Za-z0-9_-]{10,})$/)
      const fileId = articleMatch?.[1] ?? poemMatch?.[1] ?? newsMatch?.[1]

      if (fileId) {
        const htmlRes = await env.ASSETS.fetch(request)
        return injectOGMeta(htmlRes, fileId, env, url.origin, !!poemMatch)
      }

      // Inject site-wide OG meta for page routes (homepage and listing pages)
      const isPageRoute = path === '/' || path === '/van-tho' || path === '/tho'
        || path === '/nghe-thuat-van-hoa' || path === '/video' || path === '/tin-tuc'
      if (isPageRoute) {
        const [htmlRes, siteMeta] = await Promise.all([
          env.ASSETS.fetch(request),
          getSiteMeta(env),
        ])
        const isHome = path === '/'
        const image = isHome && siteMeta.homeOgImage ? siteMeta.homeOgImage : siteMeta.ogImage
        const cfg: PageOGConfig = {
          title: isHome ? siteMeta.homeTitle : `${siteMeta.siteTitle}`,
          description: isHome ? siteMeta.homeDescription : siteMeta.siteDescription,
          image,
          url: `${url.origin}${path}`,
          type: 'website',
        }
        return injectPageOGMeta(htmlRes, cfg, siteMeta)
      }

      return env.ASSETS.fetch(request)
    }

    // ── Debug endpoint ────────────────────────────────────────────────────
    if (path === '/api/debug/og' && method === 'GET') {
      const rawKv = await env.SESSIONS.get('site:meta')
      const siteMeta = await getSiteMeta(env)
      const isHome = url.searchParams.get('path') !== 'listing'
      const image = isHome && siteMeta.homeOgImage ? siteMeta.homeOgImage : siteMeta.ogImage

      // Fetch actual ASSETS HTML and test strip+inject
      const testHtmlRes = await env.ASSETS.fetch(new Request(`${url.origin}/`, { headers: request.headers }))
      const rawHtml = await testHtmlRes.text()
      const stripped = stripExistingMeta(rawHtml)
      const cfg2: PageOGConfig = {
        title: siteMeta.homeTitle,
        description: siteMeta.homeDescription,
        image: siteMeta.homeOgImage || siteMeta.ogImage,
        url: `${url.origin}/`,
        type: 'website',
      }
      // Build ogBlock inline for inspection
      const injectedTitle = `<title>${escHtml(cfg2.title)}</title>`
      const headExtract = stripped.match(/<head>([\s\S]*?)<\/head>/i)?.[1]?.trim().slice(0, 600) ?? 'not matched'

      return Response.json({
        kv_raw: rawKv,
        resolved: siteMeta,
        would_inject: {
          title: isHome ? siteMeta.homeTitle : siteMeta.siteTitle,
          description: isHome ? siteMeta.homeDescription : siteMeta.siteDescription,
          image,
        },
        assets_html_check: {
          original_has_og_title: rawHtml.includes('og:title'),
          after_strip_has_og_title: stripped.includes('og:title'),
          after_strip_has_title_tag: stripped.includes('<title>'),
          injected_title_would_be: injectedTitle,
          head_after_strip: headExtract,
        },
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    // ── Public routes (no auth required) ──────────────────────────────────
    if (path === '/api/site/status' && method === 'GET') return handleSiteStatusGet(makeCtx(request, env))
    if (path === '/api/site/bio' && method === 'GET') return handleSiteBioGet(makeCtx(request, env))
    if (path === '/api/site/views' && method === 'GET') return handleSiteViewsGet(makeCtx(request, env))
    if (path === '/api/site/views' && method === 'POST') return handleSiteViewsPost(makeCtx(request, env))
    if (path === '/api/site/meta' && method === 'GET') return handleSiteMetaGet(makeCtx(request, env))
    if (path === '/api/auth/google' && method === 'GET') return handleAuthGoogle(makeCtx(request, env))
    if (path === '/api/auth/callback' && method === 'GET') return handleAuthCallback(makeCtx(request, env))
    if (path === '/api/auth/me' && method === 'GET') return handleAuthMe(makeCtx(request, env))
    if (path === '/api/auth/logout' && method === 'POST') return handleAuthLogout(makeCtx(request, env))

    // Public Drive reads
    if (path === '/api/drive/list' && method === 'GET' && !url.searchParams.get('admin')) {
      return handleDriveList(makeCtx(request, env))
    }
    if (path === '/api/drive/file' && method === 'GET') {
      const fileId = url.searchParams.get('id') ?? ''
      const token = request.headers.get('X-Content-Token') ?? ''
      const tokenOk = env.SESSION_SECRET
        ? await validateContentToken(fileId, env.SESSION_SECRET, token)
        : true
      if (tokenOk) return handleDriveFileGet(makeCtx(request, env))
      // Fall through — auth check below will allow admin sessions
      if (await isAuthenticated(request, env)) return handleDriveFileGet(makeCtx(request, env))
      return new Response('Forbidden', { status: 403 })
    }
    if (path === '/api/drive/image' && method === 'GET') return handleDriveImage(makeCtx(request, env))
    if (path === '/api/drive/thumb' && method === 'GET') return handleDriveThumb(request, env)

    // Public YouTube
    if (path === '/api/youtube/list' && method === 'GET') return handleYoutubeList(makeCtx(request, env))
    if (path === '/api/youtube/video' && method === 'GET') return handleYoutubeVideo(makeCtx(request, env))

    // Public Ads
    if (path === '/api/ads' && method === 'GET') return handleAdsGet(makeCtx(request, env))

    // ── Protected routes (auth required) ──────────────────────────────────
    if (!(await isAuthenticated(request, env))) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (path === '/api/drive/list' && method === 'GET') return handleDriveList(makeCtx(request, env))
    if (path === '/api/drive/status' && method === 'GET') return handleDriveStatus(makeCtx(request, env))
    if (path === '/api/drive/disconnect' && method === 'POST') return handleDriveDisconnect(makeCtx(request, env))
    if (path === '/api/drive/folders' && method === 'GET') return handleDriveFolders(makeCtx(request, env))
    if (path === '/api/site/folder' && method === 'GET') return handleSiteFolderGet(makeCtx(request, env))
    if (path === '/api/site/folder' && method === 'POST') return handleSiteFolderPost(makeCtx(request, env))
    if (path === '/api/site/views' && method === 'PUT') return handleSiteViewsPut(makeCtx(request, env))
    if (path === '/api/site/meta' && method === 'POST') return handleSiteMetaPost(makeCtx(request, env))
    if (path === '/api/drive/file') {
      if (method === 'POST') {
        const res = await handleDriveFilePost(makeCtx(request, env))
        if (res.ok) await bustDriveListCache(env)
        return res
      }
      if (method === 'PATCH') {
        const res = await handleDriveFilePatch(makeCtx(request, env))
        if (res.ok) await bustDriveListCache(env)
        return res
      }
      if (method === 'DELETE') {
        const res = await handleDriveFileDelete(makeCtx(request, env))
        if (res.ok) await bustDriveListCache(env)
        return res
      }
    }
    if (path === '/api/drive/upload-image' && method === 'POST') return handleUploadImage(makeCtx(request, env))
    if (path === '/api/site/status' && method === 'POST') return handleSiteStatusPost(makeCtx(request, env))
    if (path === '/api/site/bio' && method === 'POST') return handleSiteBioPost(makeCtx(request, env))
    if (path === '/api/youtube/published' && method === 'GET') return handleYoutubePublishedGet(makeCtx(request, env))
    if (path === '/api/youtube/published' && method === 'POST') return handleYoutubePublishedPost(makeCtx(request, env))

    // Admin Ads
    if (path === '/api/ads' && method === 'POST') return handleAdsPost(makeCtx(request, env))
    if (path === '/api/ads' && method === 'PATCH') return handleAdsPatch(makeCtx(request, env))
    if (path === '/api/ads' && method === 'DELETE') return handleAdsDelete(makeCtx(request, env))

    return new Response('Not Found', { status: 404 })
  },
}
