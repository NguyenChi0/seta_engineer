import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ServicePage from './pages/ServicePage'
import SubservicePage from './pages/SubservicePage'
import AchievementsPage from './pages/AchievementsPage'
import CompanyPage from './pages/CompanyPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import MissionPage from './pages/MissionPage'
import NewsPage from './pages/NewsPage'
import NewsDetailPage from './pages/NewsDetailPage'
import SetaxWs from './pages/SetaxWs'
import AdminShell from './admin/AdminShell'
import AdminDashboard from './admin/pages/AdminDashboard'
import AdminAccount from './admin/pages/AdminAccount'
import AdminPost from './admin/pages/AdminPost'
import AdminPostCreate from './admin/pages/AdminPostCreate'
import AdminPostUpdate from './admin/pages/AdminPostUpdate'
import AdminLogin from './admin/pages/AdminLogin'
import RequireAuth from './admin/RequireAuth'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="mission" element={<MissionPage />} />
          <Route path="recruitment" element={<ServicePage />} />
          <Route path="recruitment/outsourcing" element={<ServicePage />} />
          <Route path="recruitment/:subserviceId" element={<SubservicePage />} />
          <Route path="recruitment/outsourcing/:subserviceId" element={<SubservicePage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="company" element={<CompanyPage />} />
          <Route path="setax-ws" element={<SetaxWs />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="news/:newsId" element={<NewsDetailPage />} />
          <Route path="privacy-policy" element={<PrivacyPage />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminShell />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="account" element={<AdminAccount />} />
          <Route path="posts" element={<AdminPost />} />
          <Route path="posts/create" element={<AdminPostCreate />} />
          <Route path="posts/:id/edit" element={<AdminPostUpdate />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
