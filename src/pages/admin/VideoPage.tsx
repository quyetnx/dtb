import { useEffect, useState } from 'react'
import { Card, Col, Row, Typography, Spin, Empty, Button, message, Tooltip } from 'antd'
import { CopyOutlined, PlayCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface VideoItem {
  id: string
  title: string
  description: string
  publishedAt: string
  thumbnail: string
}

export default function AdminVideoPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, ctxHolder] = message.useMessage()

  useEffect(() => {
    fetch('/api/youtube/list?maxResults=24')
      .then((r) => r.json())
      .then((d) => setVideos(d.items ?? []))
      .catch(() => msg.error('Không thể tải danh sách video'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const copyEmbed = (id: string) => {
    navigator.clipboard.writeText(`[youtube:${id}]`)
    msg.success('Đã copy mã nhúng — dán vào nội dung bài viết')
  }

  return (
    <div>
      {ctxHolder}
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Video YouTube</Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Dùng <code>[youtube:videoId]</code> để nhúng video vào nội dung bài viết
        </Text>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : videos.length === 0 ? (
        <Empty description="Chưa có video nào (kiểm tra YOUTUBE_API_KEY và YOUTUBE_CHANNEL_ID)" />
      ) : (
        <Row gutter={[16, 16]}>
          {videos.map((v) => (
            <Col key={v.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                size="small"
                cover={
                  <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#111' }}>
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <a
                      href={`https://www.youtube.com/watch?v=${v.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      <PlayCircleOutlined style={{ fontSize: 36, opacity: 0.85 }} />
                    </a>
                  </div>
                }
                actions={[
                  <Tooltip key="copy" title="Copy mã nhúng [youtube:id] để dán vào bài viết">
                    <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copyEmbed(v.id)}>
                      Copy mã nhúng
                    </Button>
                  </Tooltip>,
                ]}
                styles={{ body: { padding: '8px 12px' } }}
              >
                <Text ellipsis={{ tooltip: v.title }} style={{ fontSize: 12, fontWeight: 500 }}>
                  {v.title}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {new Date(v.publishedAt).toLocaleDateString('vi-VN')}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}
