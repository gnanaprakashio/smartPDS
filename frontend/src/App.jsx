import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, Suspense, lazy } from 'react'

// Lazy load components for better performance
const Login = lazy(() => import('./pages/Login'))
const AdminLayout = lazy(() => import('./pages/AdminLayout'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Users = lazy(() => import('./pages/Users'))
const Inventory = lazy(() => import('./pages/Inventory'))
const Slots = lazy(() => import('./pages/Slots'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Verify = lazy(() => import('./pages/Verify'))
const StaffRequests = lazy(() => import('./pages/StaffRequests'))
const OfficerRequests = lazy(() => import('./pages/OfficerRequests'))

// Loading component for lazy loaded routes
const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
)

// 404 Page Component
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center">
      <div className="text-6xl font-bold text-slate-300 mb-4">404</div>
      <h1 className="text-2xl font-semibold text-slate-700 mb-2">Page Not Found</h1>
      <p className="text-slate-500 mb-6">The page you're looking for doesn't exist.</p>
      <button 
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
)

// Authentication Guard Component
const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('token')
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

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
    localStorage.removeItem('shopId')  // Remove shopId as well
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
    return (
      <Suspense fallback={<RouteLoader />}>
        <Login onLogin={handleLogin} />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? 
          <Navigate to="/dashboard" replace /> : 
          <Login onLogin={handleLogin} />
        } />
        <Route path="/" element={
          <RequireAuth>
            <AdminLayout onLogout={handleLogout} userRole={userRole} />
          </RequireAuth>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="slots" element={<Slots />} />
          {userRole !== 'STAFF' && userRole !== 'PDS_OFFICER' && (
            <Route path="verify" element={<Verify />} />
          )}
          <Route path="analytics" element={<Analytics />} />
          <Route path="staff-requests" element={<StaffRequests />} />
          <Route path="officer-requests" element={<OfficerRequests />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App
