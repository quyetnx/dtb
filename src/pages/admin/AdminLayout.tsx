import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Typography, Spin, Button } from 'antd'
import {
  FileTextOutlined,
  PictureOutlined,
  ReadOutlined,
  BookOutlined,
  LogoutOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'

const { Sider, Header, Content } = Layout
const { Text } = Typography

interface User {
  email: string
  name: string
  picture: string
}

export default function AdminLayout() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) {
          navigate('/admin/login')
        } else {
          setUser(data.user)
        }
      })
      .catch(() => navigate('/admin/login'))
      .finally(() => setLoading(false))
  }, [navigate])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    navigate('/admin/login')
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  const menuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: <Link to="/admin">Tổng quan</Link> },
    { key: '/admin/van-xuoi', icon: <FileTextOutlined />, label: <Link to="/admin/van-xuoi">Văn xuôi & Hồi ký</Link> },
    { key: '/admin/tho', icon: <ReadOutlined />, label: <Link to="/admin/tho">Thơ</Link> },
    { key: '/admin/nghe-thuat', icon: <BookOutlined />, label: <Link to="/admin/nghe-thuat">Nghệ thuật & VH</Link> },
    { key: '/admin/hinh-anh', icon: <PictureOutlined />, label: <Link to="/admin/hinh-anh">Hình ảnh</Link> },
  ]

  const selectedKey = menuItems
    .slice()
    .reverse()
    .find((item) => location.pathname.startsWith(item.key))?.key ?? '/admin'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={{ background: '#1a1a1a' }}
      >
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 4,
            background: '#5d2e2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: 14,
            flexShrink: 0,
          }}>
            Đ
          </div>
          {!collapsed && (
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}>
              DTB Admin
            </Text>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ background: '#1a1a1a', border: 'none', marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: 'white',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          {user && (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'email',
                    label: <Text type="secondary" style={{ fontSize: 12 }}>{user.email}</Text>,
                    disabled: true,
                  },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: 'Đăng xuất',
                    onClick: handleLogout,
                  },
                ],
              }}
              placement="bottomRight"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar src={user.picture} size="small" />
                <Text style={{ fontSize: 13 }}>{user.name}</Text>
              </div>
            </Dropdown>
          )}
        </Header>

        <Content style={{ padding: 24, background: '#f5f5f5', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
