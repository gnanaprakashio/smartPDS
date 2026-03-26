import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Mail, Lock, Building2, Eye, EyeOff, Phone, HelpCircle, AlertCircle } from 'lucide-react'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4" role="main">
      <div className="w-full max-w-md">
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100 mb-2">Smart Public Distribution System</h1>
            <p className="text-gray-400">Sign in to your account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6" aria-label="Login form">

            {error && (
              <div 
                className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-xl flex items-center gap-3"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}



            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setIsStaff(e.target.value.toLowerCase().includes('staff'))
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                  aria-describedby="email-help"
                  autoComplete="email"
                />
              </div>
              <p id="email-help" className="mt-1 text-xs text-gray-500">
                Staff accounts will automatically show shop ID field
              </p>
            </div>



            {/* Shop ID Field - Only for Staff */}
            {isStaff && (
              <div>
                <label htmlFor="shopId" className="block text-sm font-medium text-gray-300 mb-2">
                  Shop ID
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input
                    id="shopId"
                    type="text"
                    value={shopId}
                    onChange={(e) => setShopId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter shop ID (e.g., SHOP001)"
                    required
                  />
                </div>
              </div>
            )}



            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                  aria-describedby="password-help"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p id="password-help" className="mt-1 text-xs text-gray-500">
                Use your assigned password
              </p>
            </div>



            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:shadow-none disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              aria-describedby="submit-help"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
            <p id="submit-help" className="sr-only">
              Click to sign in to your account
            </p>
          </form>

          {/* Helpline & Help */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Phone className="w-4 h-4" aria-hidden="true" />
              <span>Helpline: 1800-XXX-XXXX</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <HelpCircle className="w-4 h-4" aria-hidden="true" />
              <span>Help</span>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-gray-600">
            Secure login for authorized personnel only
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

