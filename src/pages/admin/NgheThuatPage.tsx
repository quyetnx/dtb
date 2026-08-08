import ContentListPage from './ContentListPage'

const CATEGORIES = ['Phê bình văn học', 'Nghệ thuật', 'Âm nhạc', 'Văn hóa', 'Mỹ thuật', 'Kiến trúc']

export default function NgheThuatPage() {
  return (
    <ContentListPage
      title="Nghệ thuật & Văn hóa"
      contentType="nghe-thuat"
      basePath="/admin/nghe-thuat"
      categoryOptions={CATEGORIES}
    />
  )
}
