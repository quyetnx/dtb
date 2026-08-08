import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, Col, Row, Typography, Spin, Empty, Button, message, Tooltip, Input } from 'antd'
import { CopyOutlined, PlayCircleOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface VideoItem {
  id: string
  title: string
  description: string
  publishedAt: string
  thumbnail: string
}

interface ApiResponse {
  items: VideoItem[]
  nextPageToken: string | null
  prevPageToken: string | null
  error?: string
}

const PAGE_SIZE = 24

export default function AdminVideoPage() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [nextToken, setNextToken] = useState<string | null>(null)
  const [prevToken, setPrevToken] = useState<string | null>(null)
  const [currentToken, setCurrentToken] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [msg, ctxHolder] = message.useMessage()

  const loadVideos = useCallback((q: string, pageToken: string | null) => {
    setLoading(true)
    setApiError(null)
    const params = new URLSearchParams({ maxResults: String(PAGE_SIZE) })
    if (q) params.set('q', q)
    if (pageToken) params.set('pageToken', pageToken)
    fetch(`/api/youtube/list?${params}`)
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((d) => {
        setVideos(d.items ?? [])
        setNextToken(d.nextPageToken ?? null)
        setPrevToken(d.prevPageToken ?? null)
        if (d.error) setApiError(d.error)
      })
      .catch(() => msg.error('Không thể tải danh sách video'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadVideos(debouncedQuery, currentToken)
  }, [debouncedQuery, currentToken, loadVideos])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setCurrentToken(null)
      setDebouncedQuery(value)
    }, 400)
  }

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

      <div style={{ marginBottom: 16, maxWidth: 360 }}>
        <Input.Search
          placeholder="Tìm kiếm video..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
          onClear={() => handleSearch('')}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : videos.length === 0 ? (
        <Empty description={
          apiError
            ? <span style={{ color: 'red' }}>Lỗi API: {apiError}</span>
            : debouncedQuery
              ? `Không tìm thấy video nào cho "${debouncedQuery}"`
              : 'Chưa có video nào'
        } />
      ) : (
        <>
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
                  <Text
                    ellipsis={{ tooltip: v.title }}
                    style={{ fontSize: 12, fontWeight: 500, display: 'block' }}
                  >
                    {v.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {new Date(v.publishedAt).toLocaleDateString('vi-VN')}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          {(prevToken || nextToken) && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <Button
                icon={<LeftOutlined />}
                disabled={!prevToken}
                onClick={() => setCurrentToken(prevToken)}
              >
                Trang trước
              </Button>
              <Button
                type="primary"
                icon={<RightOutlined />}
                iconPosition="end"
                disabled={!nextToken}
                onClick={() => setCurrentToken(nextToken)}
              >
                Trang sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
