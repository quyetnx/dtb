import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import LiteraturePage from './pages/LiteraturePage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import PoemDetailPage from './pages/PoemDetailPage'
import ArtsCulturePage from './pages/ArtsCulturePage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-paper-ivory)' }}>
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/van-tho" element={<LiteraturePage />} />
            <Route path="/van-tho/:slug" element={<ArticleDetailPage />} />
            <Route path="/tho/:slug" element={<PoemDetailPage />} />
            <Route path="/nghe-thuat-van-hoa" element={<ArtsCulturePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
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
