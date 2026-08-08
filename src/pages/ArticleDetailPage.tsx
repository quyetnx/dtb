import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { marked } from 'marked'

interface FileMeta {
  id: string
  name: string
  modifiedTime: string
  appProperties?: { type?: string; category?: string }
}

export default function ArticleDetailPage() {
  const { slug: id = '' } = useParams()
  const [content, setContent] = useState('')
  const [meta, setMeta] = useState<FileMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/drive/file?id=${id}`)
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null }
        return r.json()
      })
      .then((d) => {
        if (!d) return
        const { content: raw, ...rest } = d
        setContent(raw ?? '')
        setMeta(rest as FileMeta)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="container-main section-gap text-center">
        <p style={{ color: 'var(--color-charcoal-muted)' }}>Đang tải...</p>
      </div>
    )
  }

  if (notFound || !meta) {
    return (
      <div className="container-main section-gap text-center">
        <p style={{ color: 'var(--color-charcoal-muted)' }}>Không tìm thấy tác phẩm.</p>
        <Link to="/van-tho" className="inline-block mt-4 text-label" style={{ color: 'var(--color-oxblood)' }}>
          ← Trở về
        </Link>
      </div>
    )
  }

  const title = meta.name.replace(/\.md$/, '')
  const html = marked.parse(content) as string

  return (
    <>
      <article className="container-main">
        <header className="pt-12 pb-10" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <nav className="flex items-center gap-2 text-label mb-6" style={{ color: 'var(--color-charcoal-muted)' }}>
            <Link to="/" className="hover:text-[var(--color-charcoal)]">Trang chủ</Link>
            <span className="material-symbols-outlined text-[0.8em]">chevron_right</span>
            <Link to="/van-tho" className="hover:text-[var(--color-charcoal)]">Văn Thơ</Link>
            {meta.appProperties?.category && (
              <>
                <span className="material-symbols-outlined text-[0.8em]">chevron_right</span>
                <span style={{ color: 'var(--color-charcoal)' }}>{meta.appProperties.category}</span>
              </>
            )}
          </nav>

          {meta.appProperties?.category && (
            <p className="text-label mb-4" style={{ color: 'var(--color-oxblood)' }}>
              {meta.appProperties.category}
            </p>
          )}
          <h1 className="text-display-lg" style={{ color: 'var(--color-charcoal)' }}>{title}</h1>

          <div
            className="flex items-center gap-4 mt-6 pt-6 text-label"
            style={{ color: 'var(--color-charcoal-muted)', borderTop: '1px solid var(--color-muted-border)' }}
          >
            <span>Dương Thanh Biểu</span>
            <span>·</span>
            <span>{new Date(meta.modifiedTime).toLocaleDateString('vi-VN')}</span>
          </div>
        </header>

        <div
          className="pb-16 prose-content"
          style={{ maxWidth: '720px', margin: '0 auto', borderBottom: '1px solid var(--color-muted-border)' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="py-10" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <Link
            to="/van-tho"
            className="inline-flex items-center gap-2 text-label transition-colors hover:text-[var(--color-charcoal)]"
            style={{ color: 'var(--color-charcoal-muted)' }}
          >
            <span className="material-symbols-outlined text-[1em]">arrow_back</span>
            Xem tất cả tác phẩm
          </Link>
        </div>
      </article>
    </>
  )
}
