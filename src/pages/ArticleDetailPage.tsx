import { Link, useParams } from 'react-router-dom'

const articles: Record<string, {
  category: string
  title: string
  subtitle?: string
  date: string
  readTime: string
  image: string
  content: string[]
  related: { slug: string; title: string; category: string; image: string }[]
}> = {
  'hoi-ky-tu-nguoi-can-bo-tu-chinh-tri': {
    category: 'Hồi ký',
    title: 'Hồi ký từ người cán bộ tù chính trị',
    subtitle: 'Những trang ký ức về một thời không thể quên',
    date: '15 tháng 7, 2024',
    readTime: '12 phút đọc',
    image: 'https://hoduongvietnam.com.vn/uploads/images/duong-thanh-bieu(1).png',
    content: [
      'Những năm tháng trong tù là những năm tháng tôi không bao giờ có thể quên. Không phải vì đau khổ, dù đau khổ có đó, mà vì chính trong những năm tháng ấy, tôi đã hiểu được điều gì là thực sự quan trọng trong cuộc đời.',
      'Tôi bị bắt vào một buổi sáng tháng Ba, khi sương mù còn chưa tan hết trên những con đường làng quê. Họ đến mà không báo trước, như tất cả những điều bất ngờ trong cuộc đời — luôn đến khi ta ít ngờ nhất.',
      'Trong xà lim, tôi đã gặp những người mà sau này trở thành những người bạn thân thiết nhất của cuộc đời mình. Chúng tôi chia sẻ với nhau không phải thức ăn hay áo mặc — những thứ đó chúng tôi cũng không có nhiều — mà là những câu chuyện, những kỷ niệm, những ước mơ.',
      '"Người ta có thể giam cầm thân xác, nhưng không thể giam cầm tư tưởng" — đó là câu tôi luôn tự nhủ với mình trong những đêm dài không ngủ được.',
      'Mỗi buổi sáng thức dậy trong tù, tôi nhớ đến gia đình. Nhớ đến những bữa cơm đơn giản mà ngày trước tôi chưa bao giờ thấy quý. Nhớ đến tiếng cười của con trẻ, tiếng gọi nhau ơi ới của hàng xóm, mùi khói bếp buổi chiều...',
      'Khi được trả tự do, tôi bước ra khỏi cánh cổng trại giam mà lòng vừa mừng vừa bồi hồi. Mừng vì được trở về, bồi hồi vì không biết thế giới bên ngoài đã thay đổi thế nào. Và thật ra, chính tôi cũng đã thay đổi — thay đổi theo cách mà tôi chỉ dần dần hiểu ra sau nhiều năm.',
      'Tôi viết những trang hồi ký này không phải để oán trách hay kể khổ. Tôi viết vì muốn những thế hệ sau hiểu rằng: trong bất kỳ hoàn cảnh nào, con người vẫn có thể giữ được phẩm giá, vẫn có thể yêu thương và hy vọng.',
    ],
    related: [
      {
        slug: 'nguoi-ban-chien-truong',
        title: 'Người bạn chiến trường',
        category: 'Hồi ký',
        image: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&q=80',
      },
      {
        slug: 'dat-que-huong',
        title: 'Đất quê hương',
        category: 'Tùy bút',
        image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=400&q=80',
      },
      {
        slug: 'bien-xanh-trong-ky-uc',
        title: 'Biển xanh trong ký ức',
        category: 'Truyện ngắn',
        image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400&q=80',
      },
    ],
  },
  'bien-xanh-trong-ky-uc': {
    category: 'Truyện ngắn',
    title: 'Biển xanh trong ký ức',
    subtitle: 'Câu chuyện về tuổi thơ và biển cả',
    date: '3 tháng 6, 2024',
    readTime: '8 phút đọc',
    image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1200&q=80',
    content: [
      'Biển trong ký ức tôi không phải là biển của những trang sách du lịch, không phải là biển của những bức ảnh đẹp. Biển trong ký ức tôi là biển của tuổi thơ, với mùi nước mặn, tiếng sóng vỗ và cái cảm giác cát nóng bỏng dưới lòng bàn chân.',
      'Ngày nhỏ, mỗi hè tôi đều được ba đưa ra biển. Đó là chuyến đi dài nhất của cả năm — dài theo nghĩa đặc biệt của tuổi thơ, khi mỗi giờ đều có thể chứa đựng cả một thế giới.',
      'Tôi học bơi ở cái biển đó. Ba tôi đứng cách xa khoảng năm bước, giơ hai tay ra và nói: "Bơi về phía ba đi, con." Tôi sợ lắm, nhưng nhìn đôi mắt ba — đôi mắt không bao giờ nói dối — tôi tin rằng mình sẽ không chìm.',
      'Những năm tháng sau đó, cuộc đời đưa tôi đi xa. Xa gia đình, xa quê hương, xa cả cái biển của tuổi thơ. Nhưng mỗi lần nhắm mắt lại, tôi vẫn nghe thấy tiếng sóng, vẫn cảm nhận được mùi muối biển, vẫn thấy đôi tay ba giơ ra giữa những con sóng.',
      'Đó là điều tôi muốn nói với các con mình: ký ức về những điều giản dị là kho báu quý nhất mà tuổi thơ có thể tặng cho ta.',
    ],
    related: [
      {
        slug: 'hoi-ky-tu-nguoi-can-bo-tu-chinh-tri',
        title: 'Hồi ký từ người cán bộ tù chính trị',
        category: 'Hồi ký',
        image: 'https://hoduongvietnam.com.vn/uploads/images/duong-thanh-bieu(1).png',
      },
      {
        slug: 'dat-que-huong',
        title: 'Đất quê hương',
        category: 'Tùy bút',
        image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=400&q=80',
      },
    ],
  },
}

const defaultArticle = {
  category: 'Văn xuôi',
  title: 'Tác phẩm',
  date: '2024',
  readTime: '5 phút đọc',
  image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80',
  content: ['Nội dung tác phẩm đang được cập nhật.'],
  related: [],
}

export default function ArticleDetailPage() {
  const { slug = '' } = useParams()
  const article = articles[slug] ?? { ...defaultArticle, title: slug.replace(/-/g, ' ') }

  return (
    <>
      {/* Hero image */}
      <div className="w-full" style={{ height: '480px', overflow: 'hidden' }}>
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Article */}
      <article className="container-main">
        {/* Header */}
        <header className="pt-12 pb-10" style={{ maxWidth: '720px', margin: '0 auto' }}>
          <nav className="flex items-center gap-2 text-label mb-6" style={{ color: 'var(--color-charcoal-muted)' }}>
            <Link to="/" className="hover:text-[var(--color-charcoal)]">Trang chủ</Link>
            <span className="material-symbols-outlined text-[0.8em]">chevron_right</span>
            <Link to="/van-tho" className="hover:text-[var(--color-charcoal)]">Văn Thơ</Link>
            <span className="material-symbols-outlined text-[0.8em]">chevron_right</span>
            <span style={{ color: 'var(--color-charcoal)' }}>{article.category}</span>
          </nav>

          <p className="text-label mb-4" style={{ color: 'var(--color-oxblood)' }}>
            {article.category}
          </p>
          <h1 className="text-display-lg" style={{ color: 'var(--color-charcoal)' }}>
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="text-display-sm mt-3 font-display italic" style={{ color: 'var(--color-charcoal-muted)', fontWeight: 400 }}>
              {article.subtitle}
            </p>
          )}

          <div
            className="flex items-center gap-4 mt-6 pt-6 text-label"
            style={{
              color: 'var(--color-charcoal-muted)',
              borderTop: '1px solid var(--color-muted-border)',
            }}
          >
            <span>Dương Thanh Biểu</span>
            <span>·</span>
            <span>{article.date}</span>
            <span>·</span>
            <span>{article.readTime}</span>
          </div>
        </header>

        {/* Body */}
        <div
          className="pb-16"
          style={{ maxWidth: '720px', margin: '0 auto', borderBottom: '1px solid var(--color-muted-border)' }}
        >
          {article.content.map((para, i) => (
            <p
              key={i}
              className={['text-body-lg mb-6', i === 0 ? 'drop-cap' : ''].join(' ')}
              style={{ color: 'var(--color-charcoal)' }}
            >
              {para}
            </p>
          ))}

          {/* Share */}
          <div className="flex items-center gap-4 mt-10">
            <p className="text-label" style={{ color: 'var(--color-charcoal-muted)' }}>
              Chia sẻ:
            </p>
            {['link', 'facebook', 'mail'].map((icon) => (
              <button
                key={icon}
                className="p-2 transition-colors hover:text-[var(--color-oxblood)]"
                style={{ color: 'var(--color-charcoal-muted)' }}
                aria-label={icon}
              >
                <span className="material-symbols-outlined">
                  {icon === 'link' ? 'link' : icon === 'facebook' ? 'share' : 'mail'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Related */}
        {article.related.length > 0 && (
          <section className="py-16">
            <h2 className="text-display-sm mb-8" style={{ color: 'var(--color-charcoal)' }}>
              Tác phẩm liên quan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {article.related.map((rel) => (
                <Link
                  key={rel.slug}
                  to={`/van-tho/${rel.slug}`}
                  className="group block card-hover"
                >
                  <div className="overflow-hidden" style={{ borderRadius: '2px', aspectRatio: '4/3' }}>
                    <img
                      src={rel.image}
                      alt={rel.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-3">
                    <p className="text-label" style={{ color: 'var(--color-oxblood)' }}>
                      {rel.category}
                    </p>
                    <h3
                      className="text-display-sm mt-1 transition-colors group-hover:text-[var(--color-oxblood)]"
                      style={{ color: 'var(--color-charcoal)' }}
                    >
                      {rel.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  )
}
