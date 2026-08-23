import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { marked } from 'marked'
import { useSEO } from '../hooks/useSEO'
import ShareButtons from '../components/ShareButtons'

interface FileMeta {
  id: string
  name: string
  mimeType?: string
  modifiedTime: string
  appProperties?: { type?: string; category?: string; coverImageId?: string }
  description?: string
}

export default function NewsDetailPage() {
  const { slug: id = '' } = useParams()
  const [content, setContent] = useState('')
  const [format, setFormat] = useState<'markdown' | 'html'>('markdown')
  const [meta, setMeta] = useState<FileMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    const ct = (window as unknown as { __ct?: string }).__ct ?? ''
    fetch(`/api/drive/file?id=${id}`, { headers: ct ? { 'X-Content-Token': ct } : {} })
      .then((r) => {
        if (!r.ok) { setNotFound(true); return null }
        return r.json()
      })
      .then((d) => {
        if (!d) return
        const { content: raw, format: fmt = 'markdown', ...rest } = d
        setContent(raw ?? '')
        setFormat(fmt)
        setMeta(rest as FileMeta)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const title = meta?.name.replace(/\.md$/, '') ?? ''
  const thumbUrl = meta?.appProperties?.coverImageId
    ? `/api/drive/image?id=${meta.appProperties.coverImageId}`
    : undefined

  useSEO({
    title: title || undefined,
    description: meta?.description ?? (title ? `"${title}" — Dương Thanh Biểu.` : undefined),
    image: thumbUrl,
    type: 'article',
  })

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
        <p style={{ color: 'var(--color-charcoal-muted)' }}>Không tìm thấy tin tức.</p>
        <Link to="/tin-tuc" className="inline-block mt-4 text-label" style={{ color: 'var(--color-oxblood)' }}>
          ← Trở về
        </Link>
      </div>
    )
  }

  const html = format === 'html' ? content : (marked.parse(content) as string)

  return (
    <article className="container-main">
      <header className="pt-12 pb-10" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <nav className="flex items-center gap-2 text-label mb-6" style={{ color: 'var(--color-charcoal-muted)' }}>
          <Link to="/" className="hover:text-[var(--color-charcoal)]">Trang chủ</Link>
          <span className="material-symbols-outlined text-[0.8em]">chevron_right</span>
          <Link to="/tin-tuc" className="hover:text-[var(--color-charcoal)]">Tin tức</Link>
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

        {meta.description && (
          <p className="text-body-lg mt-4" style={{ color: 'var(--color-charcoal-muted)' }}>
            {meta.description}
          </p>
        )}

        <div
          className="flex items-center gap-4 mt-6 pt-6 text-label"
          style={{ color: 'var(--color-charcoal-muted)', borderTop: '1px solid var(--color-muted-border)' }}
        >
          <span>Dương Thanh Biểu</span>
          <span>·</span>
          <span>{new Date(meta.modifiedTime).toLocaleDateString('vi-VN')}</span>
        </div>
      </header>

      {meta.appProperties?.coverImageId && (
        <div style={{ maxWidth: '720px', margin: '0 auto 2.5rem', borderRadius: 4, overflow: 'hidden', backgroundColor: 'var(--color-paper-ivory-dark)' }}>
          <img
            src={`/api/drive/image?id=${meta.appProperties.coverImageId}`}
            alt={title}
            style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'cover', objectPosition: 'top' }}
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
          />
        </div>
      )}

      <div style={{ maxWidth: '720px', margin: '0 auto', borderBottom: '1px solid var(--color-muted-border)' }}>
        <div
          className="pb-10 prose-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <ShareButtons
          title={title ? `${title} — Dương Thanh Biểu` : undefined}
          style={{ paddingBottom: 32 }}
        />
      </div>

      <div className="py-10" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Link
          to="/tin-tuc"
          className="inline-flex items-center gap-2 text-label transition-colors hover:text-[var(--color-charcoal)]"
          style={{ color: 'var(--color-charcoal-muted)' }}
        >
          <span className="material-symbols-outlined text-[1em]">arrow_back</span>
          Xem tất cả tin tức
        </Link>
      </div>
    </article>
  )
}
