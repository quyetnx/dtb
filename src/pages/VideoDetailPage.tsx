import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'

interface VideoDetail {
  id: string
  title: string
  description: string
  publishedAt: string
  channelTitle: string
  thumbnail: string
  duration: string
}

interface RelatedVideo {
  id: string
  title: string
  publishedAt: string
  thumbnail: string
}

function parseDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return ''
  const h = parseInt(m[1] ?? '0')
  const min = parseInt(m[2] ?? '0')
  const sec = parseInt(m[3] ?? '0')
  const mm = String(min).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${min}:${ss}`
}

export default function VideoDetailPage() {
  const { id = '' } = useParams()
  const [video, setVideo] = useState<VideoDetail | null>(null)
  const [related, setRelated] = useState<RelatedVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setPlaying(false)
    fetch(`/api/youtube/video?id=${id}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null }
        return r.json() as Promise<VideoDetail>
      })
      .then((d) => { if (d) setVideo(d) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  // Fetch related: get top 20 published, exclude current, take 4
  useEffect(() => {
    fetch('/api/youtube/list?maxResults=20')
      .then((r) => r.json() as Promise<{ items: RelatedVideo[] }>)
      .then((d) => setRelated((d.items ?? []).filter((v) => v.id !== id).slice(0, 4)))
      .catch(() => {})
  }, [id])

  useSEO({
    title: video?.title,
    description: video?.description?.slice(0, 200),
    image: video?.thumbnail,
    type: 'article',
  })

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: video?.title ?? '', url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="container-main section-gap text-center">
        <p style={{ color: 'var(--color-charcoal-muted)' }}>Đang tải...</p>
      </div>
    )
  }

  if (notFound || !video) {
    return (
      <div className="container-main section-gap text-center">
        <p style={{ color: 'var(--color-charcoal-muted)' }}>Không tìm thấy video.</p>
        <Link to="/video" className="inline-block mt-4 text-label" style={{ color: 'var(--color-oxblood)' }}>
          ← Trở về
        </Link>
      </div>
    )
  }

  const date = new Date(video.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const duration = parseDuration(video.duration)

  return (
    <div className="container-main" style={{ paddingTop: 48, paddingBottom: 96 }}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-label mb-8" style={{ color: 'var(--color-charcoal-muted)' }}>
        <Link to="/" className="hover:text-[var(--color-charcoal)]">Trang chủ</Link>
        <span className="material-symbols-outlined text-[0.8em]">chevron_right</span>
        <Link to="/video" className="hover:text-[var(--color-charcoal)]">Video</Link>
        <span className="material-symbols-outlined text-[0.8em]">chevron_right</span>
        <span
          style={{
            color: 'var(--color-charcoal)',
            maxWidth: 220,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'inline-block',
            verticalAlign: 'bottom',
          }}
          title={video.title}
        >
          {video.title}
        </span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* ── Main content ──────────────────────────────── */}
        <article style={{ flex: '1 1 0', minWidth: 0 }}>
          {/* Video player */}
          <div
            style={{
              position: 'relative',
              aspectRatio: '16/9',
              borderRadius: 4,
              overflow: 'hidden',
              backgroundColor: '#111',
              marginBottom: 28,
            }}
          >
            {playing ? (
              <iframe
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            ) : (
              <div
                className="group"
                style={{ cursor: 'pointer', width: '100%', height: '100%', position: 'relative' }}
                onClick={() => setPlaying(true)}
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                    transition: 'opacity 0.3s',
                  }}
                  className="group-hover:opacity-90"
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundColor: 'rgba(4,22,39,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div
                    className="group-hover:scale-110"
                    style={{
                      width: 72, height: 72, borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.92)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 40, color: 'var(--color-oxblood)', marginLeft: 4, fontVariationSettings: "'FILL' 1" }}
                    >
                      play_arrow
                    </span>
                  </div>
                </div>
                {duration && (
                  <div style={{
                    position: 'absolute', bottom: 10, right: 12,
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    color: '#fff',
                    fontSize: 12,
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 500,
                    padding: '2px 6px',
                    borderRadius: 2,
                  }}>
                    {duration}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Header */}
          <header style={{ borderBottom: '1px solid var(--color-muted-border)', paddingBottom: 20, marginBottom: 24 }}>
            <div className="flex items-center gap-3 mb-3 text-label" style={{ color: 'var(--color-charcoal-muted)' }}>
              <time>{date}</time>
              {video.channelTitle && (
                <>
                  <span>·</span>
                  <span style={{ color: 'var(--color-oxblood)' }}>{video.channelTitle}</span>
                </>
              )}
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.6rem, 3vw, 2.25rem)',
                lineHeight: 1.25,
                fontWeight: 500,
                color: 'var(--color-charcoal)',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {video.title}
            </h1>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-label transition-colors hover:text-[var(--color-oxblood)]"
                style={{
                  padding: '8px 0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-charcoal-muted)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>share</span>
                {copied ? 'Đã sao chép!' : 'Chia sẻ'}
              </button>
              <a
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-label transition-colors hover:text-[var(--color-oxblood)]"
                style={{
                  padding: '8px 0',
                  color: 'var(--color-charcoal-muted)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.75rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>open_in_new</span>
                Xem trên YouTube
              </a>
            </div>
          </header>

          {/* Description */}
          {video.description && (
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '1.1rem',
                  lineHeight: 1.8,
                  color: 'var(--color-charcoal)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {video.description}
              </p>
            </div>
          )}

          {/* Back link */}
          <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--color-muted-border)' }}>
            <Link
              to="/video"
              className="inline-flex items-center gap-2 text-label transition-colors hover:text-[var(--color-charcoal)]"
              style={{ color: 'var(--color-charcoal-muted)' }}
            >
              <span className="material-symbols-outlined text-[1em]">arrow_back</span>
              Thư viện Video
            </Link>
          </div>
        </article>

        {/* ── Sidebar ───────────────────────────────────── */}
        {related.length > 0 && (
          <aside
            style={{
              width: '100%',
              maxWidth: 320,
              flexShrink: 0,
              borderLeft: '1px solid var(--color-muted-border)',
              paddingLeft: 32,
            }}
            className="hidden lg:block"
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 500,
                color: 'var(--color-charcoal)',
                borderBottom: '1px solid var(--color-muted-border)',
                paddingBottom: 12,
                marginBottom: 20,
              }}
            >
              Video liên quan
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {related.map((v) => (
                <Link
                  key={v.id}
                  to={`/video/${v.id}`}
                  className="group flex gap-4"
                >
                  <div
                    style={{
                      width: 120,
                      height: 72,
                      flexShrink: 0,
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      backgroundColor: 'var(--color-paper-ivory-dark)',
                    }}
                  >
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease-out' }}
                      className="scale-110 group-hover:scale-100"
                    />
                    <span
                      className="material-symbols-outlined"
                      style={{
                        position: 'absolute',
                        bottom: 4, right: 4,
                        fontSize: 14,
                        color: '#fff',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderRadius: 2,
                        padding: '0 2px',
                      }}
                    >
                      play_arrow
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.9rem',
                        lineHeight: 1.4,
                        fontWeight: 500,
                        color: 'var(--color-charcoal)',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        transition: 'color 0.15s',
                      }}
                      className="group-hover:text-[var(--color-oxblood)]"
                    >
                      {v.title}
                    </h3>
                    <p className="text-label mt-1" style={{ color: 'var(--color-charcoal-muted)', fontSize: 11 }}>
                      {new Date(v.publishedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
