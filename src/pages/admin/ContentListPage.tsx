import { useEffect, useState } from 'react'
import {
  Button, Table, Typography, Space, Tag, Modal, Form,
  Input, message, Popconfirm, Spin, Switch, Tooltip,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'

const { Title } = Typography
const { TextArea } = Input

interface FileItem {
  id: string
  name: string
  modifiedTime: string
  appProperties?: { type?: string; category?: string; status?: 'published' | 'draft' }
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
}

export default function ContentListPage({ title, contentType, categoryOptions }: ContentListPageProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FileItem | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
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
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = async (file: FileItem) => {
    setEditing(file)
    form.setFieldsValue({
      name: file.name.replace(/\.md$/, ''),
      category: file.appProperties?.category ?? '',
    })
    const res = await fetch(`/api/drive/file?id=${file.id}`)
    const data = await res.json()
    setEditContent(data.content ?? '')
    setModalOpen(true)
  }

  const handleSave = async () => {
    let values: FormValues
    try { values = await form.validateFields() } catch { return }
    setSaving(true)

    const payload = {
      name: `${values.name}.md`,
      content: editContent,
      appProperties: {
        type: contentType,
        status: editing?.appProperties?.status ?? 'draft',
        ...(values.category ? { category: values.category } : {}),
      },
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
      render: (name: string) => name.replace(/\.md$/, ''),
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
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>{title}</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNew}
          style={{ background: '#5d2e2e', borderColor: '#5d2e2e' }}>
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
        width={720}
        okButtonProps={{ style: { background: '#5d2e2e', borderColor: '#5d2e2e' } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Tiêu đề" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input placeholder="Tên tác phẩm" />
          </Form.Item>
          {categoryOptions && (
            <Form.Item name="category" label="Thể loại">
              <Input placeholder={categoryOptions.join(' / ')} list="cat-options" />
              <datalist id="cat-options">
                {categoryOptions.map((o) => <option key={o} value={o} />)}
              </datalist>
            </Form.Item>
          )}
          <Form.Item label="Nội dung">
            <TextArea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={16}
              placeholder="Viết nội dung ở đây (Markdown)..."
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
