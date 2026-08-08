import { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Typography, Spin } from 'antd'
import { FileTextOutlined, ReadOutlined, PictureOutlined, BookOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface FileItem {
  id: string
  name: string
  modifiedTime: string
  appProperties?: { type?: string }
}

interface Stats {
  vanXuoi: number
  tho: number
  ngheThuat: number
  hinhAnh: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ vanXuoi: 0, tho: 0, ngheThuat: 0, hinhAnh: 0 })
  const [recent, setRecent] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)

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
        setRecent([...files, ...images].sort((a, b) =>
          new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
        ).slice(0, 8))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>

  const cards = [
    { title: 'Văn xuôi & Hồi ký', value: stats.vanXuoi, icon: <FileTextOutlined style={{ color: '#5d2e2e' }} />, color: '#fff0ee' },
    { title: 'Thơ', value: stats.tho, icon: <ReadOutlined style={{ color: '#3a5a8c' }} />, color: '#eef4ff' },
    { title: 'Nghệ thuật & VH', value: stats.ngheThuat, icon: <BookOutlined style={{ color: '#2e6e44' }} />, color: '#eefff4' },
    { title: 'Hình ảnh', value: stats.hinhAnh, icon: <PictureOutlined style={{ color: '#7a5200' }} />, color: '#fff8ee' },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24, color: '#2d2d2d' }}>Tổng quan</Title>

      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col xs={24} sm={12} lg={6} key={c.title}>
            <Card style={{ borderRadius: 8, background: c.color, border: 'none' }}>
              <Statistic
                title={<Text style={{ fontSize: 13 }}>{c.title}</Text>}
                value={c.value}
                prefix={c.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 24, borderRadius: 8 }} title="Cập nhật gần đây">
        {recent.length === 0 ? (
          <Text type="secondary">Chưa có nội dung nào.</Text>
        ) : (
          <div>
            {recent.map((f) => (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <Text>{f.name.replace(/\.[^.]+$/, '')}</Text>
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
