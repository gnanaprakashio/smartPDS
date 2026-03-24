import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, Building2, Eye, EyeOff, Phone, HelpCircle, FileText } from 'lucide-react'
import { authAPI } from '../services/api'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shopId, setShopId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isStaff, setIsStaff] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (token && role) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const loginData = { email, password }
      if (isStaff && shopId) {
        loginData.shopId = shopId.trim().toUpperCase()
      }
      
      const response = await authAPI.login(loginData)
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('role', response.data.user.role)
        localStorage.setItem('userName', response.data.user.name)
        localStorage.setItem('shopId', response.data.user.shopId || '')
        onLogin(response.data.token, response.data.user.role)
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    setIsStaff(e.target.value.toLowerCase().includes('staff'))
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0F172A] relative overflow-hidden">
      {/* Primary Background Gradient - Deep Navy to Muted Teal */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_#091A33_0%,_#163A53_50%,_#0F172A_100%)]"></div>
      
      {/* Top-Left Repeating Radial Gradient Circles */}
      <div 
        className="absolute top-0 left-0 w-1/2 h-1/2"
        style={{
          background: `repeating-radial-gradient(
            circle at 0 0,
            transparent 0,
            transparent 79px,
            rgba(255, 255, 255, 0.03) 79px,
            rgba(255, 255, 255, 0.03) 80px
          )`
        }}
      ></div>
      
      {/* Bottom-Right Larger Circles for Balance */}
      <div 
        className="absolute bottom-0 right-0 w-2/3 h-2/3"
        style={{
          background: `repeating-radial-gradient(
            circle at 100% 100%,
            transparent 0,
            transparent 119px,
            rgba(255, 255, 255, 0.02) 119px,
            rgba(255, 255, 255, 0.02) 120px
          )`
        }}
      ></div>
      {/* Decorative circles */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo - Government Style */}
        <div className="flex flex-col items-center justify-center mb-8">
          {/* Government Emblem */}
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl mb-4 border-4 border-yellow-500">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
              <span className="text-3xl">🏛️</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide" style={{ fontFamily: 'Merriweather, serif' }}>
               Smart Public Distribution System
          </h1>
          <p className="text-[#FACC15] mt-1 text-sm font-medium">Government of India</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-[32px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-full mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Merriweather, serif' }}>Authorized Login</h2>
            <p className="text-[#64748B] mt-2">Sign in to access the dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#64748B]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className="w-full px-4 py-3 pl-12 bg-[#F1F5F9] text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent placeholder-[#64748B]"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#64748B]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-12 bg-[#F1F5F9] text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent placeholder-[#64748B]"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-[#64748B] hover:text-white" />
                  ) : (
                    <Eye className="h-5 w-5 text-[#64748B] hover:text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Shop ID Field - Only for Staff */}
            {isStaff && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-white mb-2">
                  Shop ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-[#64748B]" />
                  </div>
                  <input
                    type="text"
                    value={shopId}
                    onChange={(e) => setShopId(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 pl-12 bg-[#F1F5F9] text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-transparent placeholder-[#64748B]"
                    placeholder="e.g., SHOP001"
                    required={isStaff}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#1E40AF] to-[#EA580C] hover:from-[#1E40AF] hover:to-[#EA580C] text-white font-semibold rounded-full transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Secure Login</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Helpline & Help */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Phone className="w-4 h-4" />
            <span>Helpline: 1800-XXX-XXXX</span>
          </div>
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <HelpCircle className="w-4 h-4" />
            <span>Help</span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-white/40">
          🔒 Secure login for authorized person only
        </p>
      </div>
    </div>
  )
}

export default Login
