import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { marked, type TokenizerAndRendererExtension } from 'marked'

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
  modifiedTime: string
  appProperties?: { type?: string; category?: string }
}

const PREVIEW_RATIO = 0.3
const MIN_PREVIEW_PARAGRAPHS = 3

export default function ArticleDetailPage() {
  const { slug: id = '' } = useParams()
  const [content, setContent] = useState('')
  const [meta, setMeta] = useState<FileMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [revealed, setRevealed] = useState(false)

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

  // Copy protection: append copyright notice to copied text
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

  // Split content: first 30% visible, rest blurred
  const paragraphs = content.split(/\n{2,}/).filter((s) => s.trim())
  const previewCount = Math.max(MIN_PREVIEW_PARAGRAPHS, Math.ceil(paragraphs.length * PREVIEW_RATIO))
  const hasRest = paragraphs.length > previewCount + 1

  const previewHtml = marked.parse(paragraphs.slice(0, previewCount).join('\n\n')) as string
  const restHtml = marked.parse(paragraphs.slice(previewCount).join('\n\n')) as string
  const fullHtml = marked.parse(content) as string

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
          {revealed || !hasRest ? (
            /* Full content */
            <div
              className="pb-16 prose-content no-select"
              dangerouslySetInnerHTML={{ __html: fullHtml }}
            />
          ) : (
            /* Preview + blurred rest */
            <div className="pb-8">
              {/* Visible preview */}
              <div
                className="prose-content no-select"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />

              {/* Blurred rest */}
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

                {/* Gradient fade + CTA */}
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
