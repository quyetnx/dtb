import { useState } from 'react'

interface Props {
  url?: string
  title?: string
  style?: React.CSSProperties
  className?: string
}

export default function ShareButtons({ url, title, style, className }: Props) {
  const [copied, setCopied] = useState(false)

  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '')
  const shareTitle = title ?? (typeof document !== 'undefined' ? document.title : '')

  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const twHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`
  const tgHref = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select a temp input
      const inp = document.createElement('input')
      inp.value = shareUrl
      document.body.appendChild(inp)
      inp.select()
      document.execCommand('copy')
      document.body.removeChild(inp)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 2,
    border: '1px solid var(--color-muted-border)',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.75rem',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'opacity 0.15s, background 0.15s',
    background: 'transparent',
    color: 'var(--color-charcoal)',
    whiteSpace: 'nowrap',
  }

  return (
    <div
      className={className}
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, ...style }}
    >
      <span
        className="text-label"
        style={{ color: 'var(--color-charcoal-muted)', marginRight: 4, flexShrink: 0 }}
      >
        Chia sẻ:
      </span>

      {/* Facebook */}
      <a
        href={fbHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...btnBase, borderColor: '#1877f2', color: '#1877f2' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(24,119,242,0.07)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        aria-label="Chia sẻ lên Facebook"
      >
        {/* Facebook icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
        </svg>
        Facebook
      </a>

      {/* X / Twitter */}
      <a
        href={twHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...btnBase, borderColor: '#000', color: '#000' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        aria-label="Chia sẻ lên X"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        X
      </a>

      {/* Telegram */}
      <a
        href={tgHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...btnBase, borderColor: '#229ed9', color: '#229ed9' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(34,158,217,0.07)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        aria-label="Chia sẻ lên Telegram"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        Telegram
      </a>

      {/* Copy link */}
      <button
        onClick={copyLink}
        style={{
          ...btnBase,
          borderColor: copied ? '#52c41a' : 'var(--color-muted-border)',
          color: copied ? '#52c41a' : 'var(--color-charcoal-muted)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        aria-label="Sao chép liên kết"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          {copied ? 'check' : 'link'}
        </span>
        {copied ? 'Đã sao chép' : 'Sao chép link'}
      </button>
    </div>
  )
}
