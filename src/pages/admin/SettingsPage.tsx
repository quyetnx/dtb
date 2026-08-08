import { useEffect, useState } from 'react'
import {
  Typography, Card, Switch, Button, message, Divider, Tag, Spin, Space, Input,
} from 'antd'
import {
  CheckCircleOutlined, WarningOutlined, DisconnectOutlined,
  LinkOutlined, ReloadOutlined, GlobalOutlined, CloudOutlined, UserOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface DriveStatus {
  connected: boolean
  email: string | null
  expectedEmail: string | null
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card
      style={{ borderRadius: 10, marginBottom: 20, border: '1px solid #ebebeb' }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16, color: '#666' }}>{icon}</span>
        <Text strong style={{ fontSize: 14 }}>{title}</Text>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </Card>
  )
}

export default function SettingsPage() {
  const [drive, setDrive] = useState<DriveStatus | null>(null)
  const [driveLoading, setDriveLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [sitePublic, setSitePublic] = useState(false)
  const [siteLoading, setSiteLoading] = useState(false)
  const [bioQuote, setBioQuote] = useState('')
  const [bioBio, setBioBio] = useState('')
  const [bioBioDetail, setBioBioDetail] = useState('')
  const [bioSaving, setBioSaving] = useState(false)
  const [msg, ctxHolder] = message.useMessage()

  const loadDrive = () => {
    setDriveLoading(true)
    fetch('/api/drive/status')
      .then((r) => r.json())
      .then(setDrive)
      .catch(() => {})
      .finally(() => setDriveLoading(false))
  }

  useEffect(() => {
    loadDrive()
    fetch('/api/site/status')
      .then((r) => r.json())
      .then((d: { public: boolean }) => setSitePublic(d.public))
      .catch(() => {})
    fetch('/api/site/bio')
      .then((r) => r.json())
      .then((d: { quote?: string; bio?: string; bioDetail?: string }) => {
        setBioQuote(d.quote ?? '')
        setBioBio(d.bio ?? '')
        setBioBioDetail(d.bioDetail ?? '')
      })
      .catch(() => {})
  }, [])

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      await fetch('/api/drive/disconnect', { method: 'POST' })
      msg.success('Đã ngắt kết nối Drive')
      loadDrive()
    } catch {
      msg.error('Không thể ngắt kết nối')
    } finally {
      setDisconnecting(false)
    }
  }

  const saveBio = async () => {
    setBioSaving(true)
    try {
      await fetch('/api/site/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote: bioQuote, bio: bioBio, bioDetail: bioBioDetail }),
      })
      msg.success('Đã lưu thông tin tác giả')
    } catch {
      msg.error('Không thể lưu')
    } finally {
      setBioSaving(false)
    }
  }

  const toggleSite = async (val: boolean) => {
    setSiteLoading(true)
    try {
      await fetch('/api/site/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public: val }),
      })
      setSitePublic(val)
      msg.success(val ? 'Website đã mở public' : 'Website đã về chế độ sắp ra mắt')
    } catch {
      msg.error('Không thể cập nhật')
    } finally {
      setSiteLoading(false)
    }
  }

  const driveOk = drive?.connected && (!drive.expectedEmail || drive.email?.toLowerCase() === drive.expectedEmail.toLowerCase())
  const driveWrong = drive?.connected && drive.expectedEmail && drive.email?.toLowerCase() !== drive.expectedEmail.toLowerCase()

  return (
    <div style={{ maxWidth: 680 }}>
      {ctxHolder}
      <Title level={4} style={{ marginBottom: 24 }}>Cài đặt hệ thống</Title>

      {/* ── Google Drive ─────────────────────────────── */}
      <Section title="Kết nối Google Drive" icon={<CloudOutlined />}>
        {driveLoading ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
        ) : (
          <>
            {/* Status banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 8,
              background: driveOk ? '#f0fff4' : driveWrong ? '#fff1f0' : '#fffbe6',
              border: `1px solid ${driveOk ? '#b7eb8f' : driveWrong ? '#ffa39e' : '#ffe58f'}`,
              marginBottom: 20,
            }}>
              {driveOk
                ? <CheckCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                : <WarningOutlined style={{ fontSize: 18, color: driveWrong ? '#ff4d4f' : '#fa8c16' }} />}
              <div style={{ flex: 1 }}>
                {driveOk ? (
                  <>
                    <Text strong style={{ color: '#237804' }}>Đã kết nối</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Đang dùng Drive của <strong>{drive?.email}</strong>
                    </Text>
                  </>
                ) : driveWrong ? (
                  <>
                    <Text strong style={{ color: '#cf1322' }}>Sai tài khoản</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Đang dùng <strong>{drive?.email}</strong> — cần <strong>{drive?.expectedEmail}</strong>
                    </Text>
                  </>
                ) : (
                  <>
                    <Text strong style={{ color: '#d46b08' }}>Chưa kết nối</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {drive?.expectedEmail
                        ? <>Cần đăng nhập bằng <strong>{drive.expectedEmail}</strong></>
                        : 'Chưa có tài khoản Drive nào được ủy quyền'}
                    </Text>
                  </>
                )}
              </div>
              {drive?.connected && (
                <Tag color={driveOk ? 'success' : 'error'} style={{ margin: 0 }}>
                  {driveOk ? 'OK' : 'LỖI'}
                </Tag>
              )}
            </div>

            {/* Explanation */}
            <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
              Toàn bộ bài viết, hình ảnh và tài liệu được lưu trên Google Drive của tài khoản được chỉ định.
              Thao tác kết nối chỉ cần thực hiện <strong>một lần duy nhất</strong> — token sẽ tự động gia hạn.
            </Paragraph>

            {drive?.expectedEmail && (
              <div style={{
                background: '#fafafa',
                border: '1px solid #f0f0f0',
                borderRadius: 6,
                padding: '10px 14px',
                marginBottom: 16,
                fontSize: 13,
              }}>
                <Text type="secondary">Tài khoản Drive được chỉ định (</Text>
                <Text code>DRIVE_ACCOUNT_EMAIL</Text>
                <Text type="secondary">):</Text>
                <br />
                <Text strong>{drive.expectedEmail}</Text>
              </div>
            )}

            {/* Actions */}
            <Space wrap>
              {!drive?.connected || driveWrong ? (
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  href={`/api/auth/google?next=/admin/settings`}
                  style={{ background: '#4285f4', borderColor: '#4285f4' }}
                >
                  {driveWrong ? 'Kết nối lại với tài khoản đúng' : 'Kết nối Google Drive'}
                </Button>
              ) : (
                <Button
                  icon={<ReloadOutlined />}
                  href={`/api/auth/google?next=/admin/settings`}
                >
                  Kết nối lại
                </Button>
              )}
              {drive?.connected && (
                <Button
                  danger
                  icon={<DisconnectOutlined />}
                  loading={disconnecting}
                  onClick={handleDisconnect}
                >
                  Ngắt kết nối
                </Button>
              )}
            </Space>

            {!drive?.expectedEmail && (
              <>
                <Divider />
                <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
                  💡 Để cố định tài khoản Drive, thêm secret <Text code>DRIVE_ACCOUNT_EMAIL</Text> vào
                  Cloudflare Workers → Settings → Variables → Secrets.
                  Khi đó chỉ tài khoản đó mới có thể kết nối lại Drive.
                </Paragraph>
              </>
            )}
          </>
        )}
      </Section>

      {/* ── Website mode ─────────────────────────────── */}
      <Section title="Chế độ website" icon={<GlobalOutlined />}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <Text strong>Hiển thị công khai</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 13 }}>
              {sitePublic
                ? 'Khách truy cập thấy toàn bộ nội dung đã xuất bản.'
                : 'Khách truy cập thấy trang "Sắp ra mắt". Nội dung chỉ admin mới xem được.'}
            </Text>
          </div>
          <Switch
            checked={sitePublic}
            loading={siteLoading}
            onChange={toggleSite}
            checkedChildren="Public"
            unCheckedChildren="Riêng tư"
          />
        </div>
      </Section>

      {/* ── Author bio ───────────────────────────────── */}
      <Section title="Thông tin tác giả" icon={<UserOutlined />}>
        <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 20 }}>
          Nội dung hiển thị trên trang chủ. Thay đổi sẽ có hiệu lực ngay sau khi lưu.
        </Paragraph>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Câu trích dẫn (hero)</Text>
          <TextArea
            value={bioQuote}
            onChange={(e) => setBioQuote(e.target.value)}
            rows={3}
            placeholder="Câu quote ngắn hiển thị ở phần hero trang chủ..."
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Giới thiệu tác giả</Text>
          <TextArea
            value={bioBio}
            onChange={(e) => setBioBio(e.target.value)}
            rows={3}
            placeholder="Câu giới thiệu chính về tác giả (hiển thị nổi bật ở cuối trang)..."
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Mô tả thêm</Text>
          <TextArea
            value={bioBioDetail}
            onChange={(e) => setBioBioDetail(e.target.value)}
            rows={3}
            placeholder="Đoạn mô tả bổ sung về phong cách sáng tác..."
          />
        </div>

        <Button
          type="primary"
          loading={bioSaving}
          onClick={saveBio}
          style={{ background: '#7c3535', borderColor: '#7c3535' }}
        >
          Lưu thông tin
        </Button>
      </Section>
    </div>
  )
}
