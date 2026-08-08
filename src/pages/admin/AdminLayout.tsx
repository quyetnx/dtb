import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Typography, Spin } from 'antd'
import {
  FileTextOutlined,
  PictureOutlined,
  ReadOutlined,
  BookOutlined,
  LogoutOutlined,
  DashboardOutlined,
  MenuOutlined,
  PlayCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons'

const { Sider, Content } = Layout
const { Text } = Typography

const SIDEBAR_W = 220

interface User {
  email: string
  name: string
  picture: string
}

export default function AdminLayout() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)   // mobile overlay
  const [desktop, setDesktop] = useState(() => window.innerWidth >= 768)
  const location = useLocation()
  const navigate = useNavigate()

  // track viewport
  useEffect(() => {
    const onResize = () => setDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // close overlay on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) navigate('/admin/login')
        else setUser(data.user)
      })
      .catch(() => navigate('/admin/login'))
      .finally(() => setLoading(false))
  }, [navigate])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    navigate('/admin/login')
  }

  const menuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: <Link to="/admin">Tổng quan</Link> },
    { key: '/admin/van-xuoi', icon: <FileTextOutlined />, label: <Link to="/admin/van-xuoi">Văn xuôi</Link> },
    { key: '/admin/tho', icon: <ReadOutlined />, label: <Link to="/admin/tho">Thơ</Link> },
    { key: '/admin/nghe-thuat', icon: <BookOutlined />, label: <Link to="/admin/nghe-thuat">Nghệ thuật</Link> },
    { key: '/admin/hinh-anh', icon: <PictureOutlined />, label: <Link to="/admin/hinh-anh">Hình ảnh</Link> },
    { key: '/admin/video', icon: <PlayCircleOutlined />, label: <Link to="/admin/video">Video</Link> },
  ]

  const selectedKey = [...menuItems].reverse()
    .find((item) => location.pathname === item.key || location.pathname.startsWith(item.key + '/'))
    ?.key ?? '/admin'

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  const siderContent = (
    <>
      {/* Logo / brand */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 6, background: '#7c3535',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0,
          }}>Đ</div>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 600 }}>
            DTB Admin
          </Text>
        </div>
        {!desktop && (
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}
          >
            <CloseOutlined />
          </button>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        style={{ background: 'transparent', border: 'none', marginTop: 8 }}
      />

      {/* User section at bottom */}
      {user && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: '#111',
        }}>
          <Dropdown
            menu={{
              items: [
                { key: 'email', label: <Text type="secondary" style={{ fontSize: 12 }}>{user.email}</Text>, disabled: true },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout },
              ],
            }}
            placement="topLeft"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar src={user.picture} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, display: 'block' }} ellipsis>
                  {user.name}
                </Text>
              </div>
            </div>
          </Dropdown>
        </div>
      )}
    </>
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      {desktop && (
        <Sider
          width={SIDEBAR_W}
          style={{ background: '#161616', position: 'relative', paddingBottom: 60 }}
        >
          {siderContent}
        </Sider>
      )}

      {/* Mobile overlay backdrop */}
      {!desktop && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199,
          }}
        />
      )}

      {/* Mobile sidebar drawer */}
      {!desktop && (
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: SIDEBAR_W,
          background: '#161616',
          zIndex: 200,
          transform: open ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`,
          transition: 'transform 0.25s ease',
          paddingBottom: 60,
        }}>
          {siderContent}
        </div>
      )}

      <Layout style={{ minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{
          height: 52,
          background: 'white',
          borderBottom: '1px solid #ebebeb',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <button
            onClick={() => setOpen(!open)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 8px', borderRadius: 4, color: '#555', fontSize: 18,
              display: desktop ? 'none' : 'flex', alignItems: 'center',
            }}
          >
            <MenuOutlined />
          </button>
          <div style={{ flex: 1 }} />
          {user && (
            <Dropdown
              menu={{
                items: [
                  { key: 'email', label: <Text type="secondary" style={{ fontSize: 12 }}>{user.email}</Text>, disabled: true },
                  { type: 'divider' },
                  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: handleLogout },
                ],
              }}
              placement="bottomRight"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar src={user.picture} size={28} />
                {desktop && <Text style={{ fontSize: 13 }}>{user.name}</Text>}
              </div>
            </Dropdown>
          )}
        </div>

        <Content style={{ padding: desktop ? 24 : 16, background: '#f4f4f4', minHeight: 'calc(100vh - 52px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
