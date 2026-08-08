export default function ComingSoonPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-paper-ivory)',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <p className="text-label mb-6" style={{ color: 'var(--color-oxblood)', letterSpacing: '0.15em' }}>
        Dương Thanh Biểu — Văn học & Thi ca
      </p>

      <h1
        className="text-display-lg"
        style={{ color: 'var(--color-charcoal)', maxWidth: '560px', lineHeight: 1.2 }}
      >
        Trang web đang được xây dựng
      </h1>

      <div
        className="my-10"
        style={{
          width: 48,
          height: 1,
          backgroundColor: 'var(--color-oxblood)',
          opacity: 0.4,
        }}
      />

      <p
        className="text-body-lg"
        style={{ color: 'var(--color-charcoal-muted)', maxWidth: '420px' }}
      >
        Chúng tôi đang hoàn thiện nội dung để mang đến trải nghiệm tốt nhất.
        Vui lòng quay lại sau.
      </p>

      <p className="text-label mt-12" style={{ color: 'var(--color-charcoal-muted)' }}>
        © {new Date().getFullYear()} Dương Thanh Biểu
      </p>
    </div>
  )
}
