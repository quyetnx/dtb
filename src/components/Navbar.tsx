import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/van-tho', label: 'Văn Thơ' },
  { to: '/nghe-thuat-van-hoa', label: 'Nghệ thuật & Văn hóa' },
  { to: '/video', label: 'Video' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  // lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <>
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
          <Link to="/" style={{ lineHeight: 1 }}>
            <span
              className="font-display"
              style={{
                color: 'var(--color-charcoal)',
                fontSize: '1.1rem',
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }}
            >
              Dương Thanh Biểu
            </span>
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

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 -mr-2"
            onClick={() => setDrawerOpen(true)}
            aria-label="Mở menu"
            style={{ color: 'var(--color-charcoal)' }}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      {/* Drawer overlay */}
      <div
        onClick={() => setDrawerOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          zIndex: 199,
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
          backdropFilter: 'blur(1px)',
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 280,
          backgroundColor: 'var(--color-paper-ivory)',
          zIndex: 200,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px -8px rgba(0,0,0,0.15)',
        }}
      >
        {/* Drawer header */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid var(--color-muted-border)',
        }}>
          <span className="font-display" style={{ fontSize: '1rem', color: 'var(--color-charcoal)', fontWeight: 500 }}>
            Dương Thanh Biểu
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Đóng menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-charcoal-muted)',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ padding: '16px 0', flex: 1 }}>
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'block',
                padding: '13px 24px',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.85rem',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: isActive ? 'var(--color-oxblood)' : 'var(--color-charcoal)',
                borderLeft: isActive ? '2px solid var(--color-oxblood)' : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
                textDecoration: 'none',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Drawer footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--color-muted-border)',
        }}>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--color-charcoal-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Nhà văn · Nhà thơ · Hồi ký
          </p>
        </div>
      </div>
    </>
  )
}
