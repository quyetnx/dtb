import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  SESSIONS: KVNamespace
}

// Protect all /api/* routes except auth routes
export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const url = new URL(request.url)

  // Skip auth for public routes
  if (!url.pathname.startsWith('/api/')) return next()
  if (url.pathname.startsWith('/api/auth/')) return next()

  // Check session
  const cookie = request.headers.get('Cookie') ?? ''
  const match = cookie.match(/session_id=([^;]+)/)

  if (!match) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await env.SESSIONS.get(`session:${match[1]}`)
  if (!data) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return next()
}
