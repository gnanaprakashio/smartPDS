import { useState, useEffect } from 'react'
import { Calendar, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { slotsAPI } from '../services/api'

function Slots() {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [formData, setFormData] = useState({
    slotDate: '',
    startTime: '09:00',
    endTime: '11:00',
    maxUsers: 40
  })
  const [formLoading, setFormLoading] = useState(false)

  // Auto-calculate end time when start time changes (2 hour duration)
  const handleStartTimeChange = (e) => {
    const start = e.target.value
    // Calculate end time (2 hours later)
    const [hours, minutes] = start.split(':').map(Number)
    const endHours = hours + 2
    const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    setFormData({ 
      ...formData, 
      startTime: start,
      endTime: endTime
    })
  }

  useEffect(() => {
    fetchSlots()
    // Refresh slots every 30 seconds
    const interval = setInterval(fetchSlots, 30000)
    // Get user role
    const role = localStorage.getItem('role')
    setUserRole(role)
    return () => clearInterval(interval)
  }, [])

  const fetchSlots = async () => {
    try {
      // Add timestamp to prevent caching
      const response = await slotsAPI.getSlots()
      console.log('Fresh slots data:', response.data)
      setSlots(response.data || [])
    } catch (error) {
      console.error('Error fetching slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      await slotsAPI.createSlot(formData)
      setShowModal(false)
      setFormData({ slotDate: '', startTime: '09:00', endTime: '11:00', maxUsers: 40 })
      fetchSlots()
      alert('Slot created successfully!')
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create slot')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteAllSlots = async () => {
    const confirmed = window.confirm('Delete all slots?')
    if (!confirmed) return
    
    try {
      const shopId = localStorage.getItem('shopId')
      await slotsAPI.deleteAllSlots(shopId)
      alert('All slots deleted!')
      fetchSlots()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete slots')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Slots</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage distribution time slots</p>
        </div>
        {userRole !== 'STAFF' && (
          <>
            <button
              onClick={() => {
                setLoading(true)
                fetchSlots()
              }}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw size={20} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={20} />
              <span>Add Slot</span>
            </button>
          </>
        )}
        {userRole !== 'STAFF' && (
          <button
            onClick={handleDeleteAllSlots}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 size={20} />
            <span>Remove All</span>
          </button>
        )}
      </div>

      {/* Slots Grid */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : slots.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-medium">No slots created yet</p>
          <p className="text-sm text-slate-400 mt-1">Create a new slot to start scheduling</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slots.map((slot) => (
            <div key={slot.id} className="card-hover">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{formatDate(slot.slotDate)}</h3>
                  <p className="text-slate-500 mt-1">{slot.startTime} - {slot.endTime}</p>
                </div>
                <span className="badge-primary">
                  {slot.maxUsers} users
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Created: {new Date(slot.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Slot Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Slot</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.slotDate}
                    onChange={(e) => setFormData({ ...formData, slotDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={handleStartTimeChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time (auto)</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Users (for 2-hour slot)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 40 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Slots
