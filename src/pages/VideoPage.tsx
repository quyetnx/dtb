import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import AdBanner from '../components/AdBanner'

interface VideoItem {
  id: string
  title: string
  description: string
  publishedAt: string
  thumbnail: string
  channelTitle: string
}

const PAGE_SIZE = 12

export default function VideoPage() {
  useSEO({ title: 'Video', description: 'Các video của Dương Thanh Biểu trên YouTube.' })
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [nextToken, setNextToken] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchPage = useCallback((q: string, pageToken: string | null, append: boolean) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    const params = new URLSearchParams({ maxResults: String(PAGE_SIZE) })
    if (q) params.set('q', q)
    if (pageToken) params.set('pageToken', pageToken)
    fetch(`/api/youtube/list?${params}`)
      .then((r) => r.json() as Promise<{ items: VideoItem[]; nextPageToken: string | null }>)
      .then((d) => {
        setVideos((prev) => append ? [...prev, ...(d.items ?? [])] : (d.items ?? []))
        setNextToken(d.nextPageToken ?? null)
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setLoadingMore(false) })
  }, [])

  useEffect(() => {
    fetchPage(debouncedQuery, null, false)
  }, [debouncedQuery, fetchPage])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 400)
  }

  return (
    <>
      {/* Page header */}
      <div className="py-16" style={{ borderBottom: '1px solid var(--color-muted-border)' }}>
        <div className="container-main">
          <p className="text-label mb-3" style={{ color: 'var(--color-oxblood)' }}>Kênh YouTube</p>
          <h1 className="text-display-lg" style={{ color: 'var(--color-charcoal)' }}>Thư viện Video</h1>
          <p className="text-body-lg mt-4" style={{ color: 'var(--color-charcoal-muted)', maxWidth: '520px' }}>
            Nơi lưu giữ những buổi trò chuyện, đọc thơ và phim tài liệu văn hóa. Một góc nhỏ tĩnh lặng giữa dòng chảy thông tin.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="container-main" style={{ paddingTop: 32 }}>
        <div style={{ maxWidth: 420, position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--color-charcoal-muted)', fontSize: 20, pointerEvents: 'none',
            }}
          >
            search
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Tìm kiếm video..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid var(--color-muted-border)',
              fontSize: 14,
              background: 'var(--color-surface)',
              color: 'var(--color-charcoal)',
              outline: 'none',
              borderRadius: 2,
            }}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="container-main section-gap">
        {loading ? (
          <div className="py-24 text-center">
            <p className="text-body-md" style={{ color: 'var(--color-charcoal-muted)' }}>Đang tải...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-body-md" style={{ color: 'var(--color-charcoal-muted)' }}>
              {debouncedQuery ? `Không tìm thấy video nào cho "${debouncedQuery}".` : 'Chưa có video nào.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {videos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>

            {nextToken && (
              <div style={{ textAlign: 'center', marginTop: 48 }}>
                <button
                  onClick={() => fetchPage(debouncedQuery, nextToken, true)}
                  disabled={loadingMore}
                  className="text-label transition-colors"
                  style={{
                    padding: '12px 32px',
                    border: '1px solid var(--color-charcoal)',
                    background: 'transparent',
                    color: loadingMore ? 'var(--color-charcoal-muted)' : 'var(--color-charcoal)',
                    cursor: loadingMore ? 'default' : 'pointer',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 500,
                  }}
                >
                  {loadingMore ? 'Đang tải...' : 'Tải Thêm Video'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AdBanner position="video" className="container-main" style={{ paddingBottom: 48 }} />
    </>
  )
}

function VideoCard({ video }: { video: VideoItem }) {
  const date = new Date(video.publishedAt).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  return (
    <Link to={`/video/${video.id}`} className="group block">
      {/* Thumbnail */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '16/9',
          overflow: 'hidden',
          backgroundColor: 'var(--color-paper-ivory-dark)',
          borderRadius: 2,
        }}
      >
        <img
          src={video.thumbnail}
          alt={video.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s' }}
          className="group-hover:scale-105"
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(4,22,39,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.25s',
          }}
          className="group-hover:opacity-100"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 52, color: '#fff', fontVariationSettings: "'FILL' 1" }}
          >
            play_circle
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="pt-3">
        <p className="text-label" style={{ color: 'var(--color-charcoal-muted)' }}>
          {date}
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 500,
            lineHeight: 1.35,
            color: 'var(--color-charcoal)',
            marginTop: 4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            transition: 'color 0.15s',
          }}
          className="group-hover:text-[var(--color-oxblood)]"
        >
          {video.title}
        </h2>
      </div>
    </Link>
  )
}
