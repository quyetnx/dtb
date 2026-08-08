import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Button, Table, Typography, Space, Tag, message, Popconfirm, Spin, Switch, Tooltip,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined, SettingOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'

const { Title } = Typography

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
  basePath: string
  categoryOptions?: string[]
}

export default function ContentListPage({ title, contentType, basePath, categoryOptions }: ContentListPageProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [driveError, setDriveError] = useState<string | null>(null)
  const navigate = useNavigate()
  const [msg, ctxHolder] = message.useMessage()

  const apiFetch = async (url: string, opts?: RequestInit) => {
    const res = await fetch(url, opts)
    if (!res.ok) {
      if (res.status === 401) { navigate('/admin/login'); throw new Error('Unauthorized') }
      let errMsg = `Lỗi ${res.status}`
      try {
        const body = await res.json() as { error?: string }
        errMsg = body.error ?? errMsg
      } catch { /* ignore */ }
      throw new Error(errMsg)
    }
    return res
  }

  const load = () => {
    setLoading(true)
    setDriveError(null)
    fetch('/api/drive/list?admin=1')
      .then((r) => {
        if (r.status === 401) { navigate('/admin/login'); return null }
        return r.json()
      })
      .then((data) => {
        if (!data) return
        if (data.error) {
          setDriveError(data.error)
          return
        }
        const all: FileItem[] = data.files ?? []
        setFiles(all.filter((f) => f.appProperties?.type === contentType))
      })
      .catch(() => setDriveError('Không thể kết nối, kiểm tra lại mạng'))
      .finally(() => setLoading(false))
  }

  const toggleStatus = async (file: FileItem) => {
    const next = file.appProperties?.status === 'published' ? 'draft' : 'published'
    try {
      await apiFetch(`/api/drive/file?id=${file.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appProperties: { ...file.appProperties, status: next } }),
      })
      msg.success(next === 'published' ? 'Đã công bố' : 'Đã đặt nháp')
      load()
    } catch (e) {
      msg.error((e as Error).message || 'Cập nhật thất bại')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/drive/file?id=${id}`, { method: 'DELETE' })
      msg.success('Đã xóa')
      load()
    } catch (e) {
      msg.error((e as Error).message || 'Xóa thất bại')
    }
  }

  useEffect(() => { load() }, [contentType]) // eslint-disable-line react-hooks/exhaustive-deps

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
          <button
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: '#1677ff' }}
            onClick={() => navigate(`${basePath}/${record.id}`)}
          >
            {name.replace(/\.md$/, '')}
          </button>
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
      width: 120,
      render: (t: string) => new Date(t).toLocaleDateString('vi-VN'),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: FileItem) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`${basePath}/${record.id}`)}
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate(`${basePath}/new`)}
          style={{ background: '#5d2e2e', borderColor: '#5d2e2e' }}
        >
          Thêm mới
        </Button>
      </div>

      {driveError && (
        <Alert
          type="error"
          showIcon
          message="Không thể kết nối Drive"
          description={
            <span>
              {driveError}{' '}
              <a href="/admin/settings">
                <SettingOutlined /> Vào Cài đặt để kết nối Drive
              </a>
            </span>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={files}
          pagination={{ pageSize: 20 }}
          size="middle"
          scroll={{ x: 600 }}
          style={{ background: 'white', borderRadius: 8 }}
        />
      )}
    </div>
  )
}
