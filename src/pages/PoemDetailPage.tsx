import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

interface FileMeta {
  id: string
  name: string
  modifiedTime: string
  appProperties?: { type?: string; category?: string }
}

export default function PoemDetailPage() {
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
        <p style={{ color: 'var(--color-charcoal-muted)' }}>Không tìm thấy bài thơ.</p>
        <Link to="/van-tho" className="inline-block mt-4 text-label" style={{ color: 'var(--color-oxblood)' }}>
          ← Trở về
        </Link>
      </div>
    )
  }

  const title = meta.name.replace(/\.md$/, '')
  const stanzas = content.split(/\n{2,}/).filter((s) => s.trim())

  return (
    <div className="container-main section-gap">
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

        <div className="flex flex-col gap-8">
          {stanzas.map((stanza, i) => (
            <p key={i} className="poem-content" style={{ color: 'var(--color-charcoal)', whiteSpace: 'pre-line' }}>
              {stanza.trim()}
            </p>
          ))}
        </div>

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
  )
}
