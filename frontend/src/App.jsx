import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import AdminLayout from './pages/AdminLayout'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Inventory from './pages/Inventory'
import Slots from './pages/Slots'
import Analytics from './pages/Analytics'
import Verify from './pages/Verify'
import StaffRequests from './pages/StaffRequests'
import OfficerRequests from './pages/OfficerRequests'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (token) {
      setIsAuthenticated(true)
      setUserRole(role)
    }
    setLoading(false)
  }, [])

  const handleLogin = (token, role) => {
    localStorage.setItem('token', token)
    setIsAuthenticated(true)
    setUserRole(role)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('userName')
    setIsAuthenticated(false)
    setUserRole(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Routes>
      <Route path="/" element={<AdminLayout onLogout={handleLogout} userRole={userRole} />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="slots" element={<Slots />} />
        <Route path="verify" element={<Verify />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="staff-requests" element={<StaffRequests />} />
        <Route path="officer-requests" element={<OfficerRequests />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
