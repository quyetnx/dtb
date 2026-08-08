import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'

interface FileItem {
  id: string
  name: string
  modifiedTime: string
  description?: string
  appProperties?: { type?: string; category?: string; status?: string; coverImageId?: string }
}

const CATEGORY_FILTERS = ['Tất cả', 'Văn xuôi', 'Thơ']

export default function LiteraturePage() {
  useSEO({ title: 'Văn Thơ', description: 'Toàn bộ tác phẩm văn học, thơ ca và tùy bút của Dương Thanh Biểu.' })
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
    const type = f.appProperties?.type
    if (activeFilter === 'Văn xuôi') return type === 'van-xuoi'
    if (activeFilter === 'Thơ') return type === 'tho'
    return type === 'van-xuoi' || type === 'tho'
  })

  const [featured, ...rest] = filtered

  return (
    <>
      {/* Page header */}
      <div className="py-16" style={{ borderBottom: '1px solid var(--color-muted-border)' }}>
        <div className="container-main">
          <p className="text-label mb-3" style={{ color: 'var(--color-oxblood)' }}>Tuyển tập</p>
          <h1 className="text-display-lg" style={{ color: 'var(--color-charcoal)' }}>Văn Thơ</h1>
          <p className="text-body-lg mt-4" style={{ color: 'var(--color-charcoal-muted)', maxWidth: '480px' }}>
            Toàn bộ tác phẩm văn học, thơ ca và tùy bút của Dương Thanh Biểu.
          </p>
        </div>
      </div>

      {/* Category filter */}
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
            <p className="text-body-md" style={{ color: 'var(--color-charcoal-muted)' }}>
              Chưa có tác phẩm nào.
            </p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured && (
              <Link
                to={featured.appProperties?.type === 'tho' ? `/tho/${featured.id}` : `/van-tho/${featured.id}`}
                className="group block mb-16 card-hover"
                style={{
                  backgroundColor: 'var(--color-surface-warm)',
                  border: '1px solid var(--color-muted-border)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                {featured.appProperties?.coverImageId ? (
                  <div className="grid grid-cols-1 md:grid-cols-2" style={{ minHeight: 260 }}>
                    <div style={{ overflow: 'hidden', backgroundColor: 'var(--color-paper-ivory-dark)', maxHeight: 360 }}>
                      <img
                        src={`/api/drive/image?id=${featured.appProperties.coverImageId}`}
                        alt={featured.name.replace(/\.md$/, '')}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s' }}
                        className="group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                      />
                    </div>
                    <div className="p-10 flex flex-col justify-center">
                      {featured.appProperties?.category && (
                        <p className="text-label" style={{ color: 'var(--color-oxblood)' }}>
                          {featured.appProperties.category} · Nổi bật
                        </p>
                      )}
                      <h2
                        className="text-display-md mt-3 transition-colors group-hover:text-[var(--color-oxblood)]"
                        style={{ color: 'var(--color-charcoal)' }}
                      >
                        {featured.name.replace(/\.md$/, '')}
                      </h2>
                      {featured.description && (
                        <p
                          className="text-body-md mt-4"
                          style={{
                            color: 'var(--color-charcoal-muted)',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {featured.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-6 text-label" style={{ color: 'var(--color-charcoal-muted)' }}>
                        <span>Dương Thanh Biểu</span>
                        <span>·</span>
                        <span>{new Date(featured.modifiedTime).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-10">
                    {featured.appProperties?.category && (
                      <p className="text-label" style={{ color: 'var(--color-oxblood)' }}>
                        {featured.appProperties.category} · Nổi bật
                      </p>
                    )}
                    <h2
                      className="text-display-lg mt-3 transition-colors group-hover:text-[var(--color-oxblood)]"
                      style={{ color: 'var(--color-charcoal)', maxWidth: '720px' }}
                    >
                      {featured.name.replace(/\.md$/, '')}
                    </h2>
                    {featured.description && (
                      <p className="text-body-md mt-4" style={{ color: 'var(--color-charcoal-muted)', maxWidth: '600px' }}>
                        {featured.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-6 text-label" style={{ color: 'var(--color-charcoal-muted)' }}>
                      <span>Dương Thanh Biểu</span>
                      <span>·</span>
                      <span>{new Date(featured.modifiedTime).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                )}
              </Link>
            )}

            {/* List */}
            <div style={{ borderTop: '1px solid var(--color-muted-border)' }}>
              {rest.map((f) => {
                const coverImageId = f.appProperties?.coverImageId
                return (
                  <Link
                    key={f.id}
                    to={f.appProperties?.type === 'tho' ? `/tho/${f.id}` : `/van-tho/${f.id}`}
                    className="group flex items-start gap-6 py-8 card-hover"
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
                    {coverImageId ? (
                      <div
                        className="shrink-0"
                        style={{
                          width: 128,
                          height: 86,
                          borderRadius: 2,
                          overflow: 'hidden',
                          backgroundColor: 'var(--color-paper-ivory-dark)',
                        }}
                      >
                        <img
                          src={`/api/drive/image?id=${coverImageId}`}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                          className="group-hover:scale-105"
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
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}
