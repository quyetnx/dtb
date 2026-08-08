import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button, Form, Input, Switch, DatePicker, Space, Typography,
  Spin, message, Upload, Divider, Select,
} from 'antd'
import {
  ArrowLeftOutlined, SaveOutlined, UploadOutlined,
  FileWordOutlined, PictureOutlined, DeleteOutlined,
} from '@ant-design/icons'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface ContentFormPageProps {
  contentType: string
  pageTitle: string
  backPath: string
  categoryOptions?: string[]
}

interface FormValues {
  name: string
  category?: string
  status: boolean
  publishDate?: dayjs.Dayjs
}

export default function ContentFormPage({
  contentType,
  pageTitle,
  backPath,
  categoryOptions,
}: ContentFormPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState('')
  const [coverImageId, setCoverImageId] = useState<string | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [docxImporting, setDocxImporting] = useState(false)
  const docxInputRef = useRef<HTMLInputElement>(null)
  const [form] = Form.useForm<FormValues>()
  const [msg, ctxHolder] = message.useMessage()

  useEffect(() => {
    if (isNew) {
      form.setFieldsValue({ status: false })
      return
    }
    setLoading(true)
    fetch(`/api/drive/file?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        form.setFieldsValue({
          name: (data.name as string)?.replace(/\.md$/, '') ?? '',
          category: data.appProperties?.category ?? '',
          status: data.appProperties?.status === 'published',
          publishDate: data.appProperties?.publishDate
            ? dayjs(data.appProperties.publishDate)
            : undefined,
        })
        setContent(data.content ?? '')
        setCoverImageId(data.appProperties?.coverImageId ?? null)
      })
      .catch(() => msg.error('Không thể tải nội dung'))
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCoverUpload = async (file: File) => {
    setCoverUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', file.name)
      const res = await fetch('/api/drive/upload-image', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
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
      setContent(result.value.trim())
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
      content,
      appProperties,
    }

    try {
      if (!isNew && id) {
        await fetch(`/api/drive/file?id=${id}`, {
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
        navigate(backPath)
      }
    } catch {
      msg.error('Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {ctxHolder}
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

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(backPath)}>
          {pageTitle}
        </Button>
        <Title level={4} style={{ margin: 0, flex: 1 }}>
          {isNew ? 'Thêm bài mới' : 'Chỉnh sửa bài viết'}
        </Title>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          style={{ background: '#5d2e2e', borderColor: '#5d2e2e' }}
        >
          {isNew ? 'Tạo bài' : 'Lưu'}
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>
        {/* Left: title + content */}
        <div>
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="Tiêu đề"
              rules={[{ required: true, message: 'Bắt buộc nhập tiêu đề' }]}
              style={{ marginBottom: 16 }}
            >
              <Input
                placeholder="Tên bài viết..."
                size="large"
                style={{ fontSize: 18, fontWeight: 500 }}
              />
            </Form.Item>
          </Form>

          {/* WYSIWYG Editor */}
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Nội dung (Markdown)</Text>
            <Button
              size="small"
              icon={<FileWordOutlined />}
              loading={docxImporting}
              onClick={() => docxInputRef.current?.click()}
            >
              Nhập từ DOCX
            </Button>
          </div>
          <div data-color-mode="light">
            <MDEditor
              value={content}
              onChange={(val) => setContent(val ?? '')}
              height={560}
              preview="live"
            />
          </div>
        </div>

        {/* Right: sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Publish settings */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e8e8e8',
              borderRadius: 8,
              padding: '16px',
              marginBottom: 16,
            }}
          >
            <Text strong style={{ fontSize: 13 }}>Xuất bản</Text>
            <Divider style={{ margin: '10px 0' }} />
            <Form form={form} layout="vertical">
              <Form.Item name="status" label="Trạng thái" valuePropName="checked" style={{ marginBottom: 12 }}>
                <Switch
                  checkedChildren="Công bố"
                  unCheckedChildren="Nháp"
                />
              </Form.Item>
              <Form.Item name="publishDate" label="Ngày đăng" style={{ marginBottom: 0 }}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
              </Form.Item>
            </Form>
          </div>

          {/* Category */}
          {categoryOptions && (
            <div
              style={{
                background: '#fff',
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                padding: '16px',
                marginBottom: 16,
              }}
            >
              <Text strong style={{ fontSize: 13 }}>Phân loại</Text>
              <Divider style={{ margin: '10px 0' }} />
              <Form form={form} layout="vertical">
                <Form.Item name="category" style={{ marginBottom: 0 }}>
                  <Select
                    placeholder="Chọn thể loại..."
                    allowClear
                    options={categoryOptions.map((o) => ({ value: o, label: o }))}
                  />
                </Form.Item>
              </Form>
            </div>
          )}

          {/* Cover image */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #e8e8e8',
              borderRadius: 8,
              padding: '16px',
              marginBottom: 16,
            }}
          >
            <Text strong style={{ fontSize: 13 }}>Ảnh đại diện</Text>
            <Divider style={{ margin: '10px 0' }} />
            {coverImageId ? (
              <div>
                <img
                  src={`/api/drive/image?id=${coverImageId}`}
                  alt="cover"
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    objectFit: 'cover',
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />
                <Space>
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => { handleCoverUpload(file); return false }}
                  >
                    <Button size="small" icon={<PictureOutlined />} loading={coverUploading}>
                      Đổi ảnh
                    </Button>
                  </Upload>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => setCoverImageId(null)}
                  >
                    Xóa
                  </Button>
                </Space>
                <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 6, wordBreak: 'break-all' }}>
                  ID: {coverImageId}
                </Text>
              </div>
            ) : (
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => { handleCoverUpload(file); return false }}
              >
                <Button
                  icon={<UploadOutlined />}
                  loading={coverUploading}
                  style={{ width: '100%' }}
                >
                  Tải ảnh lên
                </Button>
              </Upload>
            )}
          </div>

          {/* Image embed hint */}
          {coverImageId && (
            <div
              style={{
                background: '#fafafa',
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                padding: '12px 16px',
              }}
            >
              <Text type="secondary" style={{ fontSize: 11 }}>
                Chèn ảnh vào nội dung:
              </Text>
              <br />
              <code style={{ fontSize: 10, wordBreak: 'break-all', color: '#555' }}>
                ![mô tả](/api/drive/image?id={coverImageId})
              </code>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
