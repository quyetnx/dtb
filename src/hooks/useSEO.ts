import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
}

const SITE_NAME = 'Dương Thanh Biểu'
const DEFAULT_IMAGE = 'https://hoduongvietnam.com.vn/uploads/images/duong-thanh-bieu(1).png'

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
    const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Văn học & Thi ca`
    const desc = description ?? `${SITE_NAME} — Nhà văn, nhà thơ với hơn bốn thập kỷ cầm bút.`
    const img = image ?? DEFAULT_IMAGE
    const pageUrl = url ?? (window.location.origin + window.location.pathname)

    document.title = fullTitle

    setMeta('og:title', fullTitle)
    setMeta('og:description', desc)
    setMeta('og:image', img)
    setMeta('og:url', pageUrl)
    setMeta('og:type', type)
    setMeta('og:site_name', SITE_NAME)
    setMeta('og:locale', 'vi_VN')
    setMeta('description', desc, 'name')
    setMeta('twitter:card', 'summary_large_image', 'name')
    setMeta('twitter:title', fullTitle, 'name')
    setMeta('twitter:description', desc, 'name')
    setMeta('twitter:image', img, 'name')
  }, [title, description, image, url, type])
}
