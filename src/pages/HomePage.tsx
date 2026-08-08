import { Link } from 'react-router-dom'

const featuredArticles = [
  {
    slug: 'hoi-ky-tu-nguoi-can-bo-tu-chinh-tri',
    category: 'Hồi ký',
    title: 'Hồi ký từ người cán bộ tù chính trị',
    excerpt:
      'Những trang hồi ký chân thực ghi lại ký ức về những năm tháng gian khổ, về tình đồng chí và lý tưởng cách mạng không bao giờ tắt.',
    date: '15 tháng 7, 2024',
    readTime: '12 phút đọc',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  },
  {
    slug: 'bien-xanh-trong-ky-uc',
    category: 'Truyện ngắn',
    title: 'Biển xanh trong ký ức',
    excerpt:
      'Một câu chuyện về tuổi thơ, về biển cả và những kỷ niệm không thể phai mờ theo năm tháng.',
    date: '3 tháng 6, 2024',
    readTime: '8 phút đọc',
    image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&q=80',
  },
  {
    slug: 'dat-que-huong',
    category: 'Tùy bút',
    title: 'Đất quê hương',
    excerpt:
      'Tùy bút về tình yêu quê hương, về mảnh đất miền Trung nghèo khó nhưng đầy nghĩa tình.',
    date: '20 tháng 5, 2024',
    readTime: '6 phút đọc',
    image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800&q=80',
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
                  color: 'var(--color-charcoal-light)',
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
                  className="inline-flex items-center gap-2 px-6 py-3 text-label transition-colors hover:bg-[var(--color-muted-border-light)]"
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
                style={{ aspectRatio: '3/4', borderRadius: '2px' }}
              >
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80"
                  alt="Dương Thanh Biểu"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(45,45,45,0.4) 0%, transparent 50%)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Literature */}
      <section className="section-gap">
        <div className="container-main">
          {/* Section header */}
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

          {/* Articles grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredArticles.map((article, i) => (
              <Link
                key={article.slug}
                to={`/van-tho/${article.slug}`}
                className="group block card-hover"
              >
                <div className="overflow-hidden" style={{ borderRadius: '2px', aspectRatio: '4/3' }}>
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-4">
                  <p className="text-label" style={{ color: 'var(--color-oxblood)' }}>
                    {article.category}
                  </p>
                  <h3
                    className="text-display-sm mt-2 transition-colors group-hover:text-[var(--color-oxblood)]"
                    style={{ color: 'var(--color-charcoal)' }}
                  >
                    {article.title}
                  </h3>
                  {i === 0 && (
                    <p className="text-body-md mt-2" style={{ color: 'var(--color-charcoal-muted)' }}>
                      {article.excerpt}
                    </p>
                  )}
                  <div
                    className="flex items-center gap-3 mt-3 text-label"
                    style={{ color: 'var(--color-charcoal-muted)' }}
                  >
                    <span>{article.date}</span>
                    <span>·</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
            {/* Section header */}
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

            {/* Poems list */}
            <div className="lg:col-span-9">
              <div className="flex flex-col divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'var(--color-muted-border)' } as React.CSSProperties}>
                {featuredPoems.map((poem) => (
                  <Link
                    key={poem.slug}
                    to={`/tho/${poem.slug}`}
                    className="group py-8 first:pt-0 last:pb-0 flex gap-8 items-start"
                    style={{ borderColor: 'var(--color-muted-border)' }}
                  >
                    <div className="flex-1">
                      <h3
                        className="text-display-sm transition-colors group-hover:text-[var(--color-oxblood)]"
                        style={{ color: 'var(--color-charcoal)' }}
                      >
                        {poem.title}
                      </h3>
                      <p
                        className="poem-content text-left mt-3 text-sm"
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
