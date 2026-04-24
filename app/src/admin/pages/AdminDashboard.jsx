import { Link } from 'react-router-dom'

function AdminDashboard() {
  return (
    <section>
      <h1 style={{ marginTop: 0 }}>Admin Dashboard</h1>
      <p>Chọn các trang quản lý dưới đây để tiếp tục</p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/admin/account">Quản lý tài khoản</Link>
        <Link to="/admin/posts">Danh sách bài viết</Link>
        <Link to="/admin/posts/create">Tạo bài viết</Link>
      </div>
    </section>
  )
}

export default AdminDashboard
