import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Typography } from 'antd'
import { GoogleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function AdminLoginPage() {
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) navigate('/admin')
      })
      .catch(() => {})
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#faf9f5',
    }}>
      <Card
        style={{
          width: 360,
          borderRadius: 8,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
        styles={{ body: { padding: 40 } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: '#5d2e2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 20,
            margin: '0 auto 16px',
          }}>
            Đ
          </div>
          <Title level={4} style={{ margin: 0, color: '#2d2d2d' }}>
            Dương Thanh Biểu
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Quản trị nội dung
          </Text>
        </div>

        <Button
          type="primary"
          icon={<GoogleOutlined />}
          size="large"
          block
          href="/api/auth/google"
          style={{
            background: '#5d2e2e',
            borderColor: '#5d2e2e',
            height: 44,
            borderRadius: 6,
          }}
        >
          Đăng nhập với Google
        </Button>

        <Text
          type="secondary"
          style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 12 }}
        >
          Chỉ tài khoản được cấp quyền mới có thể đăng nhập.
        </Text>
      </Card>
    </div>
  )
}
