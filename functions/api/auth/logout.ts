import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  SESSIONS: KVNamespace
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const cookie = request.headers.get('Cookie') ?? ''
  const match = cookie.match(/session_id=([^;]+)/)
  if (match) {
    await env.SESSIONS.delete(`session:${match[1]}`)
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/admin/login',
      'Set-Cookie': 'session_id=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  })
}
