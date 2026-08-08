import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  SESSIONS: KVNamespace
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const cookie = request.headers.get('Cookie') ?? ''
  const match = cookie.match(/session_id=([^;]+)/)

  if (!match) {
    return Response.json({ authenticated: false }, { status: 401 })
  }

  const data = await env.SESSIONS.get(`session:${match[1]}`)
  if (!data) {
    return Response.json({ authenticated: false }, { status: 401 })
  }

  const session = JSON.parse(data)
  return Response.json({ authenticated: true, user: session })
}
