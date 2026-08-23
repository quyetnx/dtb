import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import LiteraturePage from './pages/LiteraturePage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import PoemDetailPage from './pages/PoemDetailPage'
import ArtsCulturePage from './pages/ArtsCulturePage'
import VideoPage from './pages/VideoPage'
import VideoDetailPage from './pages/VideoDetailPage'
import NewsPage from './pages/NewsPage'
import NewsDetailPage from './pages/NewsDetailPage'
import ComingSoonPage from './pages/ComingSoonPage'

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminLoginPage = lazy(() => import('./pages/admin/LoginPage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const VanXuoiPage = lazy(() => import('./pages/admin/VanXuoiPage'))
const ThoPage = lazy(() => import('./pages/admin/ThoPage'))
const NgheThuatPage = lazy(() => import('./pages/admin/NgheThuatPage'))
const HinhAnhPage = lazy(() => import('./pages/admin/HinhAnhPage'))
const AdminVideoPage = lazy(() => import('./pages/admin/VideoPage'))
const TinTucPage = lazy(() => import('./pages/admin/TinTucPage'))
const AdsPage = lazy(() => import('./pages/admin/AdsPage'))
const ContentFormPage = lazy(() => import('./pages/admin/ContentFormPage'))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'))

const VAN_XUOI_CATS = ['Tiểu thuyết', 'Truyện ngắn', 'Truyện ký', 'Tùy bút', 'Ký sự']
const NGHE_THUAT_CATS = ['Phê bình văn học', 'Nghệ thuật', 'Âm nhạc', 'Văn hóa', 'Mỹ thuật', 'Kiến trúc']
const TIN_TUC_CATS = ['Thời sự', 'Sự kiện', 'Thông báo', 'Hoạt động', 'Giải thưởng']

function AdminSpinner() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#999', fontFamily: 'system-ui' }}>Đang tải...</div>
    </div>
  )
}

export default function App() {
  const [sitePublic, setSitePublic] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/site/status')
      .then((r) => r.json())
      .then((d: { public: boolean }) => setSitePublic(d.public))
      .catch(() => setSitePublic(false))
  }, [])

  if (sitePublic === null) return null

  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes — no navbar/footer, lazy-loaded */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<AdminSpinner />}>
              <AdminLoginPage />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<AdminSpinner />}>
              <AdminLayout />
            </Suspense>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<AdminSpinner />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="van-xuoi"
            element={<Suspense fallback={<AdminSpinner />}><VanXuoiPage /></Suspense>}
          />
          <Route
            path="van-xuoi/new"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <ContentFormPage contentType="van-xuoi" pageTitle="Văn xuôi" backPath="/admin/van-xuoi" categoryOptions={VAN_XUOI_CATS} />
              </Suspense>
            }
          />
          <Route
            path="van-xuoi/:id"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <ContentFormPage contentType="van-xuoi" pageTitle="Văn xuôi" backPath="/admin/van-xuoi" categoryOptions={VAN_XUOI_CATS} />
              </Suspense>
            }
          />
          <Route
            path="tho"
            element={<Suspense fallback={<AdminSpinner />}><ThoPage /></Suspense>}
          />
          <Route
            path="tho/new"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <ContentFormPage contentType="tho" pageTitle="Thơ" backPath="/admin/tho" />
              </Suspense>
            }
          />
          <Route
            path="tho/:id"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <ContentFormPage contentType="tho" pageTitle="Thơ" backPath="/admin/tho" />
              </Suspense>
            }
          />
          <Route
            path="nghe-thuat"
            element={<Suspense fallback={<AdminSpinner />}><NgheThuatPage /></Suspense>}
          />
          <Route
            path="nghe-thuat/new"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <ContentFormPage contentType="nghe-thuat" pageTitle="Nghệ thuật" backPath="/admin/nghe-thuat" categoryOptions={NGHE_THUAT_CATS} />
              </Suspense>
            }
          />
          <Route
            path="nghe-thuat/:id"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <ContentFormPage contentType="nghe-thuat" pageTitle="Nghệ thuật" backPath="/admin/nghe-thuat" categoryOptions={NGHE_THUAT_CATS} />
              </Suspense>
            }
          />
          <Route
            path="hinh-anh"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <HinhAnhPage />
              </Suspense>
            }
          />
          <Route
            path="video"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <AdminVideoPage />
              </Suspense>
            }
          />
          <Route
            path="tin-tuc"
            element={<Suspense fallback={<AdminSpinner />}><TinTucPage /></Suspense>}
          />
          <Route
            path="tin-tuc/new"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <ContentFormPage contentType="tin-tuc" pageTitle="Tin tức" backPath="/admin/tin-tuc" categoryOptions={TIN_TUC_CATS} />
              </Suspense>
            }
          />
          <Route
            path="tin-tuc/:id"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <ContentFormPage contentType="tin-tuc" pageTitle="Tin tức" backPath="/admin/tin-tuc" categoryOptions={TIN_TUC_CATS} />
              </Suspense>
            }
          />
          <Route
            path="quang-cao"
            element={<Suspense fallback={<AdminSpinner />}><AdsPage /></Suspense>}
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<AdminSpinner />}>
                <SettingsPage />
              </Suspense>
            }
          />
        </Route>

        {/* Public routes */}
        <Route
          path="*"
          element={
            sitePublic ? (
              <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-paper-ivory)' }}>
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/van-tho" element={<LiteraturePage />} />
                    <Route path="/van-tho/:slug" element={<ArticleDetailPage />} />
                    <Route path="/tho/:slug" element={<PoemDetailPage />} />
                    <Route path="/nghe-thuat-van-hoa" element={<ArtsCulturePage />} />
                    <Route path="/video" element={<VideoPage />} />
                    <Route path="/video/:id" element={<VideoDetailPage />} />
                    <Route path="/tin-tuc" element={<NewsPage />} />
                    <Route path="/tin-tuc/:slug" element={<NewsDetailPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            ) : (
              <ComingSoonPage />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

function NotFound() {
  return (
    <div className="container-main section-gap text-center">
      <p className="text-label" style={{ color: 'var(--color-charcoal-muted)' }}>404</p>
      <h1 className="text-display-lg mt-4" style={{ color: 'var(--color-charcoal)' }}>
        Trang không tìm thấy
      </h1>
      <p className="text-body-md mt-4" style={{ color: 'var(--color-charcoal-muted)' }}>
        Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <a
        href="/"
        className="inline-block mt-8 px-6 py-3 font-ui text-sm font-medium text-white rounded"
        style={{ backgroundColor: 'var(--color-oxblood)' }}
      >
        Về trang chủ
      </a>
    </div>
  )
}
