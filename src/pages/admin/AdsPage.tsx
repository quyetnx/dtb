import { useEffect, useRef, useState } from 'react'
import {
  Button, Drawer, Form, Input, Select, Switch, InputNumber,
  Space, Table, Tag, Typography, message, Popconfirm, Spin,
  Upload, Segmented, Empty,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  PictureOutlined, ReloadOutlined,
} from '@ant-design/icons'
import type { TableColumnsType } from 'antd'

const { Title, Text } = Typography

interface Ad {
  id: string
  title: string
  imageId: string
  link: string
  position: string
  size: string
  active: boolean
  order: number
  createdAt: string
}

interface DriveFile {
  id: string
  name: string
  mimeType?: string
  thumbnailLink?: string
  appProperties?: Record<string, string>
}

const POSITIONS = [
  { value: 'home', label: 'Trang chủ' },
  { value: 'article', label: 'Trang bài viết' },
  { value: 'video', label: 'Trang video' },
]

const POSITION_LABELS: Record<string, string> = {
  home: 'Trang chủ',
  article: 'Bài viết',
  video: 'Video',
}

const AD_SIZES = [
  { value: '728x90', label: 'Leaderboard 728×90' },
  { value: '300x250', label: 'Rectangle 300×250' },
  { value: '320x50', label: 'Mobile Banner 320×50' },
  { value: '468x60', label: 'Banner 468×60' },
  { value: '250x250', label: 'Square 250×250' },
  { value: '160x600', label: 'Wide Skyscraper 160×600' },
  { value: 'full', label: 'Toàn chiều rộng' },
]

// ── Image picker ───────────────────────────────────────────────────────────

function ImagePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const [tab, setTab] = useState<string | number>('existing')
  const [images, setImages] = useState<DriveFile[]>([])
  const [loadingImages, setLoadingImages] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, ctxHolder] = message.useMessage()
  const uploadRef = useRef<HTMLInputElement>(null)

  const loadImages = () => {
    setLoadingImages(true)
    fetch('/api/drive/list?admin=1')
      .then((r) => r.json() as Promise<{ files: DriveFile[] }>)
      .then((d) => {
        const imgs = (d.files ?? []).filter(
          (f) => f.mimeType?.startsWith('image/') || f.appProperties?.type === undefined && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name),
        )
        setImages(imgs)
      })
      .catch(() => msg.error('Không thể tải danh sách ảnh'))
      .finally(() => setLoadingImages(false))
  }

  useEffect(() => {
    if (tab === 'existing') loadImages()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', file.name)
      const res = await fetch('/api/drive/upload-image', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const data = await res.json() as { id: string }
      onChange(data.id)
      msg.success('Đã upload ảnh')
      setTab('existing')
    } catch {
      msg.error('Upload thất bại')
    } finally {
      setUploading(false)
      if (uploadRef.current) uploadRef.current.value = ''
    }
  }

  return (
    <div>
      {ctxHolder}

      {/* Preview */}
      {value && (
        <div style={{ marginBottom: 12, position: 'relative', display: 'inline-block' }}>
          <img
            src={`/api/drive/image?id=${value}`}
            alt=""
            style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 6, display: 'block', border: '2px solid #1677ff' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <Tag color="blue" style={{ position: 'absolute', top: 4, left: 4, fontSize: 10 }}>Đã chọn</Tag>
        </div>
      )}

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'existing', label: 'Ảnh có sẵn' },
          { value: 'upload', label: 'Upload mới' },
        ]}
        style={{ marginBottom: 12 }}
      />

      {/* Existing images */}
      {tab === 'existing' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <Button size="small" icon={<ReloadOutlined />} onClick={loadImages} loading={loadingImages}>
              Làm mới
            </Button>
          </div>
          {loadingImages ? (
            <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
          ) : images.length === 0 ? (
            <Empty description="Chưa có ảnh nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
              gap: 8,
              maxHeight: 300,
              overflowY: 'auto',
              padding: '4px 2px',
            }}>
              {images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => onChange(img.id)}
                  title={img.name}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: value === img.id ? '2px solid #1677ff' : '2px solid transparent',
                    position: 'relative',
                    aspectRatio: '1',
                    background: '#f5f5f5',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <img
                    src={img.thumbnailLink
                      ? img.thumbnailLink.replace(/=s\d+$/, '=s200')
                      : `/api/drive/image?id=${img.id}`}
                    alt={img.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = `/api/drive/image?id=${img.id}` }}
                  />
                  {value === img.id && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(22,119,255,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ background: '#1677ff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontSize: 12 }}>✓</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload new */}
      {tab === 'upload' && (
        <div>
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
          />
          <Upload.Dragger
            accept="image/*"
            showUploadList={false}
            beforeUpload={(file) => { handleUpload(file); return false }}
            disabled={uploading}
            style={{ background: '#fafafa' }}
          >
            {uploading ? (
              <div style={{ padding: '16px 0' }}>
                <Spin />
                <p style={{ marginTop: 8, fontSize: 13, color: '#555' }}>Đang upload...</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 28, marginBottom: 8 }}><PictureOutlined style={{ color: '#aaa' }} /></p>
                <p style={{ fontSize: 14, color: '#555' }}>Kéo thả hoặc click để chọn ảnh</p>
                <p style={{ fontSize: 12, color: '#aaa' }}>JPG, PNG, GIF, WebP</p>
              </>
            )}
          </Upload.Dragger>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Ad | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedImageId, setSelectedImageId] = useState('')
  const [form] = Form.useForm()
  const [msg, ctxHolder] = message.useMessage()

  const load = () => {
    setLoading(true)
    fetch('/api/ads')
      .then((r) => r.json() as Promise<{ ads: Ad[] }>)
      .then((d) => setAds(d.ads ?? []))
      .catch(() => msg.error('Không thể tải danh sách quảng cáo'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditing(null)
    setSelectedImageId('')
    form.resetFields()
    form.setFieldsValue({ active: true, order: ads.length + 1, position: 'home', size: '728x90' })
    setDrawerOpen(true)
  }

  const openEdit = (ad: Ad) => {
    setEditing(ad)
    setSelectedImageId(ad.imageId ?? '')
    form.setFieldsValue({ ...ad })
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditing(null)
    setSelectedImageId('')
  }

  const handleSave = async () => {
    let values: Partial<Ad>
    try { values = await form.validateFields() } catch { return }
    if (!selectedImageId) { msg.error('Vui lòng chọn hình ảnh'); return }
    setSaving(true)
    try {
      const payload = { ...values, imageId: selectedImageId }
      if (editing) {
        await fetch(`/api/ads?id=${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        msg.success('Đã cập nhật')
      } else {
        await fetch('/api/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        msg.success('Đã tạo quảng cáo')
      }
      closeDrawer()
      load()
    } catch {
      msg.error('Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/ads?id=${id}`, { method: 'DELETE' })
      msg.success('Đã xóa')
      load()
    } catch {
      msg.error('Xóa thất bại')
    }
  }

  const toggleActive = async (ad: Ad) => {
    try {
      await fetch(`/api/ads?id=${ad.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !ad.active }),
      })
      load()
    } catch {
      msg.error('Cập nhật thất bại')
    }
  }

  const columns: TableColumnsType<Ad> = [
    {
      title: 'Hình ảnh',
      key: 'image',
      width: 80,
      render: (_: unknown, record: Ad) =>
        record.imageId ? (
          <img
            src={`/api/drive/image?id=${record.imageId}`}
            alt=""
            style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 4 }}
          />
        ) : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (t: string, record: Ad) => (
        <button
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#1677ff', textAlign: 'left', fontSize: 13 }}
          onClick={() => openEdit(record)}
        >
          {t}
        </button>
      ),
    },
    {
      title: 'Vị trí',
      key: 'position',
      width: 110,
      render: (_: unknown, record: Ad) => (
        <Tag color="blue">{POSITION_LABELS[record.position] ?? record.position}</Tag>
      ),
    },
    {
      title: 'Kích thước',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (s: string) => <Text type="secondary" style={{ fontSize: 12 }}>{s || '—'}</Text>,
    },
    {
      title: 'Liên kết',
      dataIndex: 'link',
      key: 'link',
      ellipsis: true,
      render: (link: string) => (
        <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>{link}</a>
      ),
    },
    {
      title: 'TT',
      dataIndex: 'order',
      key: 'order',
      width: 50,
      align: 'center' as const,
    },
    {
      title: 'Hiển thị',
      key: 'active',
      width: 85,
      render: (_: unknown, record: Ad) => (
        <Switch
          size="small"
          checked={record.active}
          onChange={() => toggleActive(record)}
          checkedChildren="Bật"
          unCheckedChildren="Tắt"
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 75,
      render: (_: unknown, record: Ad) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Xóa quảng cáo này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      {ctxHolder}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Quảng cáo</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          style={{ background: '#5d2e2e', borderColor: '#5d2e2e' }}
        >
          Thêm quảng cáo
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={[...ads].sort((a, b) => a.order - b.order)}
          pagination={{ pageSize: 20 }}
          size="middle"
          scroll={{ x: 800 }}
          style={{ background: 'white', borderRadius: 8 }}
        />
      )}

      {/* ── Drawer ─────────────────────────────────────────────── */}
      <Drawer
        title={editing ? 'Chỉnh sửa quảng cáo' : 'Thêm quảng cáo mới'}
        placement="right"
        width={520}
        open={drawerOpen}
        onClose={closeDrawer}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={closeDrawer}>Hủy</Button>
            <Button
              type="primary"
              loading={saving}
              onClick={handleSave}
              style={{ background: '#5d2e2e', borderColor: '#5d2e2e' }}
            >
              {editing ? 'Lưu thay đổi' : 'Tạo quảng cáo'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
            <Input placeholder="Tên quảng cáo / banner" />
          </Form.Item>

          <Form.Item name="link" label="Đường dẫn khi click" rules={[{ required: true, message: 'Nhập link' }]}>
            <Input placeholder="https://..." prefix={<span style={{ color: '#aaa', fontSize: 12 }}>🔗</span>} />
          </Form.Item>

          <Form.Item name="position" label="Vị trí hiển thị" rules={[{ required: true }]}>
            <Select options={POSITIONS} />
          </Form.Item>

          <Form.Item name="size" label="Kích thước">
            <Select
              options={AD_SIZES}
              placeholder="Chọn kích thước..."
              allowClear
              showSearch
              filterOption={(input, opt) => (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="order" label="Thứ tự ưu tiên">
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="active" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" style={{ marginTop: 4 }} />
            </Form.Item>
          </div>

          {/* Image picker */}
          <Form.Item
            label={
              <span>
                Hình ảnh{' '}
                {selectedImageId && (
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 400 }}>
                    · ID: {selectedImageId.slice(0, 16)}…
                  </Text>
                )}
              </span>
            }
            required
          >
            <ImagePicker value={selectedImageId} onChange={setSelectedImageId} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  )
}
