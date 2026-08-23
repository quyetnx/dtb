import { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Typography, Spin, Switch, message } from 'antd'
import {
  FileTextOutlined, ReadOutlined, PictureOutlined, BookOutlined, GlobalOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

interface FileItem {
  id: string
  name: string
  modifiedTime: string
  appProperties?: { type?: string }
}

interface Stats { vanXuoi: number; tho: number; ngheThuat: number; hinhAnh: number }


export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ vanXuoi: 0, tho: 0, ngheThuat: 0, hinhAnh: 0 })
  const [recent, setRecent] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sitePublic, setSitePublic] = useState(false)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    fetch('/api/site/status').then((r) => r.json()).then((d: { public: boolean }) => setSitePublic(d.public))
  }, [])

  const togglePublic = async (val: boolean) => {
    setToggling(true)
    try {
      await fetch('/api/site/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public: val }),
      })
      setSitePublic(val)
      message.success(val ? 'Website đã mở public' : 'Website đã chuyển sang chế độ sắp ra mắt')
    } catch {
      message.error('Không thể cập nhật trạng thái')
    } finally {
      setToggling(false)
    }
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/drive/list').then((r) => r.json()),
      fetch('/api/drive/list?type=image').then((r) => r.json()),
    ])
      .then(([textFiles, imageFiles]) => {
        const files: FileItem[] = textFiles.files ?? []
        const images: FileItem[] = imageFiles.files ?? []
        setStats({
          vanXuoi: files.filter((f) => f.appProperties?.type === 'van-xuoi').length,
          tho: files.filter((f) => f.appProperties?.type === 'tho').length,
          ngheThuat: files.filter((f) => f.appProperties?.type === 'nghe-thuat').length,
          hinhAnh: images.length,
        })
        setRecent(
          [...files, ...images]
            .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
            .slice(0, 8),
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>

  const cards = [
    { title: 'Văn xuôi & Truyện ký', value: stats.vanXuoi, icon: <FileTextOutlined style={{ color: '#5d2e2e' }} />, color: '#fff0ee' },
    { title: 'Thơ', value: stats.tho, icon: <ReadOutlined style={{ color: '#3a5a8c' }} />, color: '#eef4ff' },
    { title: 'Nghệ thuật & VH', value: stats.ngheThuat, icon: <BookOutlined style={{ color: '#2e6e44' }} />, color: '#eefff4' },
    { title: 'Hình ảnh', value: stats.hinhAnh, icon: <PictureOutlined style={{ color: '#7a5200' }} />, color: '#fff8ee' },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: '#2d2d2d' }}>Tổng quan</Title>

      {/* Site public toggle */}
      <Card
        style={{
          marginBottom: 16, borderRadius: 8,
          background: sitePublic ? '#f0fff4' : '#fff8ee',
          border: `1px solid ${sitePublic ? '#b7eb8f' : '#ffd591'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <GlobalOutlined style={{ fontSize: 20, color: sitePublic ? '#52c41a' : '#fa8c16' }} />
          <div style={{ flex: 1 }}>
            <Text strong>Chế độ website</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {sitePublic ? 'Public — khách truy cập thấy nội dung' : 'Sắp ra mắt — khách thấy trang chờ'}
            </Text>
          </div>
          <Switch
            checked={sitePublic}
            loading={toggling}
            onChange={togglePublic}
            checkedChildren="Public"
            unCheckedChildren="Sắp ra mắt"
          />
        </div>
      </Card>

      {/* Stats */}
      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col xs={12} sm={12} lg={6} key={c.title}>
            <Card style={{ borderRadius: 8, background: c.color, border: 'none' }}>
              <Statistic
                title={<Text style={{ fontSize: 12 }}>{c.title}</Text>}
                value={c.value}
                prefix={c.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Recent */}
      <Card style={{ marginTop: 16, borderRadius: 8 }} title="Cập nhật gần đây">
        {recent.length === 0 ? (
          <Text type="secondary">Chưa có nội dung nào.</Text>
        ) : (
          <div>
            {recent.map((f) => (
              <div
                key={f.id}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}
              >
                <Text style={{ fontSize: 13 }}>{f.name.replace(/\.[^.]+$/, '')}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(f.modifiedTime).toLocaleDateString('vi-VN')}
                </Text>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
