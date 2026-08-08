const heroArticle = {
  title: 'Văn học miền Trung — Bản sắc và sức sống',
  subtitle: 'Một góc nhìn về nền văn học của dải đất miền Trung Việt Nam qua các thế kỷ',
  date: '5 tháng 7, 2024',
  readTime: '15 phút đọc',
  excerpt:
    'Văn học miền Trung Việt Nam mang trong mình một bản sắc riêng biệt, được hun đúc qua hàng thế kỷ lịch sử — từ những áng thơ về non nước hùng vĩ đến những trang văn ghi lại cuộc sống giản dị nhưng đầy nghĩa tình của người dân đất miền Trung.',
}

const articles = [
  {
    title: 'Thơ Việt Nam hiện đại — Giữa truyền thống và đổi mới',
    category: 'Phê bình văn học',
    date: '28 tháng 6, 2024',
    readTime: '10 phút đọc',
    excerpt: 'Thơ Việt Nam thế kỷ XX là một hành trình tìm kiếm, thử nghiệm và sáng tạo không ngừng.',
  },
  {
    title: 'Nghệ thuật thư pháp Việt — Di sản cần bảo tồn',
    category: 'Nghệ thuật',
    date: '15 tháng 6, 2024',
    readTime: '7 phút đọc',
    excerpt: 'Thư pháp không chỉ là nghệ thuật viết chữ đẹp, mà còn là sự truyền tải tâm hồn người viết.',
  },
  {
    title: 'Âm nhạc dân gian — Tiếng lòng người Việt',
    category: 'Âm nhạc',
    date: '3 tháng 6, 2024',
    readTime: '8 phút đọc',
    excerpt: 'Từ những điệu hò, câu ca dao đến các làn điệu dân ca, âm nhạc dân gian Việt Nam là kho tàng vô giá.',
  },
  {
    title: 'Ẩm thực miền Trung trong văn học',
    category: 'Văn hóa',
    date: '20 tháng 5, 2024',
    readTime: '6 phút đọc',
    excerpt: 'Ẩm thực không chỉ là chuyện ăn uống, mà còn là một phần không thể tách rời của văn hóa vùng đất.',
  },
  {
    title: 'Hội họa Việt Nam thế kỷ XX',
    category: 'Mỹ thuật',
    date: '10 tháng 5, 2024',
    readTime: '9 phút đọc',
    excerpt: 'Từ trường Mỹ thuật Đông Dương đến các thế hệ họa sĩ đương đại — hành trình của hội họa Việt.',
  },
  {
    title: 'Kiến trúc đình làng — Hồn quê trong từng mái đình',
    category: 'Kiến trúc',
    date: '28 tháng 4, 2024',
    readTime: '11 phút đọc',
    excerpt: 'Đình làng là trung tâm văn hóa, tâm linh và cộng đồng của người Việt từ ngàn xưa.',
  },
]

export default function ArtsCulturePage() {
  return (
    <>
      {/* Page header */}
      <div className="py-16" style={{ borderBottom: '1px solid var(--color-muted-border)' }}>
        <div className="container-main">
          <p className="text-label mb-3" style={{ color: 'var(--color-oxblood)' }}>Chuyên trang</p>
          <h1 className="text-display-lg" style={{ color: 'var(--color-charcoal)' }}>
            Nghệ thuật & Văn hóa
          </h1>
          <p className="text-body-lg mt-4" style={{ color: 'var(--color-charcoal-muted)', maxWidth: '480px' }}>
            Khám phá thế giới nghệ thuật, văn hóa và di sản Việt Nam qua lăng kính văn học.
          </p>
        </div>
      </div>

      <div className="container-main section-gap">
        {/* Hero article — text card */}
        <div
          className="group p-10 mb-20 card-hover cursor-pointer"
          style={{ border: '1px solid var(--color-muted-border)', borderRadius: '2px', backgroundColor: 'var(--color-surface-warm)' }}
        >
          <p className="text-label mb-4" style={{ color: 'var(--color-oxblood)' }}>
            Bài viết nổi bật · Văn học & Văn hóa
          </p>
          <h2
            className="text-display-md transition-colors group-hover:text-[var(--color-oxblood)]"
            style={{ color: 'var(--color-charcoal)', maxWidth: '720px' }}
          >
            {heroArticle.title}
          </h2>
          <p className="text-display-sm mt-2 font-display italic" style={{ color: 'var(--color-charcoal-muted)', fontWeight: 400 }}>
            {heroArticle.subtitle}
          </p>
          <p className="text-body-md mt-4" style={{ color: 'var(--color-charcoal-muted)', maxWidth: '640px' }}>
            {heroArticle.excerpt}
          </p>
          <div
            className="flex items-center gap-3 mt-6 pt-6 text-label"
            style={{ color: 'var(--color-charcoal-muted)', borderTop: '1px solid var(--color-muted-border)' }}
          >
            <span>Dương Thanh Biểu</span>
            <span>·</span>
            <span>{heroArticle.date}</span>
            <span>·</span>
            <span>{heroArticle.readTime}</span>
          </div>
        </div>

        {/* Section header */}
        <h2 className="text-display-md mb-10" style={{ color: 'var(--color-charcoal)' }}>
          Bài viết gần đây
        </h2>

        {/* Articles — text list */}
        <div style={{ borderTop: '1px solid var(--color-muted-border)' }}>
          {articles.map((article) => (
            <div
              key={article.title}
              className="group flex items-start gap-6 py-8 card-hover cursor-pointer"
              style={{ borderBottom: '1px solid var(--color-muted-border)' }}
            >
              <div className="flex-1">
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
                <div className="flex items-center gap-3 mt-3 text-label" style={{ color: 'var(--color-charcoal-muted)' }}>
                  <span>{article.date}</span>
                  <span>·</span>
                  <span>{article.readTime}</span>
                </div>
              </div>
              <span
                className="material-symbols-outlined text-xl mt-1 shrink-0 transition-transform group-hover:translate-x-1"
                style={{ color: 'var(--color-muted-border)' }}
              >
                arrow_forward
              </span>
            </div>
          ))}
        </div>

        {/* Newsletter signup */}
        <div
          className="mt-20 p-10 text-center"
          style={{ backgroundColor: 'var(--color-paper-ivory-dark)', border: '1px solid var(--color-muted-border)', borderRadius: '2px' }}
        >
          <p className="text-label mb-3" style={{ color: 'var(--color-oxblood)' }}>Đăng ký theo dõi</p>
          <h3 className="text-display-sm" style={{ color: 'var(--color-charcoal)' }}>
            Nhận bài viết mới nhất qua email
          </h3>
          <p className="text-body-md mt-3" style={{ color: 'var(--color-charcoal-muted)', maxWidth: '400px', margin: '0.75rem auto 0' }}>
            Cập nhật những tác phẩm, bài viết mới nhất về văn học và văn hóa Việt Nam.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 mt-8 justify-center" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Địa chỉ email của bạn"
              className="px-4 py-3 text-body-md flex-1 outline-none"
              style={{ border: '1px solid var(--color-muted-border)', backgroundColor: 'white', borderRadius: '2px', maxWidth: '320px', color: 'var(--color-charcoal)' }}
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
