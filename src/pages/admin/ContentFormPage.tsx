import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button, Col, DatePicker, Divider, Form, Input,
  message, Row, Select, Space, Spin, Switch, Typography, Upload,
} from 'antd'
import {
  ArrowLeftOutlined, DeleteOutlined, FileWordOutlined,
  PictureOutlined, SaveOutlined, UploadOutlined,
} from '@ant-design/icons'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import dayjs from 'dayjs'

const { Text } = Typography

interface Props {
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

export default function ContentFormPage({ contentType, pageTitle, backPath, categoryOptions }: Props) {
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
    if (isNew) { form.setFieldsValue({ status: false }); return }
    setLoading(true)
    fetch(`/api/drive/file?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        form.setFieldsValue({
          name: (data.name as string)?.replace(/\.md$/, '') ?? '',
          category: data.appProperties?.category,
          status: data.appProperties?.status === 'published',
          publishDate: data.appProperties?.publishDate ? dayjs(data.appProperties.publishDate) : undefined,
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
      msg.success('Đã tải ảnh')
    } catch { msg.error('Không thể tải ảnh') }
    finally { setCoverUploading(false) }
  }

  const handleDocxImport = async (file: File) => {
    setDocxImporting(true)
    try {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
      setContent(result.value.trim())
      msg.success('Đã nhập nội dung từ DOCX')
    } catch { msg.error('Không thể đọc file DOCX') }
    finally {
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

    try {
      if (!isNew && id) {
        await fetch(`/api/drive/file?id=${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `${values.name}.md`, content, appProperties }),
        })
        msg.success('Đã lưu')
      } else {
        await fetch('/api/drive/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `${values.name}.md`, content, appProperties }),
        })
        msg.success('Đã tạo bài')
        navigate(backPath)
      }
    } catch { msg.error('Lưu thất bại') }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      {ctxHolder}
      <input
        ref={docxInputRef}
        type="file"
        accept=".docx"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocxImport(f) }}
      />

      {/* Sticky action bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        padding: '10px 16px',
        background: 'white',
        borderRadius: 8,
        border: '1px solid #ebebeb',
        flexWrap: 'wrap',
      }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(backPath)}>
          {pageTitle}
        </Button>
        <div style={{ flex: 1, minWidth: 80 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isNew ? 'Bài viết mới' : 'Chỉnh sửa'}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          style={{ background: '#7c3535', borderColor: '#7c3535' }}
        >
          {isNew ? 'Tạo bài' : 'Lưu'}
        </Button>
      </div>

      <Form form={form} layout="vertical">
        <Row gutter={[16, 16]}>
          {/* ─── Main column ─────────────────────────────── */}
          <Col xs={24} lg={17}>
            {/* Title */}
            <div style={{ background: 'white', borderRadius: 8, padding: '16px', marginBottom: 16, border: '1px solid #ebebeb' }}>
              <Form.Item
                name="name"
                label="Tiêu đề"
                rules={[{ required: true, message: 'Bắt buộc nhập tiêu đề' }]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  placeholder="Nhập tiêu đề bài viết..."
                  size="large"
                  style={{ fontWeight: 600 }}
                />
              </Form.Item>
            </div>

            {/* Editor */}
            <div style={{ background: 'white', borderRadius: 8, border: '1px solid #ebebeb', overflow: 'hidden' }}>
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid #ebebeb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 13, fontWeight: 500 }}>Nội dung</Text>
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
                  height={520}
                  preview="live"
                  style={{ borderRadius: 0, border: 'none' }}
                />
              </div>
            </div>
          </Col>

          {/* ─── Sidebar ─────────────────────────────────── */}
          <Col xs={24} lg={7}>
            {/* Publish */}
            <div style={{ background: 'white', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #ebebeb' }}>
              <Text strong style={{ fontSize: 13 }}>Xuất bản</Text>
              <Divider style={{ margin: '10px 0' }} />
              <Form.Item name="status" label="Trạng thái" valuePropName="checked" style={{ marginBottom: 12 }}>
                <Switch checkedChildren="Công bố" unCheckedChildren="Nháp" />
              </Form.Item>
              <Form.Item name="publishDate" label="Ngày đăng" style={{ marginBottom: 0 }}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
              </Form.Item>
            </div>

            {/* Category */}
            {categoryOptions && (
              <div style={{ background: 'white', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #ebebeb' }}>
                <Text strong style={{ fontSize: 13 }}>Phân loại</Text>
                <Divider style={{ margin: '10px 0' }} />
                <Form.Item name="category" style={{ marginBottom: 0 }}>
                  <Select
                    placeholder="Chọn thể loại..."
                    allowClear
                    style={{ width: '100%' }}
                    options={categoryOptions.map((o) => ({ value: o, label: o }))}
                  />
                </Form.Item>
              </div>
            )}

            {/* Cover image */}
            <div style={{ background: 'white', borderRadius: 8, padding: 16, border: '1px solid #ebebeb' }}>
              <Text strong style={{ fontSize: 13 }}>Ảnh đại diện</Text>
              <Divider style={{ margin: '10px 0' }} />
              {coverImageId ? (
                <>
                  <img
                    src={`/api/drive/image?id=${coverImageId}`}
                    alt="cover"
                    style={{
                      width: '100%', aspectRatio: '16/9', objectFit: 'cover',
                      borderRadius: 6, marginBottom: 10, display: 'block',
                    }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <Space wrap>
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      beforeUpload={(file) => { handleCoverUpload(file); return false }}
                    >
                      <Button size="small" icon={<PictureOutlined />} loading={coverUploading}>Đổi ảnh</Button>
                    </Upload>
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setCoverImageId(null)}>
                      Xóa
                    </Button>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 8, wordBreak: 'break-all' }}>
                    Markdown: <code>![alt](/api/drive/image?id={coverImageId})</code>
                  </Text>
                </>
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
          </Col>
        </Row>
      </Form>
    </div>
  )
}
