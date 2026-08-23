import ContentListPage from './ContentListPage'

const CATEGORIES = ['Tiểu thuyết', 'Truyện ngắn', 'Truyện ký', 'Tùy bút', 'Ký sự']

export default function VanXuoiPage() {
  return (
    <ContentListPage
      title="Văn xuôi & Truyện ký"
      contentType="van-xuoi"
      basePath="/admin/van-xuoi"
      categoryOptions={CATEGORIES}
    />
  )
}
