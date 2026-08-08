import ContentListPage from './ContentListPage'

const CATEGORIES = ['Tiểu thuyết', 'Truyện ngắn', 'Hồi ký', 'Tùy bút', 'Ký sự']

export default function VanXuoiPage() {
  return (
    <ContentListPage
      title="Văn xuôi & Hồi ký"
      contentType="van-xuoi"
      basePath="/admin/van-xuoi"
      categoryOptions={CATEGORIES}
    />
  )
}
