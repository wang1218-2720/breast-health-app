import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import DesktopLayout from './layouts/DesktopLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DailyLog from './pages/DailyLog'
import Reports from './pages/Reports'
import Knowledge from './pages/Knowledge'
import Profile from './pages/Profile'
import Privacy from './pages/Privacy'

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<DesktopLayout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="daily-log" element={<DailyLog />} />
          <Route path="reports" element={<Reports />} />
          <Route path="knowledge" element={<Knowledge />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/privacy" element={<Privacy />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </UserProvider>
  )
}

export default App
