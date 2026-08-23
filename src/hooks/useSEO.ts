import { useEffect } from 'react'

interface SiteMeta {
  siteTitle: string
  siteDescription: string
  ogImage: string
  homeTitle: string
  homeDescription: string
  homeOgImage: string
  twitterSite: string
  locale: string
}

const SITE_DEFAULTS: SiteMeta = {
  siteTitle: 'Dương Thanh Biểu',
  siteDescription: 'Trang web của nhà văn, nhà thơ Dương Thanh Biểu — tác phẩm văn học, thơ và nghệ thuật.',
  ogImage: 'https://hoduongvietnam.com.vn/uploads/images/duong-thanh-bieu(1).png',
  homeTitle: 'Dương Thanh Biểu — Nhà văn, Nhà thơ',
  homeDescription: 'Trang web của TS, nhà văn, nhà báo Dương Thanh Biểu — tác phẩm văn học, thơ và nghệ thuật.',
  homeOgImage: '',
  twitterSite: '',
  locale: 'vi_VN',
}

// Module-level cache: fetched once per page load, shared across all useSEO calls
let siteMetaCache: SiteMeta = SITE_DEFAULTS
let siteMetaPromise: Promise<SiteMeta> | null = null

function getSiteMeta(): Promise<SiteMeta> {
  if (!siteMetaPromise) {
    siteMetaPromise = fetch('/api/site/meta')
      .then((r) => r.json() as Promise<SiteMeta>)
      .then((d) => { siteMetaCache = d; return d })
      .catch(() => SITE_DEFAULTS)
  }
  return siteMetaPromise
}

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
}

function setMeta(key: string, content: string, attr: 'property' | 'name' = 'property') {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

export function useSEO({ title, description, image, url, type = 'website' }: SEOProps) {
  useEffect(() => {
    getSiteMeta().then((siteMeta) => {
      const isHome = !title
      const fullTitle = isHome
        ? siteMeta.homeTitle
        : `${title} — ${siteMeta.siteTitle}`
      const desc = description
        ?? (isHome ? siteMeta.homeDescription : siteMeta.siteDescription)
      const rawImg = image ?? (isHome && siteMeta.homeOgImage ? siteMeta.homeOgImage : siteMeta.ogImage)
      const img = rawImg?.startsWith('/') ? `${window.location.origin}${rawImg}` : rawImg
      const pageUrl = url ?? (window.location.origin + window.location.pathname)

      document.title = fullTitle

      setMeta('og:title', fullTitle)
      setMeta('og:description', desc)
      setMeta('og:image', img)
      setMeta('og:url', pageUrl)
      setMeta('og:type', type)
      setMeta('og:site_name', siteMeta.siteTitle)
      setMeta('og:locale', siteMeta.locale)
      setMeta('description', desc, 'name')
      setMeta('twitter:card', 'summary_large_image', 'name')
      setMeta('twitter:title', fullTitle, 'name')
      setMeta('twitter:description', desc, 'name')
      setMeta('twitter:image', img, 'name')
      if (siteMeta.twitterSite) setMeta('twitter:site', siteMeta.twitterSite, 'name')
    })
  }, [title, description, image, url, type])
}

// Pre-warm cache on import so the first useSEO call gets near-instant data
getSiteMeta()

export { siteMetaCache }
