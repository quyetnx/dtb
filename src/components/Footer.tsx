import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/van-tho', label: 'Văn Thơ' },
  { to: '/nghe-thuat-van-hoa', label: 'Nghệ thuật & Văn hóa' },
]

function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' triệu'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + ' nghìn'
  return n.toLocaleString('vi-VN')
}

export default function Footer() {
  const [views, setViews] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/site/views', { method: 'POST' })
      .then((r) => r.json())
      .then((d: { views: number }) => setViews(d.views))
      .catch(() => {})
  }, [])

  return (
    <footer
      className="border-t"
      style={{
        borderColor: 'var(--color-muted-border)',
        backgroundColor: 'var(--color-paper-ivory)',
      }}
    >
      <div className="container-main py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="text-display-sm block"
              style={{ color: 'var(--color-oxblood)' }}
            >
              Dương Thanh Biểu
            </Link>
            <p className="text-label mt-2" style={{ color: 'var(--color-charcoal-muted)' }}>
              Văn học & Thi ca
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-6">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-label transition-colors hover:text-[var(--color-charcoal)]"
                style={{ color: 'var(--color-charcoal-muted)' }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Contact info */}
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          <a
            href="mailto:duongbieu2013@gmail.com"
            className="text-label transition-colors hover:text-[var(--color-charcoal)]"
            style={{ color: 'var(--color-charcoal-muted)' }}
          >
            duongbieu2013@gmail.com
          </a>
          <a
            href="tel:0943125494"
            className="text-label transition-colors hover:text-[var(--color-charcoal)]"
            style={{ color: 'var(--color-charcoal-muted)' }}
          >
            0943 125 494
          </a>
        </div>

        <div
          className="mt-8 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderColor: 'var(--color-muted-border)' }}
        >
          <p className="text-label" style={{ color: 'var(--color-charcoal-muted)' }}>
            © {new Date().getFullYear()} Dương Thanh Biểu. Bảo lưu mọi quyền.
          </p>
          {views !== null && (
            <p className="text-label" style={{ color: 'var(--color-charcoal-muted)' }}>
              Lượt truy cập: {formatViews(views)}
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}
