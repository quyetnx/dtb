import { Link, useParams } from 'react-router-dom'

const poems: Record<string, {
  title: string
  date: string
  dedication?: string
  stanzas: string[]
  note?: string
}> = {
  'que-huong-chieu-ta': {
    title: 'Quê hương chiều tà',
    date: 'Tháng 7, 2024',
    dedication: 'Kính tặng quê hương',
    stanzas: [
      `Chiều về trên mái ngói rêu phong
Khói lam tỏa nhẹ qua vườn cũ
Tiếng chim về tổ gọi nhau rộn
Mùa hạ qua rồi — thu đến chưa?`,
      `Con đường làng vẫn còn đất đỏ
Bờ ao xưa lau sậy mọc đầy
Cây bàng già đứng buồn im lặng
Nhớ bao năm trẻ nhỏ nô đùa`,
      `Quê hương ơi, ta về thăm ngươi
Mang theo lòng bao nỗi nhớ mong
Đất quê hương — dù đâu cũng nhớ
Chiều tà về — lòng vẫn vấn vương`,
    ],
    note: 'Bài thơ được viết trong một chiều thu trở về thăm quê sau nhiều năm xa cách.',
  },
  'nho-me': {
    title: 'Nhớ mẹ',
    date: 'Tháng 6, 2024',
    stanzas: [
      `Con về tìm lại bóng người xưa
Dấu chân mẹ in trên sân nhà
Giọng mẹ gọi chiều — còn vang vọng
Trong gió đưa qua những hàng cau`,
      `Bàn tay mẹ gầy nhưng ấm áp
Vuốt tóc con những đêm sốt cao
Câu hát ru đêm còn in dấu
Theo con suốt cả những năm dài`,
      `Mẹ ơi, con vẫn nhớ mẹ hoài
Dù năm tháng trôi qua bao đổi thay
Trong trái tim con — mẹ còn đó
Mãi mãi không phai, mãi không quên`,
    ],
  },
  'song-que': {
    title: 'Sông quê',
    date: 'Tháng 5, 2024',
    stanzas: [
      `Dòng sông tuổi thơ vẫn chảy hoài
Đem theo ký ức những ngày dài
Bờ sông xưa — bãi cát trắng mịn
Mùa hè về — bọn trẻ ùa ra`,
      `Sông ơi — sông có nhớ ta không
Những chiều ta thả diều trên bãi
Những đêm trăng ngồi câu cá trắng
Bài hát xưa — ai đó còn hát?`,
      `Năm tháng trôi qua — sông vẫn chảy
Bờ bên này — ta đứng nhìn sang
Bờ bên kia — tuổi thơ đã khuất
Chỉ còn lại — nỗi nhớ dịu dàng`,
    ],
    note: 'Được sáng tác nhân dịp về thăm quê và đứng bên dòng sông tuổi thơ.',
  },
}

const defaultPoem = {
  title: 'Bài thơ',
  date: '2024',
  stanzas: ['Nội dung bài thơ đang được cập nhật.'],
}

export default function PoemDetailPage() {
  const { slug = '' } = useParams()
  const poem = poems[slug] ?? { ...defaultPoem, title: slug.replace(/-/g, ' ') }

  return (
    <div className="container-main section-gap">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-2 text-label mb-12"
        style={{ color: 'var(--color-charcoal-muted)' }}
      >
        <Link to="/" className="hover:text-[var(--color-charcoal)]">Trang chủ</Link>
        <span className="material-symbols-outlined text-[0.8em]">chevron_right</span>
        <Link to="/van-tho" className="hover:text-[var(--color-charcoal)]">Văn Thơ</Link>
        <span className="material-symbols-outlined text-[0.8em]">chevron_right</span>
        <span style={{ color: 'var(--color-charcoal)' }}>Thơ</span>
      </nav>

      {/* Poem layout — centered */}
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        {/* Category */}
        <p className="text-label mb-4" style={{ color: 'var(--color-oxblood)' }}>
          Thơ
        </p>

        {/* Title */}
        <h1 className="text-display-lg" style={{ color: 'var(--color-charcoal)' }}>
          {poem.title}
        </h1>

        {/* Dedication */}
        {poem.dedication && (
          <p
            className="text-body-md italic mt-4"
            style={{ color: 'var(--color-charcoal-muted)' }}
          >
            {poem.dedication}
          </p>
        )}

        {/* Author / date */}
        <div
          className="flex items-center justify-center gap-4 mt-6 text-label"
          style={{ color: 'var(--color-charcoal-muted)' }}
        >
          <span>Dương Thanh Biểu</span>
          <span>·</span>
          <span>{poem.date}</span>
        </div>

        {/* Ornament */}
        <div className="divider-ornament my-10" style={{ justifyContent: 'center' }}>
          <span className="text-label px-4" style={{ color: 'var(--color-muted-border)' }}>
            ✦
          </span>
        </div>

        {/* Stanzas */}
        <div className="flex flex-col gap-8">
          {poem.stanzas.map((stanza, i) => (
            <p key={i} className="poem-content" style={{ color: 'var(--color-charcoal)' }}>
              {stanza}
            </p>
          ))}
        </div>

        {/* Note */}
        {poem.note && (
          <p
            className="text-body-md italic mt-12 pt-10"
            style={{
              color: 'var(--color-charcoal-muted)',
              borderTop: '1px solid var(--color-muted-border)',
            }}
          >
            {poem.note}
          </p>
        )}

        {/* Share */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <p className="text-label" style={{ color: 'var(--color-charcoal-muted)' }}>
            Chia sẻ:
          </p>
          {['link', 'share', 'mail'].map((icon) => (
            <button
              key={icon}
              className="p-2 transition-colors hover:text-[var(--color-oxblood)]"
              style={{ color: 'var(--color-charcoal-muted)' }}
              aria-label={icon}
            >
              <span className="material-symbols-outlined">{icon}</span>
            </button>
          ))}
        </div>

        {/* Back */}
        <div className="mt-12">
          <Link
            to="/van-tho"
            className="inline-flex items-center gap-2 text-label transition-colors hover:text-[var(--color-charcoal)]"
            style={{ color: 'var(--color-charcoal-muted)' }}
          >
            <span className="material-symbols-outlined text-[1em]">arrow_back</span>
            Xem tất cả tác phẩm
          </Link>
        </div>
      </div>
    </div>
  )
}
