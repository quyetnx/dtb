import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Alert, Button, Col, DatePicker, Divider, Form, Input,
  message, Row, Select, Space, Spin, Switch, Tag, Typography, Upload,
} from 'antd'
import {
  ArrowLeftOutlined, DeleteOutlined, EditOutlined, FileWordOutlined,
  PictureOutlined, SaveOutlined, SettingOutlined, UploadOutlined,
} from '@ant-design/icons'
import MDEditor, { commands } from '@uiw/react-md-editor'
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

type EditorMode = 'pick' | 'markdown' | 'html'

export default function ContentFormPage({ contentType, pageTitle, backPath, categoryOptions }: Props) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id

  const [loading, setLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState('')
  const [editorMode, setEditorMode] = useState<EditorMode>('pick')
  const [coverImageId, setCoverImageId] = useState<string | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [docxImporting, setDocxImporting] = useState(false)
  const [contentFormat, setContentFormat] = useState<'markdown' | 'html'>('markdown')
  const [description, setDescription] = useState('')
  const [imageInserting, setImageInserting] = useState(false)
  const docxInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [form] = Form.useForm<FormValues>()
  const [msg, ctxHolder] = message.useMessage()

  useEffect(() => {
    if (isNew) { form.setFieldsValue({ status: false }); return }
    setLoading(true)
    setLoadError(null)
    apiFetch(`/api/drive/file?id=${id}`)
      .then((r) => r.json())
      .then((data: Record<string, unknown> & { appProperties?: Record<string, string>; content?: string; name?: string }) => {
        form.setFieldsValue({
          name: data.name?.replace(/\.md$/, '') ?? '',
          category: data.appProperties?.category,
          status: data.appProperties?.status === 'published',
          publishDate: data.appProperties?.publishDate ? dayjs(data.appProperties.publishDate) : undefined,
        })
        const fmt = (data.appProperties?.contentFormat as 'markdown' | 'html') ?? 'markdown'
        const body = (data.content as string) ?? ''
        setContent(body)
        setContentFormat(fmt)
        setEditorMode(fmt === 'html' ? 'html' : 'markdown')
        setCoverImageId(data.appProperties?.coverImageId ?? null)
        setDescription((data.description as string) ?? '')
      })
      .catch((e: Error) => setLoadError(e.message || 'Không thể tải nội dung'))
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const apiFetch = async (url: string, opts?: RequestInit) => {
    const res = await fetch(url, opts)
    if (!res.ok) {
      if (res.status === 401) { window.location.href = '/admin/login'; throw new Error('Unauthorized') }
      let errMsg = `HTTP ${res.status}`
      try {
        const body = await res.json() as { error?: string; detail?: string; message?: string }
        const main = body.error ?? body.message ?? errMsg
        const detail = body.detail ? ` — ${body.detail}` : ''
        errMsg = `${main}${detail}`
      } catch { /* ignore */ }
      console.error('[apiFetch]', url, res.status, errMsg)
      throw new Error(errMsg)
    }
    return res
  }

  const handleCoverUpload = async (file: File) => {
    setCoverUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', file.name)
      const res = await apiFetch('/api/drive/upload-image', { method: 'POST', body: fd })
      const data = await res.json() as { id: string }
      setCoverImageId(data.id)
      msg.success('Đã tải ảnh')
    } catch (e) { msg.error((e as Error).message || 'Không thể tải ảnh') }
    finally { setCoverUploading(false) }
  }

  const uploadBase64Images = async (html: string): Promise<string> => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const imgs = Array.from(doc.querySelectorAll<HTMLImageElement>('img[src^="data:"]'))
    await Promise.all(imgs.map(async (img, i) => {
      const src = img.src
      const mimeType = src.match(/data:(image\/[^;]+)/)?.[1] ?? 'image/jpeg'
      const ext = mimeType.split('/')[1] ?? 'jpg'
      const base64 = src.split(',')[1]
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: mimeType })
      const fd = new FormData()
      fd.append('file', new File([blob], `docx-image-${i + 1}.${ext}`, { type: mimeType }))
      fd.append('name', `docx-image-${i + 1}.${ext}`)
      try {
        const res = await apiFetch('/api/drive/upload-image', { method: 'POST', body: fd })
        const data = await res.json() as { id: string }
        img.src = `/api/drive/image?id=${data.id}`
        img.removeAttribute('style')
      } catch { /* keep base64 if upload fails */ }
    }))
    return doc.body.innerHTML
  }

  const autoFillFromContent = (html: string, currentCoverId: string | null) => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const text = (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
    const desc = text.length > 250 ? text.slice(0, 247) + '…' : text
    setDescription(desc)
    if (!currentCoverId) {
      const match = html.match(/\/api\/drive\/image\?id=([^"'\s]+)/)
      if (match) setCoverImageId(match[1])
    }
  }

  const handleDocxImport = async (file: File) => {
    setDocxImporting(true)
    try {
      const mammoth = await import('mammoth')
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        { convertImage: mammoth.images.dataUri },
      )
      const imgCount = result.value.match(/src="data:/g)?.length ?? 0
      if (imgCount > 0) {
        msg.loading({ content: `Đang upload ${imgCount} ảnh lên Drive...`, key: 'docx-upload' })
      }
      const html = await uploadBase64Images(result.value)
      msg.success({ content: 'Đã nhập nội dung từ Word thành công!', key: 'docx-upload', duration: 4 })
      const trimmed = html.trim()
      setContent(trimmed)
      setContentFormat('html')
      setEditorMode('html')
      autoFillFromContent(trimmed, coverImageId)
    } catch { msg.error('Không thể đọc file DOCX') }
    finally {
      setDocxImporting(false)
      if (docxInputRef.current) docxInputRef.current.value = ''
    }
  }

  const handleInlineImageUpload = async (file: File) => {
    setImageInserting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', file.name)
      const res = await apiFetch('/api/drive/upload-image', { method: 'POST', body: fd })
      const data = await res.json() as { id: string }
      const mdImage = `![${file.name.replace(/\.[^.]+$/, '')}](/api/drive/image?id=${data.id})`
      setContent((prev) => prev ? `${prev}\n\n${mdImage}` : mdImage)
      msg.success('Đã chèn ảnh vào nội dung')
    } catch (e) { msg.error((e as Error).message || 'Không thể tải ảnh') }
    finally {
      setImageInserting(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const insertImageCommand = commands.getCommands().find((c) => c.name === 'image') ?? commands.image
  const insertImageCmd = {
    ...insertImageCommand,
    icon: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, padding: '0 2px' }}>
        {imageInserting ? '⏳' : '🖼'} Chèn ảnh
      </span>
    ),
    execute: () => { imageInputRef.current?.click() },
  }

  const handleSave = async () => {
    let values: FormValues
    try { values = await form.validateFields() } catch { return }
    setSaving(true)

    const appProperties: Record<string, string> = {
      type: contentType,
      status: values.status ? 'published' : 'draft',
      contentFormat,
    }
    if (values.category) appProperties.category = values.category
    if (coverImageId) appProperties.coverImageId = coverImageId
    if (values.publishDate) appProperties.publishDate = values.publishDate.toISOString()

    try {
      if (!isNew && id) {
        await apiFetch(`/api/drive/file?id=${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `${values.name}.md`, content, appProperties, description: description || undefined }),
        })
        msg.success('Đã lưu')
      } else {
        await apiFetch('/api/drive/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `${values.name}.md`, content, appProperties, description: description || undefined }),
        })
        msg.success('Đã tạo bài')
        navigate(backPath)
      }
    } catch (e) {
      const errText = (e as Error).message || 'Lưu thất bại'
      msg.error({ content: errText, duration: 10 })
    }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (loadError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không thể tải nội dung"
        description={
          <span>
            {loadError}{' '}
            {loadError.includes('kết nối') && (
              <a href="/admin/settings"><SettingOutlined /> Vào Cài đặt để kết nối Drive</a>
            )}
          </span>
        }
        action={<Button onClick={() => navigate(backPath)}>Quay lại</Button>}
        style={{ maxWidth: 560 }}
      />
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
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleInlineImageUpload(f) }}
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

            {/* ── Editor card ───────────────────────────── */}
            <div style={{ background: 'white', borderRadius: 8, border: '1px solid #ebebeb', overflow: 'hidden' }}>

              {/* Header */}
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid #ebebeb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: 500 }}>Nội dung</Text>
                  {editorMode === 'html' && (
                    <Tag icon={<FileWordOutlined />} color="blue" style={{ margin: 0 }}>Đã nhập từ Word</Tag>
                  )}
                  {editorMode === 'markdown' && (
                    <Tag color="default" style={{ margin: 0, fontSize: 11 }}>Markdown</Tag>
                  )}
                </div>

                <Space size="small">
                  {editorMode === 'html' && (
                    <>
                      <Button
                        size="small"
                        onClick={() => {
                          setContentFormat('markdown')
                          setContent('')
                          setEditorMode('markdown')
                        }}
                      >
                        Chuyển sang Markdown
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        icon={<FileWordOutlined />}
                        loading={docxImporting}
                        onClick={() => docxInputRef.current?.click()}
                        style={{ background: '#1677ff', borderColor: '#1677ff' }}
                      >
                        Nhập lại Word
                      </Button>
                    </>
                  )}
                  {editorMode === 'markdown' && (
                    <>
                      <Button
                        size="small"
                        onClick={() => setEditorMode('pick')}
                      >
                        Đổi phương thức
                      </Button>
                      <Button
                        size="small"
                        type="default"
                        icon={<FileWordOutlined />}
                        loading={docxImporting}
                        onClick={() => docxInputRef.current?.click()}
                      >
                        Nhập từ Word
                      </Button>
                    </>
                  )}
                </Space>
              </div>

              {/* ── Chọn phương thức (pick mode) ─────────── */}
              {editorMode === 'pick' && (
                <div style={{ padding: 24 }}>
                  <Upload.Dragger
                    accept=".docx"
                    showUploadList={false}
                    beforeUpload={(file) => { handleDocxImport(file); return false }}
                    disabled={docxImporting}
                    style={{
                      background: '#f0f7ff',
                      border: '2px dashed #91caff',
                      borderRadius: 8,
                      padding: '32px 24px',
                    }}
                  >
                    {docxImporting ? (
                      <div style={{ padding: '16px 0' }}>
                        <Spin size="large" />
                        <p style={{ marginTop: 16, fontSize: 14, color: '#555' }}>Đang xử lý file Word...</p>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 12 }}>
                          <FileWordOutlined style={{ color: '#1677ff' }} />
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 600, color: '#1677ff', marginBottom: 6 }}>
                          Kéo thả file Word vào đây
                        </p>
                        <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
                          Hỗ trợ định dạng .docx · Ảnh trong tài liệu sẽ tự động upload lên Drive
                        </p>
                        <Button
                          type="primary"
                          icon={<UploadOutlined />}
                          size="large"
                          style={{ background: '#1677ff', borderColor: '#1677ff' }}
                        >
                          Chọn file .docx
                        </Button>
                      </>
                    )}
                  </Upload.Dragger>

                  <Divider plain style={{ fontSize: 12, color: '#bbb', margin: '20px 0' }}>
                    hoặc soạn thảo trực tiếp
                  </Divider>

                  <Button
                    block
                    size="large"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditorMode('markdown')
                      setContentFormat('markdown')
                    }}
                    style={{ height: 52, fontSize: 14, border: '1px solid #d9d9d9' }}
                  >
                    Soạn thảo Markdown
                  </Button>
                </div>
              )}

              {/* ── Nội dung HTML từ DOCX ─────────────── */}
              {editorMode === 'html' && (
                <div style={{ padding: 20, minHeight: 520, maxHeight: 720, overflowY: 'auto' }}>
                  <div
                    className="prose-content"
                    dangerouslySetInnerHTML={{ __html: content }}
                    style={{ fontSize: 14, lineHeight: 1.8 }}
                  />
                </div>
              )}

              {/* ── Markdown editor ───────────────────── */}
              {editorMode === 'markdown' && (
                <div data-color-mode="light">
                  <MDEditor
                    value={content}
                    onChange={(val) => setContent(val ?? '')}
                    height={520}
                    preview="live"
                    style={{ borderRadius: 0, border: 'none' }}
                    commands={[
                      commands.bold, commands.italic, commands.strikethrough,
                      commands.divider,
                      commands.title1, commands.title2, commands.title3,
                      commands.divider,
                      commands.link, insertImageCmd,
                      commands.divider,
                      commands.quote, commands.code, commands.codeBlock,
                      commands.divider,
                      commands.unorderedListCommand, commands.orderedListCommand,
                      commands.divider,
                      commands.hr,
                    ]}
                  />
                </div>
              )}
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

            {/* Description */}
            <div style={{ background: 'white', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #ebebeb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong style={{ fontSize: 13 }}>Mô tả ngắn</Text>
                <Button
                  size="small"
                  type="link"
                  style={{ padding: 0, fontSize: 12 }}
                  disabled={!content}
                  onClick={() => {
                    if (contentFormat === 'html') {
                      autoFillFromContent(content, coverImageId)
                    } else {
                      const stripped = content.replace(/#{1,6}\s/g, '').replace(/[*_~`[\]()]/g, '').replace(/\s+/g, ' ').trim()
                      const desc = stripped.length > 250 ? stripped.slice(0, 247) + '…' : stripped
                      setDescription(desc)
                      if (!coverImageId) {
                        const m = content.match(/!\[.*?\]\(\/api\/drive\/image\?id=([^)]+)\)/)
                        if (m) setCoverImageId(m[1])
                      }
                    }
                  }}
                >
                  Tự động
                </Button>
              </div>
              <Input.TextArea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Mô tả ngắn hiển thị khi chia sẻ mạng xã hội..."
                style={{ fontSize: 12 }}
                maxLength={300}
                showCount
              />
            </div>

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
