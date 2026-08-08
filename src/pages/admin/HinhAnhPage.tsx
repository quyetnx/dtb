import { useEffect, useState } from 'react'
import { Button, Card, Col, Row, Typography, message, Popconfirm, Spin, Empty, Upload } from 'antd'
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface ImageFile {
  id: string
  name: string
  modifiedTime: string
}

export default function HinhAnhPage() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [msg, ctxHolder] = message.useMessage()

  const load = () => {
    setLoading(true)
    fetch('/api/drive/list?type=image')
      .then((r) => r.json())
      .then((data) => setImages(data.files ?? []))
      .catch(() => msg.error('Không thể tải hình ảnh'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', file.name)

    try {
      const res = await fetch('/api/drive/upload-image', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error()
      msg.success('Đã tải lên')
      load()
    } catch {
      msg.error('Tải lên thất bại')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/drive/file?id=${id}`, { method: 'DELETE' })
    msg.success('Đã xóa')
    load()
  }

  return (
    <div>
      {ctxHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Hình ảnh</Title>
        <Upload
          showUploadList={false}
          beforeUpload={(file) => { handleUpload(file); return false }}
          accept="image/*"
        >
          <Button
            type="primary"
            icon={uploading ? <Spin size="small" /> : <UploadOutlined />}
            disabled={uploading}
            style={{ background: '#5d2e2e', borderColor: '#5d2e2e' }}
          >
            Tải lên
          </Button>
        </Upload>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : images.length === 0 ? (
        <Empty description="Chưa có hình ảnh nào" />
      ) : (
        <Row gutter={[16, 16]}>
          {images.map((img) => (
            <Col key={img.id} xs={12} sm={8} md={6} lg={4}>
              <Card
                size="small"
                cover={
                  <div style={{ height: 120, overflow: 'hidden', background: '#f0f0f0', position: 'relative' }}>
                    <img
                      src={`/api/drive/file?id=${img.id}`}
                      alt={img.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                }
                actions={[
                  <Popconfirm
                    key="del"
                    title="Xóa hình ảnh này?"
                    okText="Xóa"
                    cancelText="Hủy"
                    onConfirm={() => handleDelete(img.id)}
                  >
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
                styles={{ body: { padding: '8px' } }}
              >
                <Text ellipsis style={{ fontSize: 12 }}>{img.name}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}
