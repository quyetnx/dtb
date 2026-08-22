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

export default function ArtsCulturePage() {
  useSEO({ title: 'Nghệ thuật & Văn hóa', description: 'Phê bình văn học, nghệ thuật và văn hóa của Dương Thanh Biểu.' })
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/drive/list')
      .then((r) => r.json())
      .then((d) => {
        const all: FileItem[] = d.files ?? []
        setFiles(all.filter((f) => f.appProperties?.type === 'nghe-thuat'))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const [hero, ...rest] = files

  return (
    <>
      {/* Page header */}
      <div className="py-16" style={{ borderBottom: '1px solid var(--color-muted-border)' }}>
        <div className="container-main">
          <p className="text-label mb-3" style={{ color: 'var(--color-oxblood)' }}>Chuyên trang</p>
          <h1 className="text-display-lg" style={{ color: 'var(--color-charcoal)' }}>
            Nghệ thuật & Văn hóa
          </h1>
          <p className="text-body-lg mt-4" style={{ color: 'var(--color-charcoal-muted)', maxWidth: '480px' }}>
            Khám phá thế giới nghệ thuật, văn hóa và di sản Việt Nam qua lăng kính văn học.
          </p>
        </div>
      </div>

      <div className="container-main section-gap">
        {loading ? (
          <div className="py-24 text-center">
            <p className="text-body-md" style={{ color: 'var(--color-charcoal-muted)' }}>Đang tải...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-body-md" style={{ color: 'var(--color-charcoal-muted)' }}>
              Chưa có bài viết nào.
            </p>
          </div>
        ) : (
          <>
            {/* Hero article */}
            {hero && (
              <Link
                to={`/van-tho/${hero.id}`}
                className="group block mb-20 card-hover"
                style={{
                  border: '1px solid var(--color-muted-border)',
                  borderRadius: '2px',
                  backgroundColor: 'var(--color-surface-warm)',
                  overflow: 'hidden',
                }}
              >
                {hero.appProperties?.coverImageId ? (
                  <>
                    <div style={{ width: '100%', maxHeight: 400, overflow: 'hidden', backgroundColor: 'var(--color-paper-ivory-dark)' }}>
                      <img
                        src={`/api/drive/image?id=${hero.appProperties.coverImageId}`}
                        alt={hero.name.replace(/\.md$/, '')}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block', maxHeight: 400, transition: 'transform 0.6s ease-out' }}
                        className="scale-110 group-hover:scale-100"
                        onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
                      />
                    </div>
                    <div className="p-10">
                      {hero.appProperties?.category && (
                        <p className="text-label mb-4" style={{ color: 'var(--color-oxblood)' }}>
                          {hero.appProperties.category} · Bài viết nổi bật
                        </p>
                      )}
                      <h2
                        className="text-display-md transition-colors group-hover:text-[var(--color-oxblood)]"
                        style={{ color: 'var(--color-charcoal)', maxWidth: '720px' }}
                      >
                        {hero.name.replace(/\.md$/, '')}
                      </h2>
                      {hero.description && (
                        <p
                          className="text-body-md mt-4"
                          style={{ color: 'var(--color-charcoal-muted)', maxWidth: '680px' }}
                        >
                          {hero.description}
                        </p>
                      )}
                      <div
                        className="flex items-center gap-3 mt-6 pt-6 text-label"
                        style={{ color: 'var(--color-charcoal-muted)', borderTop: '1px solid var(--color-muted-border)' }}
                      >
                        <span>Dương Thanh Biểu</span>
                        <span>·</span>
                        <span>{new Date(hero.modifiedTime).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-10">
                    {hero.appProperties?.category && (
                      <p className="text-label mb-4" style={{ color: 'var(--color-oxblood)' }}>
                        {hero.appProperties.category} · Bài viết nổi bật
                      </p>
                    )}
                    <h2
                      className="text-display-md transition-colors group-hover:text-[var(--color-oxblood)]"
                      style={{ color: 'var(--color-charcoal)', maxWidth: '720px' }}
                    >
                      {hero.name.replace(/\.md$/, '')}
                    </h2>
                    {hero.description && (
                      <p className="text-body-md mt-4" style={{ color: 'var(--color-charcoal-muted)', maxWidth: '680px' }}>
                        {hero.description}
                      </p>
                    )}
                    <div
                      className="flex items-center gap-3 mt-6 pt-6 text-label"
                      style={{ color: 'var(--color-charcoal-muted)', borderTop: '1px solid var(--color-muted-border)' }}
                    >
                      <span>Dương Thanh Biểu</span>
                      <span>·</span>
                      <span>{new Date(hero.modifiedTime).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                )}
              </Link>
            )}

            {rest.length > 0 && (
              <>
                <h2 className="text-display-md mb-10" style={{ color: 'var(--color-charcoal)' }}>
                  Bài viết gần đây
                </h2>
                <div style={{ borderTop: '1px solid var(--color-muted-border)' }}>
                  {rest.map((f) => {
                    const coverImageId = f.appProperties?.coverImageId
                    return (
                      <Link
                        key={f.id}
                        to={`/van-tho/${f.id}`}
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
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}
