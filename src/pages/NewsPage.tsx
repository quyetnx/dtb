import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import DriveImage from '../components/DriveImage'

interface FileItem {
  id: string
  name: string
  modifiedTime: string
  description?: string
  appProperties?: { type?: string; category?: string; coverImageId?: string }
}

const CATEGORY_FILTERS = ['Tất cả', 'Thời sự', 'Sự kiện', 'Thông báo', 'Hoạt động', 'Giải thưởng']

export default function NewsPage() {
  useSEO({ title: 'Tin tức', description: 'Tin tức, sự kiện và hoạt động của Dương Thanh Biểu.' })
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('Tất cả')

  useEffect(() => {
    fetch('/api/drive/list')
      .then((r) => r.json())
      .then((d) => setFiles(d.files ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = files.filter((f) => {
    if (f.appProperties?.type !== 'tin-tuc') return false
    if (activeFilter === 'Tất cả') return true
    return f.appProperties?.category === activeFilter
  })

  return (
    <>
      <div className="py-16" style={{ borderBottom: '1px solid var(--color-muted-border)' }}>
        <div className="container-main">
          <p className="text-label mb-3" style={{ color: 'var(--color-oxblood)' }}>Cập nhật</p>
          <h1 className="text-display-lg" style={{ color: 'var(--color-charcoal)' }}>Tin tức</h1>
          <p className="text-body-lg mt-4" style={{ color: 'var(--color-charcoal-muted)', maxWidth: '480px' }}>
            Tin tức, sự kiện và hoạt động của Dương Thanh Biểu.
          </p>
        </div>
      </div>

      <div className="sticky top-16 z-40 py-4" style={{ backgroundColor: 'var(--color-paper-ivory)', borderBottom: '1px solid var(--color-muted-border)' }}>
        <div className="container-main">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className="shrink-0 px-4 py-2 text-label transition-colors"
                style={{
                  borderRadius: '2px',
                  backgroundColor: activeFilter === cat ? 'var(--color-oxblood)' : 'transparent',
                  color: activeFilter === cat ? 'white' : 'var(--color-charcoal-muted)',
                  border: `1px solid ${activeFilter === cat ? 'var(--color-oxblood)' : 'var(--color-muted-border)'}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-main section-gap">
        {loading ? (
          <div className="py-24 text-center">
            <p className="text-body-md" style={{ color: 'var(--color-charcoal-muted)' }}>Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-body-md" style={{ color: 'var(--color-charcoal-muted)' }}>Chưa có tin tức nào.</p>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--color-muted-border)' }}>
            {filtered.map((f) => (
              <Link
                key={f.id}
                to={`/tin-tuc/${f.id}`}
                className="group flex items-start gap-6 py-8 -mx-4 px-4 transition-colors rounded-sm hover:bg-[var(--color-surface-warm)]"
                style={{ borderBottom: '1px solid var(--color-muted-border)' }}
              >
                <div className="flex-1 min-w-0">
                  {f.appProperties?.category && (
                    <p className="text-label" style={{ color: 'var(--color-oxblood)' }}>
                      {f.appProperties.category}
                    </p>
                  )}
                  <h3
                    className="text-display-sm mt-2 transition-colors group-hover:text-[var(--color-oxblood)]"
                    style={{ color: 'var(--color-charcoal)' }}
                  >
                    {f.name.replace(/\.md$/, '')}
                  </h3>
                  {f.description && (
                    <p
                      className="mt-2"
                      style={{
                        color: 'var(--color-charcoal-muted)',
                        fontSize: '0.95rem',
                        lineHeight: 1.65,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {f.description}
                    </p>
                  )}
                  <p className="text-label mt-3" style={{ color: 'var(--color-charcoal-muted)' }}>
                    {new Date(f.modifiedTime).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                {f.appProperties?.coverImageId ? (
                  <div className="shrink-0" style={{ width: 128, height: 86, borderRadius: 2, overflow: 'hidden', backgroundColor: 'var(--color-paper-ivory-dark)' }}>
                    <DriveImage
                      fileId={f.appProperties.coverImageId}
                      defaultWidth={400}
                      sizes="128px"
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', transition: 'transform 0.6s ease-out' }}
                      className="scale-110 group-hover:scale-100"
                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                    />
                  </div>
                ) : (
                  <span
                    className="material-symbols-outlined text-xl mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                    style={{ color: 'var(--color-muted-border)' }}
                  >
                    arrow_forward
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
