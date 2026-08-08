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
import { onRequestPost as handleUploadImage } from './api/drive/upload-image'

interface Env {
  ASSETS: Fetcher
  SESSIONS: KVNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  ADMIN_EMAILS: string
  SESSION_SECRET: string
  GOOGLE_SERVICE_ACCOUNT_KEY: string
  GOOGLE_DRIVE_FOLDER_ID: string
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

    if (path.startsWith('/api/')) {
      // Temporary debug endpoint — remove after fix
      if (path === '/api/debug/env' && method === 'GET') {
        const mask = (v: string | undefined) =>
          !v ? '(empty)' : v.length <= 8 ? '***' : `${v.slice(0, 6)}...${v.slice(-6)}`
        return Response.json({
          GOOGLE_CLIENT_ID: mask(env.GOOGLE_CLIENT_ID),
          GOOGLE_CLIENT_ID_ends_with: env.GOOGLE_CLIENT_ID?.endsWith('.apps.googleusercontent.com') ?? false,
          GOOGLE_CLIENT_ID_length: env.GOOGLE_CLIENT_ID?.length ?? 0,
          GOOGLE_CLIENT_SECRET: mask(env.GOOGLE_CLIENT_SECRET),
          GOOGLE_CLIENT_SECRET_starts_with_GOCSPX: env.GOOGLE_CLIENT_SECRET?.startsWith('GOCSPX-') ?? false,
          ADMIN_EMAILS: env.ADMIN_EMAILS ?? '(empty)',
          SESSION_SECRET: mask(env.SESSION_SECRET),
          GOOGLE_SERVICE_ACCOUNT_KEY: mask(env.GOOGLE_SERVICE_ACCOUNT_KEY),
          GOOGLE_DRIVE_FOLDER_ID: env.GOOGLE_DRIVE_FOLDER_ID ?? '(empty)',
        })
      }

      // Public auth routes
      if (path === '/api/auth/google' && method === 'GET') return handleAuthGoogle(makeCtx(request, env))
      if (path === '/api/auth/callback' && method === 'GET') return handleAuthCallback(makeCtx(request, env))
      if (path === '/api/auth/me' && method === 'GET') return handleAuthMe(makeCtx(request, env))
      if (path === '/api/auth/logout' && method === 'POST') return handleAuthLogout(makeCtx(request, env))

      // Protected routes
      if (!(await isAuthenticated(request, env))) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (path === '/api/drive/list' && method === 'GET') return handleDriveList(makeCtx(request, env))
      if (path === '/api/drive/file') {
        if (method === 'GET') return handleDriveFileGet(makeCtx(request, env))
        if (method === 'POST') return handleDriveFilePost(makeCtx(request, env))
        if (method === 'PATCH') return handleDriveFilePatch(makeCtx(request, env))
        if (method === 'DELETE') return handleDriveFileDelete(makeCtx(request, env))
      }
      if (path === '/api/drive/upload-image' && method === 'POST') return handleUploadImage(makeCtx(request, env))

      return new Response('Not Found', { status: 404 })
    }

    // Fall through to static assets (SPA)
    return env.ASSETS.fetch(request)
  },
}
