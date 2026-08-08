import { useEffect, useRef, useState } from 'react'
import {
  Button, Table, Typography, Space, Tag, Modal, Form,
  Input, message, Popconfirm, Spin, Switch, Tooltip,
  DatePicker, Upload,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined,
  UploadOutlined, FileWordOutlined, PictureOutlined,
} from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input

interface FileItem {
  id: string
  name: string
  modifiedTime: string
  appProperties?: {
    type?: string
    category?: string
    status?: 'published' | 'draft'
    coverImageId?: string
    publishDate?: string
  }
}

interface ContentListPageProps {
  title: string
  contentType: string
  categoryOptions?: string[]
}

interface FormValues {
  name: string
  content: string
  category?: string
  status: boolean
  publishDate?: dayjs.Dayjs
}

export default function ContentListPage({ title, contentType, categoryOptions }: ContentListPageProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FileItem | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [coverImageId, setCoverImageId] = useState<string | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [docxImporting, setDocxImporting] = useState(false)
  const docxInputRef = useRef<HTMLInputElement>(null)
  const [form] = Form.useForm<FormValues>()
  const [msg, ctxHolder] = message.useMessage()

  const load = () => {
    setLoading(true)
    fetch('/api/drive/list?admin=1')
      .then((r) => r.json())
      .then((data) => {
        const all: FileItem[] = data.files ?? []
        setFiles(all.filter((f) => f.appProperties?.type === contentType))
      })
      .catch(() => msg.error('Không thể tải danh sách'))
      .finally(() => setLoading(false))
  }

  const toggleStatus = async (file: FileItem) => {
    const next = file.appProperties?.status === 'published' ? 'draft' : 'published'
    await fetch(`/api/drive/file?id=${file.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appProperties: { ...file.appProperties, status: next } }),
    })
    msg.success(next === 'published' ? 'Đã công bố' : 'Đã đặt nháp')
    load()
  }

  useEffect(() => { load() }, [contentType]) // eslint-disable-line react-hooks/exhaustive-deps

  const openNew = () => {
    setEditing(null)
    setEditContent('')
    setCoverImageId(null)
    form.resetFields()
    form.setFieldsValue({ status: false })
    setModalOpen(true)
  }

  const openEdit = async (file: FileItem) => {
    setEditing(file)
    setCoverImageId(file.appProperties?.coverImageId ?? null)
    form.setFieldsValue({
      name: file.name.replace(/\.md$/, ''),
      category: file.appProperties?.category ?? '',
      status: file.appProperties?.status === 'published',
      publishDate: file.appProperties?.publishDate ? dayjs(file.appProperties.publishDate) : undefined,
    })
    const res = await fetch(`/api/drive/file?id=${file.id}`)
    const data = await res.json()
    setEditContent(data.content ?? '')
    setModalOpen(true)
  }

  const handleCoverUpload = async (file: File) => {
    setCoverUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', file.name)
      const res = await fetch('/api/drive/upload-image', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json() as { id: string }
      setCoverImageId(data.id)
      msg.success('Đã tải ảnh đại diện')
    } catch {
      msg.error('Không thể tải ảnh, thử lại')
    } finally {
      setCoverUploading(false)
    }
  }

  const handleDocxImport = async (file: File) => {
    setDocxImporting(true)
    try {
      const mammoth = await import('mammoth')
      const buffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer: buffer })
      setEditContent(result.value.trim())
      msg.success('Đã nhập nội dung từ DOCX')
    } catch {
      msg.error('Không thể đọc file DOCX')
    } finally {
      setDocxImporting(false)
      if (docxInputRef.current) docxInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    let values: FormValues
    try { values = await form.validateFields() } catch { return }
    setSaving(true)

    const appProperties: Record<string, string> = {
      type: contentType,
      status: values.status ? 'published' : 'draft',
    }
    if (values.category) appProperties.category = values.category
    if (coverImageId) appProperties.coverImageId = coverImageId
    if (values.publishDate) appProperties.publishDate = values.publishDate.toISOString()

    const payload = {
      name: `${values.name}.md`,
      content: editContent,
      appProperties,
    }

    try {
      if (editing) {
        await fetch(`/api/drive/file?id=${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        msg.success('Đã cập nhật')
      } else {
        await fetch('/api/drive/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        msg.success('Đã tạo mới')
      }
      setModalOpen(false)
      load()
    } catch {
      msg.error('Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/drive/file?id=${id}`, { method: 'DELETE' })
    msg.success('Đã xóa')
    load()
  }

  const columns: TableColumnsType<FileItem> = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: FileItem) => (
        <Space size={8}>
          {record.appProperties?.coverImageId && (
            <img
              src={`/api/drive/image?id=${record.appProperties.coverImageId}`}
              alt=""
              style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
            />
          )}
          <span>{name.replace(/\.md$/, '')}</span>
        </Space>
      ),
    },
    ...(categoryOptions
      ? [{
          title: 'Thể loại',
          key: 'category',
          render: (_: unknown, record: FileItem) =>
            record.appProperties?.category
              ? <Tag>{record.appProperties.category}</Tag>
              : <span style={{ color: '#bbb' }}>—</span>,
        }]
      : []),
    {
      title: 'Ngày đăng',
      key: 'publishDate',
      width: 110,
      render: (_: unknown, record: FileItem) => {
        const d = record.appProperties?.publishDate
        return d ? new Date(d).toLocaleDateString('vi-VN') : <span style={{ color: '#bbb' }}>—</span>
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 130,
      render: (_: unknown, record: FileItem) => {
        const published = record.appProperties?.status === 'published'
        return (
          <Tooltip title={published ? 'Click để đặt nháp' : 'Click để công bố'}>
            <Space size={6}>
              <Switch
                size="small"
                checked={published}
                onChange={() => toggleStatus(record)}
                checkedChildren={<UnlockOutlined />}
                unCheckedChildren={<LockOutlined />}
              />
              <Tag color={published ? 'green' : 'default'} style={{ margin: 0 }}>
                {published ? 'Công bố' : 'Nháp'}
              </Tag>
            </Space>
          </Tooltip>
        )
      },
    },
    {
      title: 'Cập nhật',
      dataIndex: 'modifiedTime',
      key: 'modifiedTime',
      width: 130,
      render: (t: string) => new Date(t).toLocaleDateString('vi-VN'),
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, record: FileItem) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="Xóa tác phẩm này?"
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
      {/* hidden file inputs */}
      <input
        ref={docxInputRef}
        type="file"
        accept=".docx"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleDocxImport(f)
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>{title}</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openNew}
          style={{ background: '#5d2e2e', borderColor: '#5d2e2e' }}
        >
          Thêm mới
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={files}
          pagination={{ pageSize: 20 }}
          size="middle"
          style={{ background: 'white', borderRadius: 8 }}
        />
      )}

      <Modal
        title={editing ? 'Chỉnh sửa' : 'Thêm mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText={editing ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
        confirmLoading={saving}
        width={800}
        okButtonProps={{ style: { background: '#5d2e2e', borderColor: '#5d2e2e' } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Tiêu đề" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input placeholder="Tên tác phẩm" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {categoryOptions && (
              <Form.Item name="category" label="Thể loại">
                <Input placeholder={categoryOptions.join(' / ')} list="cat-options" />
                <datalist id="cat-options">
                  {categoryOptions.map((o) => <option key={o} value={o} />)}
                </datalist>
              </Form.Item>
            )}
            <Form.Item name="publishDate" label="Ngày đăng">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" valuePropName="checked">
              <Switch
                checkedChildren="Công bố"
                unCheckedChildren="Nháp"
                style={{ '--ant-color-primary': '#5d2e2e' } as React.CSSProperties}
              />
            </Form.Item>
          </div>

          {/* Cover image */}
          <Form.Item label="Ảnh đại diện">
            <Space align="start">
              {coverImageId && (
                <img
                  src={`/api/drive/image?id=${coverImageId}`}
                  alt="cover"
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }}
                />
              )}
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => { handleCoverUpload(file); return false }}
              >
                <Button
                  icon={coverImageId ? <PictureOutlined /> : <UploadOutlined />}
                  loading={coverUploading}
                >
                  {coverImageId ? 'Đổi ảnh' : 'Tải ảnh lên'}
                </Button>
              </Upload>
              {coverImageId && (
                <Button type="text" danger onClick={() => setCoverImageId(null)}>Xóa</Button>
              )}
            </Space>
            {coverImageId && (
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                Dùng <code>![mô tả](/api/drive/image?id={coverImageId})</code> để chèn vào bài viết
              </Text>
            )}
          </Form.Item>

          {/* Content with DOCX import */}
          <Form.Item
            label={
              <Space>
                <span>Nội dung</span>
                <Button
                  size="small"
                  icon={<FileWordOutlined />}
                  loading={docxImporting}
                  onClick={() => docxInputRef.current?.click()}
                >
                  Nhập từ DOCX
                </Button>
              </Space>
            }
          >
            <TextArea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={18}
              placeholder="Viết nội dung ở đây (Markdown)..."
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
