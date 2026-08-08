import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'

interface FileMeta {
  id: string
  name: string
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

const PREVIEW_STANZAS = 3

export default function PoemDetailPage() {
  const { slug: id = '' } = useParams()
  const [content, setContent] = useState('')
  const [meta, setMeta] = useState<FileMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [related, setRelated] = useState<RelatedItem[]>([])

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
        const { content: raw, ...rest } = d
        setContent(raw ?? '')
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
        const candidates = files.filter((f) => f.id !== id && f.appProperties?.type === 'tho')
        setRelated(candidates.slice(0, 3))
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
    description: meta?.description ?? (title ? `Bài thơ "${title}" của Dương Thanh Biểu.` : undefined),
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
        <p style={{ color: 'var(--color-charcoal-muted)' }}>Không tìm thấy bài thơ.</p>
        <Link to="/van-tho" className="inline-block mt-4 text-label" style={{ color: 'var(--color-oxblood)' }}>
          ← Trở về
        </Link>
      </div>
    )
  }

  const stanzas = content.split(/\n{2,}/).filter((s) => s.trim())
  const showReveal = !revealed && stanzas.length > PREVIEW_STANZAS + 1
  const previewStanzas = stanzas.slice(0, PREVIEW_STANZAS)
  const restStanzas = stanzas.slice(PREVIEW_STANZAS)

  const renderStanza = (stanza: string, i: number) => (
    <p key={i} className="poem-content" style={{ color: 'var(--color-charcoal)', whiteSpace: 'pre-line' }}>
      {stanza.trim()}
    </p>
  )

  return (
    <>
      {/* Print-blocked notice */}
      <div className="print-blocked">
        <p style={{ fontSize: '1.2rem' }}>© {new Date().getFullYear()} Dương Thanh Biểu</p>
        <p>Tác phẩm được bảo hộ bản quyền. Nghiêm cấm in ấn, sao chép khi chưa được phép.</p>
      </div>

      <div
        className="container-main section-gap no-print"
        onContextMenu={(e) => e.preventDefault()}
      >
        <nav
          className="flex items-center gap-2 text-label mb-12"
          style={{ color: 'var(--color-charcoal-muted)' }}
        >
          <Link to="/" className="hover:text-[var(--color-charcoal)]">Trang chủ</Link>
          <span className="material-symbols-outlined text-[0.8em]">chevron_right</span>
          <Link to="/van-tho" className="hover:text-[var(--color-charcoal)]">Văn Thơ</Link>
          <span className="material-symbols-outlined text-[0.8em]">chevron_right</span>
          <span style={{ color: 'var(--color-charcoal)' }}>Thơ</span>
        </nav>

        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <p className="text-label mb-4" style={{ color: 'var(--color-oxblood)' }}>Thơ</p>

          <h1 className="text-display-lg" style={{ color: 'var(--color-charcoal)' }}>{title}</h1>

          <div className="flex items-center justify-center gap-4 mt-6 text-label" style={{ color: 'var(--color-charcoal-muted)' }}>
            <span>Dương Thanh Biểu</span>
            <span>·</span>
            <span>{new Date(meta.modifiedTime).toLocaleDateString('vi-VN')}</span>
          </div>

          <div className="divider-ornament my-10" style={{ justifyContent: 'center' }}>
            <span className="text-label px-4" style={{ color: 'var(--color-muted-border)' }}>✦</span>
          </div>

          {/* Poem stanzas */}
          <div className="no-select" style={{ position: 'relative' }}>
            <div className="flex flex-col gap-8">
              {(revealed ? stanzas : previewStanzas).map(renderStanza)}
            </div>

            {/* Blurred rest */}
            {showReveal && restStanzas.length > 0 && (
              <div style={{ position: 'relative', marginTop: 32 }}>
                <div
                  className="flex flex-col gap-8"
                  style={{
                    filter: 'blur(5px)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    maxHeight: 220,
                    overflow: 'hidden',
                  }}
                >
                  {restStanzas.map(renderStanza)}
                </div>

                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, transparent 0%, var(--color-paper-ivory) 65%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: 16,
                }}>
                  <p className="text-label mb-4" style={{ color: 'var(--color-charcoal-muted)' }}>
                    Bài thơ còn tiếp...
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
                    Đọc toàn bài
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Copyright footer */}
          <div className="divider-ornament my-10" style={{ justifyContent: 'center' }}>
            <span className="text-label px-4" style={{ color: 'var(--color-muted-border)' }}>✦</span>
          </div>

          <p className="text-label" style={{ color: 'var(--color-charcoal-muted)', lineHeight: 1.9 }}>
            © {new Date().getFullYear()} <strong style={{ color: 'var(--color-charcoal-light)' }}>Dương Thanh Biểu</strong>.
            Mọi quyền được bảo lưu.<br />
            Nghiêm cấm sao chép, tái bản khi chưa có sự đồng ý của tác giả.
          </p>

          {/* ── Related poems ─────────────────────────── */}
          {related.length > 0 && (
            <div style={{ marginTop: '3rem', textAlign: 'left' }}>
              <p className="text-label mb-4" style={{ color: 'var(--color-charcoal-muted)', textAlign: 'center' }}>Thơ khác</p>
              <div>
                {related.map((item) => (
                  <Link key={item.id} to={`/tho/${item.id}`} className="related-card">
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontStyle: 'italic',
                        fontSize: '1.1rem',
                        color: 'var(--color-charcoal)',
                        margin: 0,
                        textAlign: 'center',
                      }}
                    >
                      {item.name.replace(/\.md$/, '')}
                    </p>
                    <p className="text-label mt-1" style={{ color: 'var(--color-charcoal-muted)', textAlign: 'center' }}>
                      {new Date(item.modifiedTime).toLocaleDateString('vi-VN')}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12">
            <Link
              to="/van-tho"
              className="inline-flex items-center gap-2 text-label transition-colors hover:text-[var(--color-charcoal)]"
              style={{ color: 'var(--color-charcoal-muted)' }}
            >
              <span className="material-symbols-outlined text-[1em]">arrow_back</span>
              Xem tất cả tác phẩm
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
