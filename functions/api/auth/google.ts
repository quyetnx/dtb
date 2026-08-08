import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  ADMIN_EMAILS: string
  SESSION_SECRET: string
  SESSIONS: KVNamespace
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const redirectUri = `${url.origin}/api/auth/callback`

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile https://www.googleapis.com/auth/drive')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')

  // Optional ?next= param — encode safe internal path as state so callback can redirect there
  const next = url.searchParams.get('next') ?? ''
  if (next.startsWith('/')) authUrl.searchParams.set('state', next)

  return Response.redirect(authUrl.toString(), 302)
}
