import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { marked, type TokenizerAndRendererExtension } from 'marked'
import { useSEO } from '../hooks/useSEO'

// Custom extension: [youtube:videoId] → embedded iframe
const youtubeExtension: TokenizerAndRendererExtension = {
  name: 'youtube',
  level: 'block',
  start: (src: string) => src.indexOf('[youtube:'),
  tokenizer(src: string) {
    const match = src.match(/^\[youtube:([A-Za-z0-9_-]{11})\]/)
    if (match) return { type: 'youtube', raw: match[0], videoId: match[1] }
  },
  renderer(token) {
    return `<div class="youtube-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:2px;margin:2rem 0">
      <iframe src="https://www.youtube.com/embed/${token.videoId}"
        style="position:absolute;top:0;left:0;width:100%;height:100%;border:none"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
    </div>`
  },
}

marked.use({ extensions: [youtubeExtension] })

interface FileMeta {
  id: string
  name: string
  mimeType?: string
  modifiedTime: string
  appProperties?: { type?: string; category?: string }
  thumbnailLink?: string
  description?: string
}

interface RelatedItem {
  id: string
  name: string
  modifiedTime: string
  appProperties?: { type?: string; category?: string }
}

const PREVIEW_RATIO = 0.3
const MIN_PREVIEW_PARAGRAPHS = 3

export default function ArticleDetailPage() {
  const { slug: id = '' } = useParams()
  const [content, setContent] = useState('')
  const [format, setFormat] = useState<'markdown' | 'html'>('markdown')
  const [meta, setMeta] = useState<FileMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [related, setRelated] = useState<RelatedItem[]>([])

  useEffect(() => {
    if (!id) return
    fetch(`/api/drive/file?id=${id}`)
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

  // Fetch related content
  useEffect(() => {
    if (!meta) return
    fetch('/api/drive/list')
      .then((r) => r.json())
      .then((d) => {
        const files: RelatedItem[] = d.files ?? []
        const currentType = meta.appProperties?.type
        const currentCat = meta.appProperties?.category
        const candidates = files.filter((f) => {
          if (f.id === id) return false
          const t = f.appProperties?.type
          return t === 'van-xuoi' || t === 'nghe-thuat'
        })
        // Prefer same category
        const sameCat = candidates.filter((f) => currentCat && f.appProperties?.category === currentCat)
        const pool = sameCat.length >= 3 ? sameCat : [...sameCat, ...candidates.filter((f) => !sameCat.includes(f))]
        void currentType
        setRelated(pool.slice(0, 3))
      })
      .catch(() => {})
  }, [meta, id])

  // Copy protection
  useEffect(() => {
    if (!meta) return
    const title = meta.name.replace(/\.md$/, '')
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection()?.toString()
      if (!selection || selection.length < 10) return
      const notice = `\n\n— Trích từ: "${title}" — Dương Thanh Biểu\n© ${new Date().getFullYear()} Dương Thanh Biểu. Mọi quyền được bảo lưu.`
      e.clipboardData?.setData('text/plain', selection + notice)
      e.preventDefault()
    }
    document.addEventListener('copy', handleCopy)
    return () => document.removeEventListener('copy', handleCopy)
  }, [meta])

  const title = meta?.name.replace(/\.md$/, '') ?? ''
  const thumbUrl = meta?.thumbnailLink ? `/api/drive/thumb?id=${id}` : undefined

  useSEO({
    title: title || undefined,
    description: meta?.description ?? (title ? `Tác phẩm "${title}" của Dương Thanh Biểu.` : undefined),
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
        <p style={{ color: 'var(--color-charcoal-muted)' }}>Không tìm thấy tác phẩm.</p>
        <Link to="/van-tho" className="inline-block mt-4 text-label" style={{ color: 'var(--color-oxblood)' }}>
          ← Trở về
        </Link>
      </div>
    )
  }

  // Content rendering: HTML (from Google Docs) or Markdown
  let previewHtml = ''
  let restHtml = ''
  let fullHtml = ''
  let hasRest = false

  if (format === 'html') {
    fullHtml = content
    const blocks = Array.from(new DOMParser().parseFromString(content, 'text/html').body.children)
    const previewCount = Math.max(MIN_PREVIEW_PARAGRAPHS, Math.ceil(blocks.length * PREVIEW_RATIO))
    hasRest = blocks.length > previewCount + 1
    const toHtml = (els: Element[]) => els.map((el) => el.outerHTML).join('')
    previewHtml = toHtml(blocks.slice(0, previewCount))
    restHtml = toHtml(blocks.slice(previewCount))
  } else {
    const paragraphs = content.split(/\n{2,}/).filter((s) => s.trim())
    const previewCount = Math.max(MIN_PREVIEW_PARAGRAPHS, Math.ceil(paragraphs.length * PREVIEW_RATIO))
    hasRest = paragraphs.length > previewCount + 1
    previewHtml = marked.parse(paragraphs.slice(0, previewCount).join('\n\n')) as string
    restHtml = marked.parse(paragraphs.slice(previewCount).join('\n\n')) as string
    fullHtml = marked.parse(content) as string
  }

  return (
    <>
      {/* Print-blocked notice */}
      <div className="print-blocked">
        <p style={{ fontSize: '1.2rem' }}>© {new Date().getFullYear()} Dương Thanh Biểu</p>
        <p>Tác phẩm được bảo hộ bản quyền. Nghiêm cấm in ấn, sao chép khi chưa được phép.</p>
      </div>

      <article className="container-main no-print">
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

        {/* Content with protection */}
        <div
          style={{ maxWidth: '720px', margin: '0 auto', borderBottom: '1px solid var(--color-muted-border)' }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {format === 'html' || revealed || !hasRest ? (
            /* Full content */
            <div
              className="pb-16 prose-content no-select"
              dangerouslySetInnerHTML={{ __html: fullHtml }}
            />
          ) : (
            /* Preview + blurred rest */
            <div className="pb-8">
              <div
                className="prose-content no-select"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />

              <div style={{ position: 'relative' }}>
                <div
                  className="prose-content no-select"
                  style={{
                    filter: 'blur(5px)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    maxHeight: 320,
                    overflow: 'hidden',
                  }}
                  dangerouslySetInnerHTML={{ __html: restHtml }}
                />

                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, transparent 0%, var(--color-paper-ivory) 70%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: 24,
                }}>
                  <p className="text-label mb-4" style={{ color: 'var(--color-charcoal-muted)', textAlign: 'center' }}>
                    Tác phẩm còn tiếp theo...
                  </p>
                  <button
                    onClick={() => setRevealed(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 28px',
                      backgroundColor: 'var(--color-oxblood)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 2,
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>menu_book</span>
                    Tiếp tục đọc
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Copyright footer */}
          <div
            style={{
              margin: '0 0 32px',
              padding: '16px 20px',
              borderLeft: '3px solid var(--color-muted-border)',
              backgroundColor: 'var(--color-paper-ivory-dark)',
              borderRadius: '0 4px 4px 0',
            }}
          >
            <p className="text-label" style={{ color: 'var(--color-charcoal-muted)', lineHeight: 1.8 }}>
              © {new Date().getFullYear()} <strong style={{ color: 'var(--color-charcoal)' }}>Dương Thanh Biểu</strong>.
              Mọi quyền được bảo lưu. Nghiêm cấm sao chép, tái bản, truyền bá dưới mọi hình thức
              khi chưa có sự đồng ý bằng văn bản của tác giả.
            </p>
          </div>
        </div>

        {/* ── Related content ─────────────────────────────── */}
        {related.length > 0 && (
          <div style={{ maxWidth: '720px', margin: '0 auto', paddingTop: '3rem', paddingBottom: '1rem' }}>
            <p className="text-label mb-6" style={{ color: 'var(--color-charcoal-muted)' }}>Có thể bạn cũng thích</p>
            <div>
              {related.map((item) => {
                const itemType = item.appProperties?.type
                const href = itemType === 'tho' ? `/tho/${item.id}` : `/van-tho/${item.id}`
                return (
                  <Link key={item.id} to={href} className="related-card">
                    {item.appProperties?.category && (
                      <p className="text-label mb-1" style={{ color: 'var(--color-oxblood)' }}>
                        {item.appProperties.category}
                      </p>
                    )}
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.15rem',
                        color: 'var(--color-charcoal)',
                        margin: 0,
                      }}
                    >
                      {item.name.replace(/\.md$/, '')}
                    </p>
                    <p className="text-label mt-1" style={{ color: 'var(--color-charcoal-muted)' }}>
                      {new Date(item.modifiedTime).toLocaleDateString('vi-VN')}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

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
