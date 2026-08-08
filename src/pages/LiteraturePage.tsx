import { useState } from 'react'
import { Link } from 'react-router-dom'

const categories = ['Tất cả', 'Tiểu thuyết', 'Truyện ngắn', 'Thơ', 'Hồi ký', 'Tùy bút']

const works = [
  {
    slug: 'hoi-ky-tu-nguoi-can-bo-tu-chinh-tri',
    type: 'article',
    category: 'Hồi ký',
    title: 'Hồi ký từ người cán bộ tù chính trị',
    excerpt: 'Những trang hồi ký chân thực ghi lại ký ức về những năm tháng gian khổ, về tình đồng chí và lý tưởng cách mạng không bao giờ tắt.',
    date: '15 tháng 7, 2024',
    readTime: '12 phút đọc',
    image: 'https://hoduongvietnam.com.vn/uploads/images/duong-thanh-bieu(1).png',
    featured: true,
  },
  {
    slug: 'bien-xanh-trong-ky-uc',
    type: 'article',
    category: 'Truyện ngắn',
    title: 'Biển xanh trong ký ức',
    excerpt: 'Một câu chuyện về tuổi thơ, về biển cả và những kỷ niệm không thể phai mờ.',
    date: '3 tháng 6, 2024',
    readTime: '8 phút đọc',
    image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&q=80',
    featured: false,
  },
  {
    slug: 'que-huong-chieu-ta',
    type: 'poem',
    category: 'Thơ',
    title: 'Quê hương chiều tà',
    excerpt: 'Chiều về trên mái ngói rêu phong\nKhói lam tỏa nhẹ qua vườn cũ...',
    date: 'Tháng 7, 2024',
    readTime: '3 phút đọc',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80',
    featured: false,
  },
  {
    slug: 'dat-que-huong',
    type: 'article',
    category: 'Tùy bút',
    title: 'Đất quê hương',
    excerpt: 'Tùy bút về tình yêu quê hương, về mảnh đất miền Trung nghèo khó nhưng đầy nghĩa tình.',
    date: '20 tháng 5, 2024',
    readTime: '6 phút đọc',
    image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800&q=80',
    featured: false,
  },
  {
    slug: 'nho-me',
    type: 'poem',
    category: 'Thơ',
    title: 'Nhớ mẹ',
    excerpt: 'Con về tìm lại bóng người xưa\nDấu chân mẹ in trên sân nhà...',
    date: 'Tháng 6, 2024',
    readTime: '2 phút đọc',
    image: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=800&q=80',
    featured: false,
  },
  {
    slug: 'tieu-thuyet-ve-que-huong',
    type: 'article',
    category: 'Tiểu thuyết',
    title: 'Về quê hương — trích đoạn',
    excerpt: 'Những trang văn đầy cảm xúc về hành trình trở về quê hương sau nhiều năm xa cách.',
    date: '10 tháng 4, 2024',
    readTime: '15 phút đọc',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
    featured: false,
  },
  {
    slug: 'song-que',
    type: 'poem',
    category: 'Thơ',
    title: 'Sông quê',
    excerpt: 'Dòng sông tuổi thơ vẫn chảy hoài\nĐem theo ký ức những ngày dài...',
    date: 'Tháng 5, 2024',
    readTime: '2 phút đọc',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    featured: false,
  },
  {
    slug: 'nguoi-ban-chien-truong',
    type: 'article',
    category: 'Hồi ký',
    title: 'Người bạn chiến trường',
    excerpt: 'Kỷ niệm về người đồng đội đã cùng chia sẻ những năm tháng gian khổ nhất của cuộc đời.',
    date: '28 tháng 3, 2024',
    readTime: '10 phút đọc',
    image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&q=80',
    featured: false,
  },
]

export default function LiteraturePage() {
  const [activeCategory, setActiveCategory] = useState('Tất cả')

  const filtered = activeCategory === 'Tất cả'
    ? works
    : works.filter((w) => w.category === activeCategory)

  const [featured, ...rest] = filtered

  return (
    <>
      {/* Page header */}
      <div
        className="py-16"
        style={{ borderBottom: '1px solid var(--color-muted-border)' }}
      >
        <div className="container-main">
          <p className="text-label mb-3" style={{ color: 'var(--color-oxblood)' }}>
            Tuyển tập
          </p>
          <h1 className="text-display-lg" style={{ color: 'var(--color-charcoal)' }}>
            Văn Thơ
          </h1>
          <p className="text-body-lg mt-4" style={{ color: 'var(--color-charcoal-muted)', maxWidth: '480px' }}>
            Toàn bộ tác phẩm văn học, thơ ca và tùy bút của Dương Thanh Biểu.
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div
        className="sticky top-16 z-40 py-4"
        style={{
          backgroundColor: 'var(--color-paper-ivory)',
          borderBottom: '1px solid var(--color-muted-border)',
        }}
      >
        <div className="container-main">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="shrink-0 px-4 py-2 text-label transition-colors"
                style={{
                  borderRadius: '2px',
                  backgroundColor: activeCategory === cat ? 'var(--color-oxblood)' : 'transparent',
                  color: activeCategory === cat ? 'white' : 'var(--color-charcoal-muted)',
                  border: `1px solid ${activeCategory === cat ? 'var(--color-oxblood)' : 'var(--color-muted-border)'}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-main section-gap">
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-body-md" style={{ color: 'var(--color-charcoal-muted)' }}>
              Không có tác phẩm nào trong danh mục này.
            </p>
          </div>
        ) : (
          <>
            {/* Featured work */}
            {featured && (
              <Link
                to={featured.type === 'poem' ? `/tho/${featured.slug}` : `/van-tho/${featured.slug}`}
                className="group grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 pb-16 card-hover block"
                style={{ borderBottom: '1px solid var(--color-muted-border)' }}
              >
                <div className="overflow-hidden" style={{ borderRadius: '2px', aspectRatio: '16/10' }}>
                  <img
                    src={featured.image}
                    alt={featured.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-label" style={{ color: 'var(--color-oxblood)' }}>
                    {featured.category} · Nổi bật
                  </p>
                  <h2
                    className="text-display-md mt-3 transition-colors group-hover:text-[var(--color-oxblood)]"
                    style={{ color: 'var(--color-charcoal)' }}
                  >
                    {featured.title}
                  </h2>
                  <p className="text-body-md mt-4" style={{ color: 'var(--color-charcoal-muted)' }}>
                    {featured.excerpt}
                  </p>
                  <div
                    className="flex items-center gap-3 mt-6 text-label"
                    style={{ color: 'var(--color-charcoal-muted)' }}
                  >
                    <span>{featured.date}</span>
                    <span>·</span>
                    <span>{featured.readTime}</span>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {rest.map((work) => (
                <Link
                  key={work.slug}
                  to={work.type === 'poem' ? `/tho/${work.slug}` : `/van-tho/${work.slug}`}
                  className="group block card-hover"
                >
                  <div className="overflow-hidden" style={{ borderRadius: '2px', aspectRatio: '4/3' }}>
                    <img
                      src={work.image}
                      alt={work.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-4">
                    <p className="text-label" style={{ color: 'var(--color-oxblood)' }}>
                      {work.category}
                    </p>
                    <h3
                      className="text-display-sm mt-2 transition-colors group-hover:text-[var(--color-oxblood)]"
                      style={{ color: 'var(--color-charcoal)' }}
                    >
                      {work.title}
                    </h3>
                    <div
                      className="flex items-center gap-3 mt-3 text-label"
                      style={{ color: 'var(--color-charcoal-muted)' }}
                    >
                      <span>{work.date}</span>
                      <span>·</span>
                      <span>{work.readTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
