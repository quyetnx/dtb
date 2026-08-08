import { Link } from 'react-router-dom'

const AUTHOR_PHOTO = 'https://hoduongvietnam.com.vn/uploads/images/duong-thanh-bieu(1).png'

const featuredArticles = [
  {
    slug: 'hoi-ky-tu-nguoi-can-bo-tu-chinh-tri',
    category: 'Hồi ký',
    title: 'Hồi ký từ người cán bộ tù chính trị',
    excerpt:
      'Những trang hồi ký chân thực ghi lại ký ức về những năm tháng gian khổ, về tình đồng chí và lý tưởng cách mạng không bao giờ tắt.',
    date: '15 tháng 7, 2024',
    readTime: '12 phút đọc',
  },
  {
    slug: 'bien-xanh-trong-ky-uc',
    category: 'Truyện ngắn',
    title: 'Biển xanh trong ký ức',
    excerpt:
      'Một câu chuyện về tuổi thơ, về biển cả và những kỷ niệm không thể phai mờ theo năm tháng.',
    date: '3 tháng 6, 2024',
    readTime: '8 phút đọc',
  },
  {
    slug: 'dat-que-huong',
    category: 'Tùy bút',
    title: 'Đất quê hương',
    excerpt:
      'Tùy bút về tình yêu quê hương, về mảnh đất miền Trung nghèo khó nhưng đầy nghĩa tình.',
    date: '20 tháng 5, 2024',
    readTime: '6 phút đọc',
  },
]

const featuredPoems = [
  {
    slug: 'que-huong-chieu-ta',
    title: 'Quê hương chiều tà',
    preview: 'Chiều về trên mái ngói rêu phong\nKhói lam tỏa nhẹ qua vườn cũ...',
    date: 'Tháng 7, 2024',
  },
  {
    slug: 'nho-me',
    title: 'Nhớ mẹ',
    preview: 'Con về tìm lại bóng người xưa\nDấu chân mẹ in trên sân nhà...',
    date: 'Tháng 6, 2024',
  },
  {
    slug: 'song-que',
    title: 'Sông quê',
    preview: 'Dòng sông tuổi thơ vẫn chảy hoài\nĐem theo ký ức những ngày dài...',
    date: 'Tháng 5, 2024',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="section-gap" style={{ borderBottom: '1px solid var(--color-muted-border)' }}>
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Text */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <p className="text-label mb-6" style={{ color: 'var(--color-oxblood)' }}>
                Nhà văn · Nhà thơ · Hồi ký
              </p>
              <h1 className="text-display-xl" style={{ color: 'var(--color-charcoal)' }}>
                Dương Thanh Biểu
              </h1>
              <p
                className="text-display-sm mt-2 font-display italic"
                style={{ color: 'var(--color-charcoal-muted)', fontWeight: 400 }}
              >
                Văn học & Thi ca
              </p>

              <blockquote
                className="mt-10 pl-5 text-body-lg italic"
                style={{
                  color: 'var(--color-charcoal-muted)',
                  borderLeft: '3px solid var(--color-oxblood)',
                }}
              >
                "Văn chương là cầu nối giữa tâm hồn con người với con người, giữa quá khứ và
                hiện tại, giữa đau thương và hy vọng."
              </blockquote>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/van-tho"
                  className="inline-flex items-center gap-2 px-6 py-3 text-label text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-oxblood)', borderRadius: '2px' }}
                >
                  Khám phá tác phẩm
                  <span className="material-symbols-outlined text-[1em]">arrow_forward</span>
                </Link>
                <Link
                  to="/nghe-thuat-van-hoa"
                  className="inline-flex items-center gap-2 px-6 py-3 text-label transition-colors"
                  style={{
                    color: 'var(--color-charcoal)',
                    border: '1px solid var(--color-muted-border)',
                    borderRadius: '2px',
                  }}
                >
                  Nghệ thuật & Văn hóa
                </Link>
              </div>
            </div>

            {/* Portrait */}
            <div className="lg:col-span-5 order-1 lg:order-2">
              <div
                className="relative overflow-hidden"
                style={{ aspectRatio: '3/4', borderRadius: '2px', backgroundColor: 'var(--color-paper-ivory-dark)' }}
              >
                <img
                  src={AUTHOR_PHOTO}
                  alt="Dương Thanh Biểu"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Literature — text-only cards */}
      <section className="section-gap">
        <div className="container-main">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-label mb-2" style={{ color: 'var(--color-oxblood)' }}>
                Tác phẩm nổi bật
              </p>
              <h2 className="text-display-md" style={{ color: 'var(--color-charcoal)' }}>
                Văn xuôi
              </h2>
            </div>
            <Link
              to="/van-tho"
              className="hidden md:inline-flex items-center gap-1 text-label transition-colors hover:text-[var(--color-charcoal)]"
              style={{ color: 'var(--color-charcoal-muted)' }}
            >
              Xem tất cả
              <span className="material-symbols-outlined text-[1em]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {featuredArticles.map((article, i) => (
              <Link
                key={article.slug}
                to={`/van-tho/${article.slug}`}
                className="group block card-hover p-8"
                style={{
                  borderTop: '1px solid var(--color-muted-border)',
                  borderLeft: i > 0 ? '1px solid var(--color-muted-border)' : 'none',
                }}
              >
                <p className="text-label" style={{ color: 'var(--color-oxblood)' }}>
                  {article.category}
                </p>
                <h3
                  className="text-display-sm mt-3 transition-colors group-hover:text-[var(--color-oxblood)]"
                  style={{ color: 'var(--color-charcoal)' }}
                >
                  {article.title}
                </h3>
                <p className="text-body-md mt-3" style={{ color: 'var(--color-charcoal-muted)' }}>
                  {article.excerpt}
                </p>
                <div
                  className="flex items-center gap-3 mt-6 text-label"
                  style={{ color: 'var(--color-charcoal-muted)' }}
                >
                  <span>{article.date}</span>
                  <span>·</span>
                  <span>{article.readTime}</span>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ height: '1px', backgroundColor: 'var(--color-muted-border)' }} />
        </div>
      </section>

      {/* Divider */}
      <div className="container-main">
        <div style={{ height: '1px', backgroundColor: 'var(--color-muted-border)' }} />
      </div>

      {/* Featured Poems */}
      <section className="section-gap">
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-3">
              <p className="text-label mb-2" style={{ color: 'var(--color-oxblood)' }}>
                Thi ca
              </p>
              <h2 className="text-display-md" style={{ color: 'var(--color-charcoal)' }}>
                Thơ gần đây
              </h2>
              <p className="text-body-md mt-4" style={{ color: 'var(--color-charcoal-muted)' }}>
                Những vần thơ ghi lại cảm xúc, kỷ niệm và suy ngẫm về cuộc đời.
              </p>
              <Link
                to="/van-tho"
                className="inline-flex items-center gap-1 mt-6 text-label transition-colors hover:text-[var(--color-charcoal)]"
                style={{ color: 'var(--color-oxblood)' }}
              >
                Xem tất cả thơ
                <span className="material-symbols-outlined text-[1em]">arrow_forward</span>
              </Link>
            </div>

            <div className="lg:col-span-9">
              <div className="flex flex-col" style={{ borderTop: '1px solid var(--color-muted-border)' }}>
                {featuredPoems.map((poem) => (
                  <Link
                    key={poem.slug}
                    to={`/tho/${poem.slug}`}
                    className="group py-8 flex gap-8 items-start"
                    style={{ borderBottom: '1px solid var(--color-muted-border)' }}
                  >
                    <div className="flex-1">
                      <h3
                        className="text-display-sm transition-colors group-hover:text-[var(--color-oxblood)]"
                        style={{ color: 'var(--color-charcoal)' }}
                      >
                        {poem.title}
                      </h3>
                      <p
                        className="poem-content mt-3 text-sm"
                        style={{ textAlign: 'left', fontSize: '1rem' }}
                      >
                        {poem.preview}
                      </p>
                      <p className="text-label mt-4" style={{ color: 'var(--color-charcoal-muted)' }}>
                        {poem.date}
                      </p>
                    </div>
                    <span
                      className="material-symbols-outlined text-xl mt-1 transition-transform group-hover:translate-x-1"
                      style={{ color: 'var(--color-muted-border)' }}
                    >
                      arrow_forward
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About banner */}
      <section
        className="section-gap"
        style={{ backgroundColor: 'var(--color-oxblood)', color: 'white' }}
      >
        <div className="container-main text-center">
          <p className="text-label mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Về tác giả
          </p>
          <h2 className="text-display-lg" style={{ color: 'white', maxWidth: '720px', margin: '0 auto' }}>
            Dương Thanh Biểu là nhà văn, nhà thơ người Việt Nam với hơn bốn thập kỷ cầm bút
          </h2>
          <p
            className="text-body-lg mt-6 mx-auto"
            style={{ color: 'rgba(255,255,255,0.8)', maxWidth: '600px' }}
          >
            Tác phẩm của ông phản ánh sâu sắc hiện thực lịch sử, tình người và quê hương đất
            nước qua từng giai đoạn của dân tộc.
          </p>
        </div>
      </section>
    </>
  )
}
