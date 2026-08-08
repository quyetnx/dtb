import { Link } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/van-tho', label: 'Văn Thơ' },
  { to: '/nghe-thuat-van-hoa', label: 'Nghệ thuật & Văn hóa' },
]

export default function Footer() {
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

        <div
          className="mt-10 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderColor: 'var(--color-muted-border)' }}
        >
          <p className="text-label" style={{ color: 'var(--color-charcoal-muted)' }}>
            © {new Date().getFullYear()} Dương Thanh Biểu. Bảo lưu mọi quyền.
          </p>
          <p className="text-label" style={{ color: 'var(--color-charcoal-muted)' }}>
            Thiết kế với tình yêu văn học
          </p>
        </div>
      </div>
    </footer>
  )
}
