import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const AUTHOR_PHOTO = 'https://hoduongvietnam.com.vn/uploads/images/duong-thanh-bieu(1).png'

interface FileItem {
  id: string
  name: string
  modifiedTime: string
  appProperties?: { type?: string; category?: string; status?: string }
}

export default function HomePage() {
  const [files, setFiles] = useState<FileItem[]>([])

  useEffect(() => {
    fetch('/api/drive/list')
      .then((r) => r.json())
      .then((d) => setFiles(d.files ?? []))
      .catch(() => {})
  }, [])

  const vanXuoi = files.filter((f) => f.appProperties?.type === 'van-xuoi').slice(0, 3)
  const tho = files.filter((f) => f.appProperties?.type === 'tho').slice(0, 3)

  return (
    <>
      {/* Hero */}
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

              <blockquote
                className="mt-10 pl-5 text-body-lg italic"
                style={{
                  color: 'var(--color-charcoal-muted)',
                  borderLeft: '3px solid var(--color-oxblood)',
                }}
              >
                "Văn chương là cầu nối giữa tâm hồn con người với con người, giữa quá khứ và
                hiện tại, giữa đau thương và hy vọng."
              </blockquote>

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
                style={{ aspectRatio: '3/4', borderRadius: '2px', backgroundColor: 'var(--color-paper-ivory-dark)' }}
              >
                <img
                  src={AUTHOR_PHOTO}
                  alt="Dương Thanh Biểu"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Literature */}
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
                  }}
                >
                  {f.appProperties?.category && (
                    <p className="text-label" style={{ color: 'var(--color-oxblood)' }}>
                      {f.appProperties.category}
                    </p>
                  )}
                  <h3
                    className="text-display-sm mt-3 transition-colors group-hover:text-[var(--color-oxblood)]"
                    style={{ color: 'var(--color-charcoal)' }}
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

      {/* Divider */}
      {vanXuoi.length > 0 && tho.length > 0 && (
        <div className="container-main">
          <div style={{ height: '1px', backgroundColor: 'var(--color-muted-border)' }} />
        </div>
      )}

      {/* Featured Poems */}
      {tho.length > 0 && (
        <section className="section-gap">
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
                        style={{ color: 'var(--color-muted-border)' }}
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

      {/* About banner */}
      <section
        className="section-gap"
        style={{ backgroundColor: 'var(--color-oxblood)', color: 'white' }}
      >
        <div className="container-main text-center">
          <p className="text-label mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Về tác giả
          </p>
          <h2 className="text-display-lg" style={{ color: 'white', maxWidth: '720px', margin: '0 auto' }}>
            Dương Thanh Biểu là nhà văn, nhà thơ người Việt Nam với hơn bốn thập kỷ cầm bút
          </h2>
          <p
            className="text-body-lg mt-6 mx-auto"
            style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '600px' }}
          >
            Tác phẩm của ông phản ánh sâu sắc hiện thực lịch sử, tình người và quê hương đất
            nước qua từng giai đoạn của dân tộc.
          </p>
        </div>
      </section>
    </>
  )
}
