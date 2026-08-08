// Link imported for potential future use; articles currently use div with cursor-pointer


const heroArticle = {
  title: 'Văn học miền Trung — Bản sắc và sức sống',
  subtitle: 'Một góc nhìn về nền văn học của dải đất miền Trung Việt Nam qua các thế kỷ',
  date: '5 tháng 7, 2024',
  readTime: '15 phút đọc',
  image: 'https://images.unsplash.com/photo-1476362174823-3a23f4aa6d76?w=1400&q=80',
  excerpt:
    'Văn học miền Trung Việt Nam mang trong mình một bản sắc riêng biệt, được hun đúc qua hàng thế kỷ lịch sử — từ những áng thơ về non nước hùng vĩ đến những trang văn ghi lại cuộc sống giản dị nhưng đầy nghĩa tình của người dân đất miền Trung.',
}

const articles = [
  {
    title: 'Thơ Việt Nam hiện đại — Giữa truyền thống và đổi mới',
    category: 'Phê bình văn học',
    date: '28 tháng 6, 2024',
    readTime: '10 phút đọc',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80',
    excerpt: 'Thơ Việt Nam thế kỷ XX là một hành trình tìm kiếm, thử nghiệm và sáng tạo không ngừng.',
  },
  {
    title: 'Nghệ thuật thư pháp Việt — Di sản cần bảo tồn',
    category: 'Nghệ thuật',
    date: '15 tháng 6, 2024',
    readTime: '7 phút đọc',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80',
    excerpt: 'Thư pháp không chỉ là nghệ thuật viết chữ đẹp, mà còn là sự truyền tải tâm hồn người viết.',
  },
  {
    title: 'Âm nhạc dân gian — Tiếng lòng người Việt',
    category: 'Âm nhạc',
    date: '3 tháng 6, 2024',
    readTime: '8 phút đọc',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
    excerpt: 'Từ những điệu hò, câu ca dao đến các làn điệu dân ca, âm nhạc dân gian Việt Nam là kho tàng vô giá.',
  },
  {
    title: 'Ẩm thực miền Trung trong văn học',
    category: 'Văn hóa',
    date: '20 tháng 5, 2024',
    readTime: '6 phút đọc',
    image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&q=80',
    excerpt: 'Ẩm thực không chỉ là chuyện ăn uống, mà còn là một phần không thể tách rời của văn hóa vùng đất.',
  },
  {
    title: 'Hội họa Việt Nam thế kỷ XX',
    category: 'Mỹ thuật',
    date: '10 tháng 5, 2024',
    readTime: '9 phút đọc',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&q=80',
    excerpt: 'Từ trường Mỹ thuật Đông Dương đến các thế hệ họa sĩ đương đại — hành trình của hội họa Việt.',
  },
  {
    title: 'Kiến trúc đình làng — Hồn quê trong từng mái đình',
    category: 'Kiến trúc',
    date: '28 tháng 4, 2024',
    readTime: '11 phút đọc',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    excerpt: 'Đình làng là trung tâm văn hóa, tâm linh và cộng đồng của người Việt từ ngàn xưa.',
  },
]

export default function ArtsCulturePage() {
  return (
    <>
      {/* Page header */}
      <div
        className="py-16"
        style={{ borderBottom: '1px solid var(--color-muted-border)' }}
      >
        <div className="container-main">
          <p className="text-label mb-3" style={{ color: 'var(--color-oxblood)' }}>
            Chuyên trang
          </p>
          <h1 className="text-display-lg" style={{ color: 'var(--color-charcoal)' }}>
            Nghệ thuật & Văn hóa
          </h1>
          <p
            className="text-body-lg mt-4"
            style={{ color: 'var(--color-charcoal-muted)', maxWidth: '480px' }}
          >
            Khám phá thế giới nghệ thuật, văn hóa và di sản Việt Nam qua lăng kính văn học.
          </p>
        </div>
      </div>

      <div className="container-main section-gap">
        {/* Hero article */}
        <div
          className="group grid grid-cols-1 lg:grid-cols-2 gap-0 mb-20 overflow-hidden card-hover cursor-pointer"
          style={{ border: '1px solid var(--color-muted-border)', borderRadius: '2px' }}
        >
          <div style={{ overflow: 'hidden', aspectRatio: '16/10' }}>
            <img
              src={heroArticle.image}
              alt={heroArticle.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div
            className="p-10 flex flex-col justify-center"
            style={{ backgroundColor: 'var(--color-surface-warm)' }}
          >
            <p className="text-label mb-4" style={{ color: 'var(--color-oxblood)' }}>
              Bài viết nổi bật · Văn học & Văn hóa
            </p>
            <h2
              className="text-display-md transition-colors group-hover:text-[var(--color-oxblood)]"
              style={{ color: 'var(--color-charcoal)' }}
            >
              {heroArticle.title}
            </h2>
            <p className="text-body-md mt-4" style={{ color: 'var(--color-charcoal-muted)' }}>
              {heroArticle.excerpt}
            </p>
            <div
              className="flex items-center gap-3 mt-6 pt-6 text-label"
              style={{
                color: 'var(--color-charcoal-muted)',
                borderTop: '1px solid var(--color-muted-border)',
              }}
            >
              <span>Dương Thanh Biểu</span>
              <span>·</span>
              <span>{heroArticle.date}</span>
              <span>·</span>
              <span>{heroArticle.readTime}</span>
            </div>
          </div>
        </div>

        {/* Section header */}
        <div className="flex items-end justify-between mb-10">
          <h2 className="text-display-md" style={{ color: 'var(--color-charcoal)' }}>
            Bài viết gần đây
          </h2>
        </div>

        {/* Articles grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <div key={article.title} className="group block card-hover cursor-pointer">
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
                <p className="text-body-md mt-2" style={{ color: 'var(--color-charcoal-muted)' }}>
                  {article.excerpt}
                </p>
                <div
                  className="flex items-center gap-3 mt-3 text-label"
                  style={{ color: 'var(--color-charcoal-muted)' }}
                >
                  <span>{article.date}</span>
                  <span>·</span>
                  <span>{article.readTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter signup */}
        <div
          className="mt-20 p-10 text-center"
          style={{
            backgroundColor: 'var(--color-paper-ivory-dark)',
            border: '1px solid var(--color-muted-border)',
            borderRadius: '2px',
          }}
        >
          <p className="text-label mb-3" style={{ color: 'var(--color-oxblood)' }}>
            Đăng ký theo dõi
          </p>
          <h3 className="text-display-sm" style={{ color: 'var(--color-charcoal)' }}>
            Nhận bài viết mới nhất qua email
          </h3>
          <p className="text-body-md mt-3" style={{ color: 'var(--color-charcoal-muted)', maxWidth: '400px', margin: '0.75rem auto 0' }}>
            Cập nhật những tác phẩm, bài viết mới nhất về văn học và văn hóa Việt Nam.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 mt-8 justify-center"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Địa chỉ email của bạn"
              className="px-4 py-3 text-body-md flex-1 outline-none"
              style={{
                border: '1px solid var(--color-muted-border)',
                backgroundColor: 'white',
                borderRadius: '2px',
                maxWidth: '320px',
                color: 'var(--color-charcoal)',
              }}
            />
            <button
              type="submit"
              className="px-6 py-3 text-label text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-oxblood)', borderRadius: '2px' }}
            >
              Đăng ký
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
