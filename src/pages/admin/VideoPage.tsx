import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, Col, Row, Typography, Spin, Empty, Button, message, Tooltip, Input, Tag, Switch } from 'antd'
import { CopyOutlined, PlayCircleOutlined, LeftOutlined, RightOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'

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
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set())
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [msg, ctxHolder] = message.useMessage()

  // Load published IDs
  const loadPublished = useCallback(async () => {
    try {
      const r = await fetch('/api/youtube/published')
      const d = await r.json() as { ids: string[] }
      setPublishedIds(new Set(d.ids ?? []))
    } catch { /* ignore */ }
  }, [])

  const loadVideos = useCallback((q: string, pageToken: string | null) => {
    setLoading(true)
    setApiError(null)
    const params = new URLSearchParams({ maxResults: String(PAGE_SIZE), admin: '1' })
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
    loadPublished()
  }, [loadPublished])

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

  const togglePublished = async (id: string, published: boolean) => {
    setTogglingId(id)
    try {
      const r = await fetch('/api/youtube/published', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, published }),
      })
      const d = await r.json() as { ok: boolean; ids: string[] }
      if (d.ok) {
        setPublishedIds(new Set(d.ids))
        msg.success(published ? 'Đã công khai video' : 'Đã ẩn video')
      }
    } catch {
      msg.error('Không thể cập nhật trạng thái')
    } finally {
      setTogglingId(null)
    }
  }

  const copyEmbed = (id: string) => {
    navigator.clipboard.writeText(`[youtube:${id}]`)
    msg.success('Đã copy mã nhúng — dán vào nội dung bài viết')
  }

  const publishedCount = videos.filter((v) => publishedIds.has(v.id)).length

  return (
    <div>
      {ctxHolder}
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Video YouTube</Title>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Bật công khai để hiển thị video trên trang web · Dùng <code>[youtube:videoId]</code> để nhúng vào bài viết
        </Text>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm kiếm video..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
          onClear={() => handleSearch('')}
          style={{ maxWidth: 360 }}
        />
        {!loading && videos.length > 0 && (
          <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
            {publishedCount}/{videos.length} đang công khai
          </Text>
        )}
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
            {videos.map((v) => {
              const isPublished = publishedIds.has(v.id)
              const isToggling = togglingId === v.id
              return (
                <Col key={v.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    size="small"
                    styles={{ body: { padding: '8px 12px' } }}
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
                        {/* Published badge */}
                        <div style={{ position: 'absolute', top: 6, right: 6 }}>
                          <Tag
                            color={isPublished ? 'green' : 'default'}
                            style={{ margin: 0, fontSize: 11, lineHeight: '18px', padding: '0 6px' }}
                          >
                            {isPublished ? 'Công khai' : 'Ẩn'}
                          </Tag>
                        </div>
                      </div>
                    }
                  >
                    <Text
                      ellipsis={{ tooltip: v.title }}
                      style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}
                    >
                      {v.title}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(v.publishedAt).toLocaleDateString('vi-VN')}
                    </Text>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                      <Tooltip title={isPublished ? 'Ẩn khỏi trang web' : 'Công khai trên trang web'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isPublished
                            ? <EyeOutlined style={{ fontSize: 13, color: '#52c41a' }} />
                            : <EyeInvisibleOutlined style={{ fontSize: 13, color: '#999' }} />
                          }
                          <Switch
                            size="small"
                            checked={isPublished}
                            loading={isToggling}
                            onChange={(checked) => togglePublished(v.id, checked)}
                          />
                        </div>
                      </Tooltip>
                      <Tooltip title="Copy mã nhúng [youtube:id]">
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => copyEmbed(v.id)}
                          style={{ fontSize: 11 }}
                        >
                          Copy mã
                        </Button>
                      </Tooltip>
                    </div>
                  </Card>
                </Col>
              )
            })}
          </Row>

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
