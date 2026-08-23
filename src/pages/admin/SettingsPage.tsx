import { useEffect, useState } from 'react'
import {
  Typography, Switch, Button, message, Divider, Tag, Spin, Space, Input, Select, Row, Col, Card,
} from 'antd'
import {
  CheckCircleOutlined, WarningOutlined, DisconnectOutlined,
  LinkOutlined, ReloadOutlined, GlobalOutlined, CloudOutlined, UserOutlined, FolderOutlined,
  EyeOutlined, SearchOutlined, UploadOutlined, LoadingOutlined,
} from '@ant-design/icons'
import { Upload } from 'antd'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface SiteMeta {
  siteTitle: string
  siteDescription: string
  ogImage: string
  homeTitle: string
  homeDescription: string
  homeOgImage: string
  twitterSite: string
  locale: string
}

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
  interface DriveFolder { id: string; name: string }

  const [drive, setDrive] = useState<DriveStatus | null>(null)
  const [driveLoading, setDriveLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [sitePublic, setSitePublic] = useState(false)
  const [siteLoading, setSiteLoading] = useState(false)
  const [bioQuote, setBioQuote] = useState('')
  const [bioBio, setBioBio] = useState('')
  const [bioBioDetail, setBioBioDetail] = useState('')
  const [bioSaving, setBioSaving] = useState(false)
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [currentFolder, setCurrentFolder] = useState('')
  const [folderSource, setFolderSource] = useState<'kv' | 'env' | 'none'>('none')
  const [folderSaving, setFolderSaving] = useState(false)
  const [foldersLoading, setFoldersLoading] = useState(false)
  const [currentViews, setCurrentViews] = useState<number | null>(null)
  const [viewsInput, setViewsInput] = useState('')
  const [viewsSaving, setViewsSaving] = useState(false)
  const [siteMeta, setSiteMeta] = useState<SiteMeta>({
    siteTitle: 'Dương Thanh Biểu',
    siteDescription: '',
    ogImage: '',
    homeTitle: '',
    homeDescription: '',
    homeOgImage: '',
    twitterSite: '',
    locale: 'vi_VN',
  })
  const [metaSaving, setMetaSaving] = useState(false)
  const [bustingCache, setBustingCache] = useState(false)
  const [authorPhotoId, setAuthorPhotoId] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingOgImage, setUploadingOgImage] = useState(false)
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
      .then((d: { quote?: string; bio?: string; bioDetail?: string; authorPhotoId?: string }) => {
        setBioQuote(d.quote ?? '')
        setBioBio(d.bio ?? '')
        setBioBioDetail(d.bioDetail ?? '')
        setAuthorPhotoId(d.authorPhotoId ?? '')
      })
      .catch(() => {})
    fetch('/api/site/folder')
      .then((r) => r.json())
      .then((d: { folderId: string; source: 'kv' | 'env' | 'none' }) => {
        setCurrentFolder(d.folderId)
        setFolderSource(d.source)
      })
      .catch(() => {})
    fetch('/api/site/views')
      .then((r) => r.json())
      .then((d: { views: number }) => setCurrentViews(d.views))
      .catch(() => {})
    fetch('/api/site/meta')
      .then((r) => r.json())
      .then((d: SiteMeta) => setSiteMeta(d))
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

  const loadFolders = async () => {
    setFoldersLoading(true)
    try {
      const res = await fetch('/api/drive/folders')
      const data = await res.json() as { folders: DriveFolder[]; currentFolder: string }
      setFolders(data.folders ?? [])
    } catch {
      msg.error('Không thể tải danh sách thư mục')
    } finally {
      setFoldersLoading(false)
    }
  }

  const saveFolder = async () => {
    setFolderSaving(true)
    try {
      await fetch('/api/site/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: currentFolder }),
      })
      msg.success('Đã lưu thư mục nội dung')
      setFolderSource('kv')
    } catch {
      msg.error('Không thể lưu')
    } finally {
      setFolderSaving(false)
    }
  }

  const saveBio = async (overrides?: { authorPhotoId?: string }) => {
    setBioSaving(true)
    try {
      await fetch('/api/site/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: bioQuote,
          bio: bioBio,
          bioDetail: bioBioDetail,
          authorPhotoId: overrides?.authorPhotoId ?? authorPhotoId,
        }),
      })
      msg.success('Đã lưu thông tin tác giả')
    } catch {
      msg.error('Không thể lưu')
    } finally {
      setBioSaving(false)
    }
  }

  const uploadImageToDrive = async (file: File, name: string): Promise<{ id: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)
    const res = await fetch('/api/drive/upload-image', { method: 'POST', body: formData })
    if (!res.ok) throw new Error(await res.text())
    return res.json() as Promise<{ id: string }>
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

  const saveViews = async () => {
    const n = parseInt(viewsInput.replace(/\D/g, ''), 10)
    if (isNaN(n) || n < 0) { msg.error('Số không hợp lệ'); return }
    setViewsSaving(true)
    try {
      const res = await fetch('/api/site/views', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ views: n }),
      })
      const d = await res.json() as { views: number }
      setCurrentViews(d.views)
      setViewsInput('')
      msg.success('Đã cập nhật lượt truy cập')
    } catch {
      msg.error('Không thể lưu')
    } finally {
      setViewsSaving(false)
    }
  }

  const saveMeta = async () => {
    setMetaSaving(true)
    try {
      await fetch('/api/site/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteMeta),
      })
      msg.success('Đã lưu cài đặt SEO & OG')
    } catch {
      msg.error('Không thể lưu')
    } finally {
      setMetaSaving(false)
    }
  }

  const bustCache = async () => {
    setBustingCache(true)
    try {
      await fetch('/api/admin/bust-cache', { method: 'POST' })
      msg.success('Đã xóa cache danh sách bài viết')
    } catch {
      msg.error('Không thể xóa cache')
    } finally {
      setBustingCache(false)
    }
  }

  const driveOk = drive?.connected && (!drive.expectedEmail || drive.email?.toLowerCase() === drive.expectedEmail.toLowerCase())
  const driveWrong = drive?.connected && drive.expectedEmail && drive.email?.toLowerCase() !== drive.expectedEmail.toLowerCase()

  return (
    <div>
      {ctxHolder}
      <Title level={4} style={{ marginBottom: 24 }}>Cài đặt hệ thống</Title>
      <Row gutter={[20, 0]} align="top">

      {/* ── Left column: infrastructure ──────────────── */}
      <Col xs={24} xl={12}>

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

      {/* ── Drive folder ─────────────────────────────── */}
      <Section title="Thư mục nội dung Drive" icon={<FolderOutlined />}>
        <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
          Tất cả bài viết, thơ và hình ảnh sẽ được lưu vào thư mục này trên Google Drive.
          {folderSource === 'env' && (
            <> Hiện đang dùng giá trị từ secret <Text code>GOOGLE_DRIVE_FOLDER_ID</Text>. Chọn thư mục bên dưới để ghi đè.</>
          )}
        </Paragraph>

        {currentFolder && (
          <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6, padding: '8px 14px', marginBottom: 12, fontSize: 12 }}>
            <Text type="secondary">ID thư mục hiện tại: </Text>
            <Text code>{currentFolder}</Text>
            {folderSource === 'env' && <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>từ secret</Tag>}
            {folderSource === 'kv' && <Tag color="green" style={{ marginLeft: 8, fontSize: 11 }}>đã cài</Tag>}
          </div>
        )}

        {!drive?.connected ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kết nối Google Drive trước để chọn thư mục.
          </Text>
        ) : (
          <>
            {/* Manual ID input */}
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Nhập ID thư mục</Text>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="Dán folder ID từ URL Google Drive..."
                  value={currentFolder}
                  onChange={(e) => setCurrentFolder(e.target.value.trim())}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
                <Button
                  type="primary"
                  loading={folderSaving}
                  onClick={saveFolder}
                  disabled={!currentFolder}
                  style={{ background: '#5d2e2e', borderColor: '#5d2e2e' }}
                >
                  Lưu
                </Button>
              </Space.Compact>
              <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                Lấy ID từ URL Drive: drive.google.com/drive/folders/<strong>{'<ID>'}</strong>
              </Text>
            </div>

            <Divider plain style={{ fontSize: 12, color: '#bbb', margin: '12px 0' }}>hoặc chọn từ danh sách</Divider>

            <Button
              icon={foldersLoading ? <Spin size="small" /> : <FolderOutlined />}
              onClick={loadFolders}
              disabled={foldersLoading}
              style={{ marginBottom: folders.length > 0 ? 12 : 0 }}
            >
              {foldersLoading ? 'Đang tải...' : 'Tải danh sách thư mục'}
            </Button>

            {folders.length > 0 && (
              <div>
                <Select
                  style={{ width: '100%', marginBottom: 12 }}
                  placeholder="-- Chọn thư mục --"
                  value={currentFolder || undefined}
                  onChange={(val) => setCurrentFolder(val)}
                  options={folders.map((f) => ({ value: f.id, label: f.name }))}
                  showSearch
                  filterOption={(input, opt) => (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
                />
                <Space>
                  <Button
                    type="primary"
                    loading={folderSaving}
                    onClick={saveFolder}
                    disabled={!currentFolder}
                    style={{ background: '#5d2e2e', borderColor: '#5d2e2e' }}
                  >
                    Lưu thư mục
                  </Button>
                  {currentFolder && (
                    <Button
                      onClick={async () => {
                        setCurrentFolder('')
                        setFolderSaving(true)
                        try {
                          await fetch('/api/site/folder', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ folderId: '' }),
                          })
                          msg.success('Đã xóa cài đặt thư mục')
                          setFolderSource('none')
                        } catch {
                          msg.error('Không thể xóa cài đặt')
                        } finally {
                          setFolderSaving(false)
                        }
                      }}
                    >
                      Bỏ cài đặt
                    </Button>
                  )}
                </Space>
              </div>
            )}
          </>
        )}
      </Section>

      {/* ── Cache ────────────────────────────────────── */}
      <Section title="Bộ nhớ đệm" icon={<ReloadOutlined />}>
        <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
          Danh sách bài viết được cache trong 60 giây để giảm tải Drive API. Nhấn nút bên dưới để xóa
          cache ngay lập tức — danh sách sẽ được tải mới từ Drive ở lần truy cập tiếp theo.
        </Paragraph>
        <Button
          icon={<ReloadOutlined />}
          loading={bustingCache}
          onClick={bustCache}
        >
          Xóa cache danh sách bài viết
        </Button>
      </Section>

      </Col>{/* end left column */}

      {/* ── Right column: content & SEO ──────────────── */}
      <Col xs={24} xl={12}>

      {/* ── SEO & OG Metadata ────────────────────────── */}
      <Section title="SEO & OG Metadata" icon={<SearchOutlined />}>
        <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
          Thẻ meta và Open Graph cho trang chủ và các trang listing. Trang bài viết có OG riêng từ nội dung.
        </Paragraph>

        <div style={{ marginBottom: 14 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Tên trang (og:site_name)</Text>
          <Input value={siteMeta.siteTitle} onChange={(e) => setSiteMeta((p) => ({ ...p, siteTitle: e.target.value }))} placeholder="Dương Thanh Biểu" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>og:locale</Text>
          <Input value={siteMeta.locale} onChange={(e) => setSiteMeta((p) => ({ ...p, locale: e.target.value }))} placeholder="vi_VN" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Twitter/X handle (twitter:site)</Text>
          <Input value={siteMeta.twitterSite} onChange={(e) => setSiteMeta((p) => ({ ...p, twitterSite: e.target.value }))} placeholder="@handle" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Ảnh OG mặc định (og:image)</Text>
          {siteMeta.ogImage && (
            <img
              src={siteMeta.ogImage}
              alt="OG preview"
              style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 6, marginBottom: 8, border: '1px solid #f0f0f0' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          <Space.Compact style={{ width: '100%' }}>
            <Input value={siteMeta.ogImage} onChange={(e) => setSiteMeta((p) => ({ ...p, ogImage: e.target.value }))} placeholder="https://... hoặc tải lên →" />
            <Upload
              accept="image/*"
              showUploadList={false}
              customRequest={async ({ file }) => {
                setUploadingOgImage(true)
                try {
                  const { id } = await uploadImageToDrive(file as File, 'og-image-default')
                  setSiteMeta((p) => ({ ...p, ogImage: `/api/drive/image?id=${id}` }))
                  msg.success('Đã tải lên ảnh OG. Nhấn Lưu SEO & OG để áp dụng.')
                } catch {
                  msg.error('Không thể tải lên ảnh')
                } finally {
                  setUploadingOgImage(false)
                }
              }}
            >
              <Button icon={uploadingOgImage ? <LoadingOutlined /> : <UploadOutlined />} />
            </Upload>
          </Space.Compact>
          <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>Dùng cho trang không có ảnh riêng. URL hoặc tải lên từ máy.</Text>
        </div>

        <Divider plain style={{ fontSize: 12, color: '#bbb', margin: '8px 0 14px' }}>Trang chủ</Divider>

        <div style={{ marginBottom: 14 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>{'<title>'} trang chủ</Text>
          <Input value={siteMeta.homeTitle} onChange={(e) => setSiteMeta((p) => ({ ...p, homeTitle: e.target.value }))} placeholder="Dương Thanh Biểu — Nhà văn, Nhà thơ" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Meta description trang chủ</Text>
          <TextArea
            value={siteMeta.homeDescription}
            onChange={(e) => setSiteMeta((p) => ({ ...p, homeDescription: e.target.value }))}
            rows={2}
            placeholder="Mô tả ngắn hiển thị trên kết quả Google..."
            maxLength={160}
            showCount
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>og:image trang chủ (tuỳ chọn)</Text>
          <Input value={siteMeta.homeOgImage} onChange={(e) => setSiteMeta((p) => ({ ...p, homeOgImage: e.target.value }))} placeholder="Để trống = dùng ảnh OG mặc định" />
        </div>

        <Divider plain style={{ fontSize: 12, color: '#bbb', margin: '8px 0 14px' }}>Các trang còn lại</Divider>

        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Meta description mặc định</Text>
          <TextArea
            value={siteMeta.siteDescription}
            onChange={(e) => setSiteMeta((p) => ({ ...p, siteDescription: e.target.value }))}
            rows={2}
            placeholder="Mô tả mặc định cho trang listing (văn thơ, nghệ thuật, video...)..."
            maxLength={160}
            showCount
          />
        </div>

        <Button
          type="primary"
          loading={metaSaving}
          onClick={saveMeta}
          style={{ background: '#7c3535', borderColor: '#7c3535' }}
        >
          Lưu SEO & OG
        </Button>
      </Section>

      {/* ── Author bio ───────────────────────────────── */}
      <Section title="Thông tin tác giả" icon={<UserOutlined />}>
        <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 20 }}>
          Nội dung hiển thị trên trang chủ. Thay đổi sẽ có hiệu lực ngay sau khi lưu.
        </Paragraph>

        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>Ảnh tác giả</Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 8, overflow: 'hidden',
              border: '1px solid #f0f0f0', background: '#fafafa',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {authorPhotoId ? (
                <img
                  src={`/api/drive/thumb?id=${authorPhotoId}`}
                  alt="Author"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <UserOutlined style={{ fontSize: 28, color: '#ccc' }} />
              )}
            </div>
            <div>
              <Upload
                accept="image/*"
                showUploadList={false}
                customRequest={async ({ file }) => {
                  setUploadingPhoto(true)
                  try {
                    const { id } = await uploadImageToDrive(file as File, 'author-photo')
                    setAuthorPhotoId(id)
                    await saveBio({ authorPhotoId: id })
                  } catch {
                    msg.error('Không thể tải lên ảnh')
                  } finally {
                    setUploadingPhoto(false)
                  }
                }}
              >
                <Button icon={uploadingPhoto ? <LoadingOutlined /> : <UploadOutlined />} loading={uploadingPhoto}>
                  {authorPhotoId ? 'Thay ảnh' : 'Tải lên ảnh tác giả'}
                </Button>
              </Upload>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
                Hiển thị ở section giới thiệu tác giả. Tải lên tự động lưu.
              </Text>
            </div>
          </div>
        </div>

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
          onClick={() => saveBio()}
          style={{ background: '#7c3535', borderColor: '#7c3535' }}
        >
          Lưu thông tin
        </Button>
      </Section>

      {/* ── View counter ─────────────────────────────── */}
      <Section title="Lượt truy cập" icon={<EyeOutlined />}>
        <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
          Hiển thị ở chân trang website. Hệ thống tự động đếm mỗi lượt tải trang.
          Nhập số mới để đặt lại bộ đếm về giá trị mong muốn.
        </Paragraph>

        {currentViews !== null && (
          <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>Hiện tại: </Text>
            <Text strong style={{ fontSize: 16 }}>{currentViews.toLocaleString('vi-VN')}</Text>
          </div>
        )}

        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="Nhập số lượt truy cập mới..."
            value={viewsInput}
            onChange={(e) => setViewsInput(e.target.value)}
            onPressEnter={saveViews}
            style={{ fontSize: 14 }}
          />
          <Button
            type="primary"
            loading={viewsSaving}
            onClick={saveViews}
            disabled={!viewsInput}
            style={{ background: '#5d2e2e', borderColor: '#5d2e2e' }}
          >
            Cập nhật
          </Button>
        </Space.Compact>
      </Section>

      </Col>{/* end right column */}
      </Row>
    </div>
  )
}
