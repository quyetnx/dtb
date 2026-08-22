import { useEffect, useState } from 'react'

interface Ad {
  id: string
  title: string
  imageId: string
  link: string
  position: string
  size?: string
  active: boolean
  order: number
}

let cachedAds: Ad[] | null = null

async function fetchAds(): Promise<Ad[]> {
  if (cachedAds) return cachedAds
  const res = await fetch('/api/ads')
  const d = await res.json() as { ads: Ad[] }
  cachedAds = d.ads ?? []
  return cachedAds
}

function parseSizeCss(size?: string): React.CSSProperties {
  if (!size || size === 'full') return { width: '100%' }
  const m = size.match(/^(\d+)x(\d+)$/)
  if (!m) return { width: '100%' }
  return { width: Number(m[1]), maxWidth: '100%' }
}

interface AdBannerProps {
  position: 'home' | 'article' | 'video'
  className?: string
  style?: React.CSSProperties
}

export default function AdBanner({ position, className, style }: AdBannerProps) {
  const [ads, setAds] = useState<Ad[]>([])

  useEffect(() => {
    fetchAds()
      .then((all) => {
        const filtered = all
          .filter((a) => a.active && a.position === position)
          .sort((a, b) => a.order - b.order)
        setAds(filtered)
      })
      .catch(() => {})
  }, [position])

  if (ads.length === 0) return null

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, ...style }}>
      {ads.map((ad) => (
        <a
          key={ad.id}
          href={ad.link}
          target="_blank"
          rel="noopener noreferrer"
          title={ad.title}
          style={{ display: 'block', borderRadius: 4, overflow: 'hidden', lineHeight: 0, ...parseSizeCss(ad.size) }}
        >
          <img
            src={`/api/drive/image?id=${ad.imageId}`}
            alt={ad.title}
            style={{ width: '100%', display: 'block', objectFit: 'cover' }}
            onError={(e) => { (e.target as HTMLImageElement).closest('a')!.style.display = 'none' }}
          />
        </a>
      ))}
    </div>
  )
}
