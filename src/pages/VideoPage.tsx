import { useEffect, useRef, useState, useCallback } from 'react'

interface VideoItem {
  id: string
  title: string
  description: string
  publishedAt: string
  thumbnail: string
  channelTitle: string
}

interface ApiResponse {
  items: VideoItem[]
  nextPageToken: string | null
  prevPageToken: string | null
}

const PAGE_SIZE = 12

export default function VideoPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [nextToken, setNextToken] = useState<string | null>(null)
  const [prevToken, setPrevToken] = useState<string | null>(null)
  const [currentToken, setCurrentToken] = useState<string | null>(null)
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const loadVideos = useCallback((q: string, pageToken: string | null) => {
    setLoading(true)
    const params = new URLSearchParams({ maxResults: String(PAGE_SIZE) })
    if (q) params.set('q', q)
    if (pageToken) params.set('pageToken', pageToken)
    fetch(`/api/youtube/list?${params}`)
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((d) => {
        setVideos(d.items ?? [])
        setNextToken(d.nextPageToken ?? null)
        setPrevToken(d.prevPageToken ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadVideos(debouncedQuery, currentToken)
  }, [debouncedQuery, currentToken, loadVideos])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setCurrentToken(null)
      setDebouncedQuery(value)
    }, 400)
  }

  const openDialog = (v: VideoItem) => {
    setActiveVideo(v)
    dialogRef.current?.showModal()
  }

  const closeDialog = () => {
    setActiveVideo(null)
    dialogRef.current?.close()
  }

  return (
    <>
      {/* Hero */}
      <div className="py-16" style={{ borderBottom: '1px solid var(--color-muted-border)' }}>
        <div className="container-main">
          <p className="text-label mb-3" style={{ color: 'var(--color-oxblood)' }}>Kênh YouTube</p>
          <h1 className="text-display-lg" style={{ color: 'var(--color-charcoal)' }}>Video</h1>
          <p className="text-body-lg mt-4" style={{ color: 'var(--color-charcoal-muted)', maxWidth: '480px' }}>
            Các video talkshow, đọc thơ, hồi ký và chia sẻ văn học của Dương Thanh Biểu.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="container-main" style={{ paddingTop: 32 }}>
        <div style={{ maxWidth: 420, position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-charcoal-muted)',
              fontSize: 20,
              pointerEvents: 'none',
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
              borderRadius: 4,
              border: '1px solid var(--color-muted-border)',
              fontSize: 14,
              background: 'var(--color-surface)',
              color: 'var(--color-charcoal)',
              outline: 'none',
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} onClick={() => openDialog(v)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {(prevToken || nextToken) && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 40 }}>
            <button
              disabled={!prevToken}
              onClick={() => { setCurrentToken(prevToken); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              style={{
                padding: '8px 20px',
                borderRadius: 4,
                border: '1px solid var(--color-muted-border)',
                background: prevToken ? 'var(--color-surface)' : 'transparent',
                color: prevToken ? 'var(--color-charcoal)' : 'var(--color-charcoal-muted)',
                cursor: prevToken ? 'pointer' : 'default',
                fontSize: 14,
              }}
            >
              ← Trang trước
            </button>
            <button
              disabled={!nextToken}
              onClick={() => { setCurrentToken(nextToken); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              style={{
                padding: '8px 20px',
                borderRadius: 4,
                border: '1px solid var(--color-muted-border)',
                background: nextToken ? 'var(--color-oxblood)' : 'transparent',
                color: nextToken ? '#fff' : 'var(--color-charcoal-muted)',
                cursor: nextToken ? 'pointer' : 'default',
                fontSize: 14,
              }}
            >
              Trang sau →
            </button>
          </div>
        )}
      </div>

      {/* Video dialog */}
      <dialog
        ref={dialogRef}
        onClick={(e) => { if (e.target === dialogRef.current) closeDialog() }}
        style={{
          border: 'none',
          borderRadius: 8,
          padding: 0,
          maxWidth: 'min(900px, 96vw)',
          width: '100%',
          background: '#0f0f0f',
          color: '#fff',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        }}
      >
        {activeVideo && (
          <div>
            {/* Player */}
            <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            </div>
            {/* Info row */}
            <div style={{ padding: '12px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4, margin: 0, color: '#fff' }}>
                  {activeVideo.title}
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                  {new Date(activeVideo.publishedAt).toLocaleDateString('vi-VN')}
                  {activeVideo.channelTitle ? ` · ${activeVideo.channelTitle}` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <a
                  href={`https://www.youtube.com/watch?v=${activeVideo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    borderRadius: 4,
                    background: '#ff0000',
                    color: '#fff',
                    fontSize: 13,
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                  YouTube
                </a>
                <button
                  onClick={closeDialog}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'transparent',
                    color: '#fff',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}

function VideoCard({ video, onClick }: { video: VideoItem; onClick: () => void }) {
  return (
    <div className="group" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div
        style={{
          position: 'relative',
          aspectRatio: '16/9',
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: '#111',
        }}
      >
        <img
          src={video.thumbnail}
          alt={video.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s' }}
          className="group-hover:opacity-80"
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.15s',
            }}
            className="group-hover:scale-110"
          >
            <span className="material-symbols-outlined" style={{ color: '#c00', fontSize: 26, marginLeft: 3 }}>
              play_arrow
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <h3
          style={{
            color: 'var(--color-charcoal)',
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.4,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {video.title}
        </h3>
        <p className="text-label mt-1" style={{ color: 'var(--color-charcoal-muted)' }}>
          {new Date(video.publishedAt).toLocaleDateString('vi-VN')}
        </p>
      </div>
    </div>
  )
}
