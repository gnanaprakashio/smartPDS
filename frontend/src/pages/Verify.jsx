import { useState } from 'react'
import { ShieldCheck, Lock } from 'lucide-react'
import { verifyAPI } from '../services/api'

function Verify() {
  const [formData, setFormData] = useState({
    rationCardNumber: '',
    otp: ''
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await verifyAPI.verify(formData)
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Ration Verification</h1>
        <p className="text-gray-500 mt-1">Verify OTP at ration shop</p>
      </div>

      {/* Verification Form */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-green-100 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">OTP Verification</h2>
            <p className="text-gray-500 text-sm">Enter card number and OTP to complete distribution</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ration Card Number
            </label>
            <input
              type="text"
              value={formData.rationCardNumber}
              onChange={(e) => setFormData({ ...formData, rationCardNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter ration card number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OTP (4-digit)
            </label>
            <input
              type="text"
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter 4-digit OTP"
              maxLength={4}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span>Verifying...</span>
            ) : (
              <>
                <Lock size={20} />
                <span>Verify & Distribute</span>
              </>
            )}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-center">
              <ShieldCheck className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-green-800">Verification Successful!</h3>
              <p className="text-green-700 mt-2">
                {result.user?.name} - Ration Distributed
              </p>
              <p className="text-sm text-green-600 mt-1">
                Stock reduced by {result.stockReduced}kg
              </p>
              <button
                onClick={() => {
                  setResult(null)
                  setFormData({ rationCardNumber: '', otp: '' })
                }}
                className="mt-4 text-green-700 hover:underline"
              >
                Verify Next User
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h3 className="font-bold text-blue-800 mb-2">How it works:</h3>
        <ol className="list-decimal list-inside text-blue-700 space-y-1">
          <li>User receives OTP via SMS after scheduling</li>
          <li>User provides ration card number and OTP</li>
          <li>Shop keeper verifies OTP</li>
          <li>Stock is automatically reduced</li>
        </ol>
      </div>
    </div>
  )
}

export default Verify
