import { useEffect, useState } from 'react'
import {
  Button, Table, Typography, Space, Tag, message, Popconfirm, Spin,
  Modal, Form, Input, Select, Switch, InputNumber,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'

const { Title } = Typography

interface Ad {
  id: string
  title: string
  imageId: string
  link: string
  position: string
  active: boolean
  order: number
  createdAt: string
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

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Ad | null>(null)
  const [saving, setSaving] = useState(false)
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
    form.resetFields()
    form.setFieldsValue({ active: true, order: ads.length + 1, position: 'home' })
    setModalOpen(true)
  }

  const openEdit = (ad: Ad) => {
    setEditing(ad)
    form.setFieldsValue(ad)
    setModalOpen(true)
  }

  const handleSave = async () => {
    let values: Partial<Ad>
    try { values = await form.validateFields() } catch { return }
    setSaving(true)
    try {
      if (editing) {
        await fetch(`/api/ads?id=${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        msg.success('Đã cập nhật')
      } else {
        await fetch('/api/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        msg.success('Đã tạo quảng cáo')
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
            style={{ width: 60, height: 36, objectFit: 'cover', borderRadius: 2 }}
          />
        ) : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (t: string, record: Ad) => (
        <button
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#1677ff', textAlign: 'left' }}
          onClick={() => openEdit(record)}
        >
          {t}
        </button>
      ),
    },
    {
      title: 'Vị trí',
      key: 'position',
      width: 130,
      render: (_: unknown, record: Ad) => (
        <Tag color="blue">{POSITION_LABELS[record.position] ?? record.position}</Tag>
      ),
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
      title: 'Thứ tự',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Hiển thị',
      key: 'active',
      width: 90,
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
      width: 80,
      render: (_: unknown, record: Ad) => (
        <Space>
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
          scroll={{ x: 700 }}
          style={{ background: 'white', borderRadius: 8 }}
        />
      )}

      <Modal
        title={editing ? 'Chỉnh sửa quảng cáo' : 'Thêm quảng cáo'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
            <Input placeholder="Tên quảng cáo/banner" />
          </Form.Item>
          <Form.Item
            name="imageId"
            label="ID hình ảnh từ Drive"
            rules={[{ required: true, message: 'Nhập image ID' }]}
            extra="Lấy ID từ trang Hình ảnh trong CMS"
          >
            <Input placeholder="Ví dụ: 1abc2def3..." />
          </Form.Item>
          <Form.Item name="link" label="Đường dẫn khi click" rules={[{ required: true, message: 'Nhập link' }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="position" label="Vị trí hiển thị" rules={[{ required: true }]}>
            <Select options={POSITIONS} />
          </Form.Item>
          <Form.Item name="order" label="Thứ tự">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="active" label="Hiển thị" valuePropName="checked">
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
