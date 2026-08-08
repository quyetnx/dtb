import { useEffect, useState } from 'react'

interface VideoItem {
  id: string
  title: string
  description: string
  publishedAt: string
  thumbnail: string
  channelTitle: string
}

export default function VideoPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/youtube/list?maxResults=24')
      .then((r) => r.json())
      .then((d) => setVideos(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="py-16" style={{ borderBottom: '1px solid var(--color-muted-border)' }}>
        <div className="container-main">
          <p className="text-label mb-3" style={{ color: 'var(--color-oxblood)' }}>Kênh YouTube</p>
          <h1 className="text-display-lg" style={{ color: 'var(--color-charcoal)' }}>Video</h1>
          <p className="text-body-lg mt-4" style={{ color: 'var(--color-charcoal-muted)', maxWidth: '480px' }}>
            Các video talkshow, đọc thơ, hồi ký và chia sẻ văn học của Dương Thanh Biểu.
          </p>
        </div>
      </div>

      <div className="container-main section-gap">
        {loading ? (
          <div className="py-24 text-center">
            <p className="text-body-md" style={{ color: 'var(--color-charcoal-muted)' }}>Đang tải...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-body-md" style={{ color: 'var(--color-charcoal-muted)' }}>
              Chưa có video nào.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((v) => (
              <div key={v.id} className="group">
                {playing === v.id ? (
                  <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '2px', overflow: 'hidden' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${v.id}?autoplay=1`}
                      title={v.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setPlaying(v.id)}
                    className="w-full text-left"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    <div
                      style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '2px', overflow: 'hidden', backgroundColor: '#111' }}
                    >
                      <img
                        src={v.thumbnail}
                        alt={v.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s' }}
                        className="group-hover:opacity-80"
                      />
                      {/* Play button */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <div style={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.92)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform 0.15s',
                        }} className="group-hover:scale-110">
                          <span className="material-symbols-outlined" style={{ color: '#c00', fontSize: 28, marginLeft: 3 }}>
                            play_arrow
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                <div className="mt-3">
                  <h3
                    className="text-display-sm"
                    style={{ color: 'var(--color-charcoal)', lineHeight: 1.4 }}
                  >
                    {v.title}
                  </h3>
                  <p className="text-label mt-2" style={{ color: 'var(--color-charcoal-muted)' }}>
                    {new Date(v.publishedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
