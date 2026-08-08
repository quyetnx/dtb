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

import { onRequestGet as handleYoutubeList } from './api/youtube/list'
interface Env {
  ASSETS: Fetcher
  SESSIONS: KVNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  ADMIN_EMAILS: string
  SESSION_SECRET: string
  GOOGLE_DRIVE_FOLDER_ID?: string
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    if (!path.startsWith('/api/')) {
      return env.ASSETS.fetch(request)
    }

    // ── Public routes (no auth required) ──────────────────────────────────
    if (path === '/api/site/status' && method === 'GET') return handleSiteStatusGet(makeCtx(request, env))
    if (path === '/api/auth/google' && method === 'GET') return handleAuthGoogle(makeCtx(request, env))
    if (path === '/api/auth/callback' && method === 'GET') return handleAuthCallback(makeCtx(request, env))
    if (path === '/api/auth/me' && method === 'GET') return handleAuthMe(makeCtx(request, env))
    if (path === '/api/auth/logout' && method === 'POST') return handleAuthLogout(makeCtx(request, env))

    // Public Drive reads (no admin param = only published content)
    if (path === '/api/drive/list' && method === 'GET' && !url.searchParams.get('admin')) {
      return handleDriveList(makeCtx(request, env))
    }
    if (path === '/api/drive/file' && method === 'GET') return handleDriveFileGet(makeCtx(request, env))
    if (path === '/api/drive/image' && method === 'GET') return handleDriveImage(makeCtx(request, env))

    // Public YouTube
    if (path === '/api/youtube/list' && method === 'GET') return handleYoutubeList(makeCtx(request, env))

    // ── Protected routes (auth required) ──────────────────────────────────
    if (!(await isAuthenticated(request, env))) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (path === '/api/drive/list' && method === 'GET') return handleDriveList(makeCtx(request, env))
    if (path === '/api/drive/file') {
      if (method === 'POST') return handleDriveFilePost(makeCtx(request, env))
      if (method === 'PATCH') return handleDriveFilePatch(makeCtx(request, env))
      if (method === 'DELETE') return handleDriveFileDelete(makeCtx(request, env))
    }
    if (path === '/api/drive/upload-image' && method === 'POST') return handleUploadImage(makeCtx(request, env))
    if (path === '/api/site/status' && method === 'POST') return handleSiteStatusPost(makeCtx(request, env))

    return new Response('Not Found', { status: 404 })
  },
}
