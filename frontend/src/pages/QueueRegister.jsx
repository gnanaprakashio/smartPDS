import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { queueAPI } from '../services/api.js'
import { HomeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

const QueueRegister = () => {
  const [formData, setFormData] = useState({ familySize: 4, needs: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await queueAPI.create(formData)
      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register queue')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <CheckCircleIcon className="mx-auto h-16 w-16 text-green-600 mb-4" />
        <h2 className="text-2xl font-bold text-green-900 mb-2">
          Queue Registered Successfully!
        </h2>
        <p className="text-green-800 mb-6">
          Redirecting to dashboard...
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Register New Queue
        </h1>
        <p className="text-gray-600">
          Join the smart ration queue with AI priority scoring
        </p>
      </div>

      {error &amp;&amp; (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Family Size
          </label>
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4,5,6,7,8].map((size) => (
              <label key={size} className="flex items-center p-3 border-2 rounded-xl cursor-pointer hover:border-primary-300 transition-all {formData.familySize === size ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}">
                <input
                  type="radio"
                  name="familySize"
                  value={size}
                  checked={formData.familySize === size}
                  onChange={() => setFormData({...formData, familySize: size})}
                  className="rounded"
                  hidden
                />
                {size}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Special Needs (optional)
          </label>
          <textarea
            rows="3"
            placeholder="Medical conditions, disabled members, elderly etc."
            value={formData.needs}
            onChange={(e) => setFormData({...formData, needs: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical"
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 btn-primary bg-gray-500 hover:bg-gray-600"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary"
          >
            {loading ? 'Registering...' : 'Join Queue'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default QueueRegister

