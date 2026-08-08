import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/van-tho', label: 'Văn Thơ' },
  { to: '/nghe-thuat-van-hoa', label: 'Nghệ thuật & Văn hóa' },
  { to: '/video', label: 'Video' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="sticky top-0 z-50 transition-shadow duration-200"
      style={{
        backgroundColor: 'var(--color-paper-ivory)',
        borderBottom: '1px solid var(--color-muted-border)',
        boxShadow: scrolled ? '0 2px 16px -4px rgba(45,45,45,0.1)' : 'none',
      }}
    >
      <div className="container-main h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-display-sm"
          style={{ color: 'var(--color-oxblood)', lineHeight: 1 }}
        >
          DTB
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'text-label transition-colors duration-150',
                  isActive
                    ? 'text-[var(--color-oxblood)]'
                    : 'text-[var(--color-charcoal-muted)] hover:text-[var(--color-charcoal)]',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
          style={{ color: 'var(--color-charcoal)' }}
        >
          <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{
            backgroundColor: 'var(--color-paper-ivory)',
            borderColor: 'var(--color-muted-border)',
          }}
        >
          <nav className="container-main py-4 flex flex-col gap-4">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  [
                    'text-label py-1 transition-colors',
                    isActive
                      ? 'text-[var(--color-oxblood)]'
                      : 'text-[var(--color-charcoal-muted)]',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
