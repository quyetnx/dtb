import ContentListPage from './ContentListPage'

const CATEGORIES = ['Thời sự', 'Sự kiện', 'Thông báo', 'Hoạt động', 'Giải thưởng']

export default function TinTucPage() {
  return (
    <ContentListPage
      title="Tin tức"
      contentType="tin-tuc"
      basePath="/admin/tin-tuc"
      categoryOptions={CATEGORIES}
    />
  )
}
