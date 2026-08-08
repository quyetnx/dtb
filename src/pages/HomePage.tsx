import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'

const AUTHOR_PHOTO = 'https://hoduongvietnam.com.vn/uploads/images/duong-thanh-bieu(1).png'

interface FileItem {
  id: string
  name: string
  modifiedTime: string
  appProperties?: { type?: string; category?: string; status?: string }
}

interface VideoItem {
  id: string
  title: string
  publishedAt: string
  thumbnail: string
}

interface Bio {
  quote: string
  bio: string
  bioDetail: string
}

const DEFAULT_BIO: Bio = {
  quote: 'Văn chương là cầu nối giữa tâm hồn con người với con người, giữa quá khứ và hiện tại, giữa đau thương và hy vọng.',
  bio: 'Dương Thanh Biểu là nhà văn, nhà thơ người Việt Nam với hơn bốn thập kỷ cầm bút.',
  bioDetail: 'Tác phẩm của ông phản ánh sâu sắc hiện thực lịch sử, tình người và quê hương đất nước qua từng giai đoạn của dân tộc.',
}

export default function HomePage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [bio, setBio] = useState<Bio>(DEFAULT_BIO)

  useSEO({})

  useEffect(() => {
    fetch('/api/drive/list')
      .then((r) => r.json())
      .then((d) => setFiles(d.files ?? []))
      .catch(() => {})
    fetch('/api/youtube/list?maxResults=3')
      .then((r) => r.json())
      .then((d) => setVideos(d.items ?? []))
      .catch(() => {})
    fetch('/api/site/bio')
      .then((r) => r.json())
      .then((d: Bio) => setBio(d))
      .catch(() => {})
  }, [])

  const vanXuoi = files.filter((f) => f.appProperties?.type === 'van-xuoi').slice(0, 3)
  const tho = files.filter((f) => f.appProperties?.type === 'tho').slice(0, 3)

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="section-gap" style={{ borderBottom: '1px solid var(--color-muted-border)' }}>
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-7 order-2 lg:order-1">
              <p className="text-label mb-6" style={{ color: 'var(--color-oxblood)' }}>
                Nhà văn · Nhà thơ · Hồi ký
              </p>
              <h1 className="text-display-xl" style={{ color: 'var(--color-charcoal)' }}>
                Dương Thanh Biểu
              </h1>
              <p
                className="text-display-sm mt-2 font-display italic"
                style={{ color: 'var(--color-charcoal-muted)', fontWeight: 400 }}
              >
                Văn học & Thi ca
              </p>

              {bio.quote && (
                <blockquote
                  className="mt-10 pl-5 text-body-lg italic"
                  style={{
                    color: 'var(--color-charcoal-muted)',
                    borderLeft: '3px solid var(--color-oxblood)',
                  }}
                >
                  "{bio.quote}"
                </blockquote>
              )}

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/van-tho"
                  className="inline-flex items-center gap-2 px-6 py-3 text-label text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-oxblood)', borderRadius: '2px' }}
                >
                  Khám phá tác phẩm
                  <span className="material-symbols-outlined text-[1em]">arrow_forward</span>
                </Link>
                <Link
                  to="/nghe-thuat-van-hoa"
                  className="inline-flex items-center gap-2 px-6 py-3 text-label transition-colors"
                  style={{
                    color: 'var(--color-charcoal)',
                    border: '1px solid var(--color-muted-border)',
                    borderRadius: '2px',
                  }}
                >
                  Nghệ thuật & Văn hóa
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 order-1 lg:order-2">
              <div
                className="relative overflow-hidden"
                style={{
                  aspectRatio: '3/4',
                  borderRadius: '2px',
                  backgroundColor: 'var(--color-paper-ivory-dark)',
                  maxHeight: '70vh',
                }}
              >
                <img
                  src={AUTHOR_PHOTO}
                  alt="Dương Thanh Biểu"
                  className="w-full h-full object-cover object-top"
                />
                {/* Subtle gradient at bottom */}
                <div style={{
                  position: 'absolute',
                  bottom: 0, left: 0, right: 0,
                  height: 80,
                  background: 'linear-gradient(to top, rgba(250,249,245,0.6), transparent)',
                }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Literature ───────────────────────────── */}
      {vanXuoi.length > 0 && (
        <section className="section-gap">
          <div className="container-main">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-label mb-2" style={{ color: 'var(--color-oxblood)' }}>
                  Tác phẩm nổi bật
                </p>
                <h2 className="text-display-md" style={{ color: 'var(--color-charcoal)' }}>
                  Văn xuôi
                </h2>
              </div>
              <Link
                to="/van-tho"
                className="hidden md:inline-flex items-center gap-1 text-label transition-colors hover:text-[var(--color-charcoal)]"
                style={{ color: 'var(--color-charcoal-muted)' }}
              >
                Xem tất cả
                <span className="material-symbols-outlined text-[1em]">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {vanXuoi.map((f, i) => (
                <Link
                  key={f.id}
                  to={`/van-tho/${f.id}`}
                  className="group block card-hover p-8"
                  style={{
                    borderTop: '1px solid var(--color-muted-border)',
                    borderLeft: i > 0 ? '1px solid var(--color-muted-border)' : 'none',
                    minHeight: 180,
                  }}
                >
                  {f.appProperties?.category && (
                    <p className="text-label" style={{ color: 'var(--color-oxblood)' }}>
                      {f.appProperties.category}
                    </p>
                  )}
                  <h3
                    className="mt-3 transition-colors group-hover:text-[var(--color-oxblood)]"
                    style={{
                      color: 'var(--color-charcoal)',
                      fontSize: 20,
                      fontWeight: 700,
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {f.name.replace(/\.md$/, '')}
                  </h3>
                  <p className="text-label mt-4" style={{ color: 'var(--color-charcoal-muted)' }}>
                    {new Date(f.modifiedTime).toLocaleDateString('vi-VN')}
                  </p>
                </Link>
              ))}
            </div>
            <div style={{ height: '1px', backgroundColor: 'var(--color-muted-border)' }} />
          </div>
        </section>
      )}

      {/* ── Featured Poems ────────────────────────────────── */}
      {tho.length > 0 && (
        <section className="section-gap" style={{ borderTop: vanXuoi.length > 0 ? 'none' : '1px solid var(--color-muted-border)' }}>
          <div className="container-main">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-3">
                <p className="text-label mb-2" style={{ color: 'var(--color-oxblood)' }}>
                  Thi ca
                </p>
                <h2 className="text-display-md" style={{ color: 'var(--color-charcoal)' }}>
                  Thơ gần đây
                </h2>
                <p className="text-body-md mt-4" style={{ color: 'var(--color-charcoal-muted)' }}>
                  Những vần thơ ghi lại cảm xúc, kỷ niệm và suy ngẫm về cuộc đời.
                </p>
                <Link
                  to="/van-tho"
                  className="inline-flex items-center gap-1 mt-6 text-label transition-colors hover:text-[var(--color-charcoal)]"
                  style={{ color: 'var(--color-oxblood)' }}
                >
                  Xem tất cả thơ
                  <span className="material-symbols-outlined text-[1em]">arrow_forward</span>
                </Link>
              </div>

              <div className="lg:col-span-9">
                <div className="flex flex-col" style={{ borderTop: '1px solid var(--color-muted-border)' }}>
                  {tho.map((f) => (
                    <Link
                      key={f.id}
                      to={`/tho/${f.id}`}
                      className="group py-8 flex gap-8 items-start"
                      style={{ borderBottom: '1px solid var(--color-muted-border)' }}
                    >
                      <div className="flex-1">
                        <h3
                          className="text-display-sm transition-colors group-hover:text-[var(--color-oxblood)]"
                          style={{ color: 'var(--color-charcoal)' }}
                        >
                          {f.name.replace(/\.md$/, '')}
                        </h3>
                        <p className="text-label mt-4" style={{ color: 'var(--color-charcoal-muted)' }}>
                          {new Date(f.modifiedTime).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <span
                        className="material-symbols-outlined text-xl mt-1 transition-transform group-hover:translate-x-1"
                        style={{ color: 'var(--color-muted-border)', flexShrink: 0 }}
                      >
                        arrow_forward
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── YouTube section ───────────────────────────────── */}
      {videos.length > 0 && (
        <section className="section-gap" style={{ borderTop: '1px solid var(--color-muted-border)' }}>
          <div className="container-main">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-label mb-2" style={{ color: 'var(--color-oxblood)' }}>
                  Kênh YouTube
                </p>
                <h2 className="text-display-md" style={{ color: 'var(--color-charcoal)' }}>
                  Video gần đây
                </h2>
              </div>
              <Link
                to="/video"
                className="hidden md:inline-flex items-center gap-1 text-label transition-colors hover:text-[var(--color-charcoal)]"
                style={{ color: 'var(--color-charcoal-muted)' }}
              >
                Xem tất cả
                <span className="material-symbols-outlined text-[1em]">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {videos.map((v) => (
                <Link key={v.id} to="/video" className="group block">
                  <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#111' }}>
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s, transform 0.3s' }}
                      className="group-hover:opacity-80 group-hover:scale-105"
                    />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.92)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s',
                      }}
                        className="group-hover:scale-110"
                      >
                        <span className="material-symbols-outlined" style={{ color: '#c00', fontSize: 22, marginLeft: 2 }}>play_arrow</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col">
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
                        transition: 'color 0.15s',
                      }}
                      className="group-hover:text-[var(--color-oxblood)]"
                    >
                      {v.title}
                    </h3>
                    <p className="text-label mt-1" style={{ color: 'var(--color-charcoal-muted)' }}>
                      {new Date(v.publishedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── About banner ─────────────────────────────────── */}
      <section
        className="section-gap"
        style={{ backgroundColor: 'var(--color-oxblood)', color: 'white' }}
      >
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
              <p className="text-label mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Về tác giả
              </p>
              <h2 className="text-display-lg" style={{ color: 'white', lineHeight: 1.2 }}>
                {bio.bio}
              </h2>
              {bio.bioDetail && (
                <p className="text-body-lg mt-6" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {bio.bioDetail}
                </p>
              )}
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <div style={{
                width: 1,
                alignSelf: 'stretch',
                backgroundColor: 'rgba(255,255,255,0.15)',
                display: 'none',
              }}
                className="lg:block"
              />
              <div className="lg:pl-12">
                <div className="text-label mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Tác phẩm tiêu biểu
                </div>
                {['Đêm trắng', 'Vùng đất lửa', 'Hồi ký chiến trường'].map((title) => (
                  <div key={title} style={{
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.1rem',
                    color: 'rgba(255,255,255,0.85)',
                    fontStyle: 'italic',
                  }}>
                    {title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
