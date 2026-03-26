import { useState, useEffect } from 'react'
import { Package, Plus, Edit2, Trash2, Play, RefreshCw, AlertCircle } from 'lucide-react'
import { inventoryAPI, scheduleAPI } from '../services/api'
import { useToast } from '../components/Toast'

function Inventory() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const toast = useToast()
  const [formData, setFormData] = useState({
    shopId: '',
    riceStock: 0,
    sugarStock: 0,
    wheatStock: 0,
    oilStock: 0,
    toorDalStock: 0
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchInventory()
    const role = localStorage.getItem('role')
    setUserRole(role)
  }, [])

  // Get shopId for filtering (for staff)
  const shopId = localStorage.getItem('shopId')

  // Filter inventory to show only staff's shop
  const filteredInventory = userRole === 'STAFF' 
    ? inventory.filter(item => item.shopId === shopId)
    : inventory

  const fetchInventory = async () => {
    try {
      const response = await inventoryAPI.getInventory()
      setInventory(response.data || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    
    // Check if admin (PDS Officer) needs to select a shop
    let finalShopId = formData.shopId
    if (!finalShopId && userRole !== 'STAFF') {
      const selectedShop = prompt('Enter the Shop ID to update inventory (e.g., SHOP001):')
      if (!selectedShop) {
        setFormLoading(false)
        return // User cancelled
      }
      finalShopId = selectedShop.trim().toUpperCase()
      setFormData(prev => ({ ...prev, shopId: finalShopId }))
    }
    
    try {
      await inventoryAPI.updateInventory({ ...formData, shopId: finalShopId })
      setShowModal(false)
      setEditingItem(null)
      setFormData({ shopId: '', riceStock: 0, sugarStock: 0, wheatStock: 0, oilStock: 0, toorDalStock: 0 })
      fetchInventory()
      toast.success('Inventory updated successfully')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update inventory')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      shopId: item.shopId,
      riceStock: item.riceStock,
      sugarStock: item.sugarStock,
      wheatStock: item.wheatStock,
      oilStock: item.oilStock,
      toorDalStock: item.toorDalStock || 0
    })
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    // For admin (PDS Officer), pre-fill with empty shopId (they'll be prompted)
    // For staff, use their shopId
    const staffShopId = userRole === 'STAFF' ? localStorage.getItem('shopId') : ''
    setFormData({ shopId: staffShopId, riceStock: 0, sugarStock: 0, wheatStock: 0, oilStock: 0, toorDalStock: 0 })
    setShowModal(true)
  }

  const handleResetInventory = async () => {
    const confirmed = window.confirm('Reset all inventory stock to zero?')
    if (!confirmed) return
    
    try {
      let shopId = localStorage.getItem('shopId')
      
      // If admin (PDS Officer) with no shopId, prompt them to select
      if (!shopId || shopId === '') {
        const selectedShop = prompt('Enter the Shop ID to reset inventory (e.g., SHOP001):')
        if (!selectedShop) return // User cancelled
        shopId = selectedShop.trim().toUpperCase()
      }
      
      await inventoryAPI.resetInventory(shopId)
      toast.success('Inventory reset to zero!')
      fetchInventory()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset inventory')
    }
  }

  const handleRunSchedule = async () => {
    // Ask for delay days
    const delayInput = prompt('Enter days to delay collection date (e.g., 0 = today, 3 = 3 days later):', '0')
    if (delayInput === null) return // User cancelled
    
    const delayDays = parseInt(delayInput) || 0
    
    const collectionDate = new Date()
    collectionDate.setDate(collectionDate.getDate() + delayDays)
    
    const confirmed = window.confirm(`Run scheduling now?\n\nDelay: ${delayDays} days\nCollection date: ${collectionDate.toDateString()}\n\nThis will schedule pending cards based on available stock.`)
    if (!confirmed) return
    
    try {
      const shopId = localStorage.getItem('shopId')
      const response = await scheduleAPI.runSchedule(shopId, delayDays)
      
      if (response.data.success) {
        toast.success(`Scheduled: ${response.data.scheduledCards} cards, Pending: ${response.data.pendingCards} cards`)
      } else {
        toast.error(`Schedule failed: ${response.data.reason}`)
      }
      fetchInventory()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to run schedule')
    }
  }

  // Process missed users: mark as MISSED and reschedule
  const handleProcessMissed = async () => {
    const confirmed = window.confirm('Process missed users?\n\n1. Mark users with past dates as MISSED\n2. Reschedule them to next available slot\n\nThis will use the configured delay (2 days by default).')
    if (!confirmed) return
    
    try {
      const shopId = localStorage.getItem('shopId')
      const response = await scheduleAPI.processMissed(shopId)
      
      toast.success(`Marked: ${response.data.markedAsMissed}, Rescheduled: ${response.data.rescheduled}`)
      fetchInventory()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to process missed users')
    }
  }

  const totalStock = filteredInventory.reduce((acc, item) => ({
    rice: acc.rice + (item.riceStock || 0),
    sugar: acc.sugar + (item.sugarStock || 0),
    wheat: acc.wheat + (item.wheatStock || 0),
    oil: acc.oil + (item.oilStock || 0),
    toorDal: acc.toorDal + (item.toorDalStock || 0)
  }), { rice: 0, sugar: 0, wheat: 0, oil: 0, toorDal: 0 })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-slate-500 mt-1 text-sm">{userRole === 'STAFF' ? 'View stock details for your shop' : 'Manage stock levels across shops'}</p>
        </div>
        {/* Add Stock - Only for PDS Officer */}
        {userRole !== 'STAFF' && (
          <button
            onClick={handleAdd}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add Stock</span>
          </button>
        )}
        {/* Reset Inventory - Only for PDS Officer */}
        {userRole !== 'STAFF' && (
          <button
            onClick={handleResetInventory}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw size={20} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Summary Cards - Original Style */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card-hover">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
              <span className="text-lg">🌾</span>
            </div>
          </div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Rice (kg)</p>
          <p className="text-2xl font-bold text-slate-900">{totalStock.rice.toLocaleString()}</p>
        </div>
        <div className="card-hover">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-secondary-50 rounded-lg flex items-center justify-center">
              <span className="text-lg">🍬</span>
            </div>
          </div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Sugar (kg)</p>
          <p className="text-2xl font-bold text-slate-900">{totalStock.sugar.toLocaleString()}</p>
        </div>
        <div className="card-hover">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center">
              <span className="text-lg">🌾</span>
            </div>
          </div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Wheat (kg)</p>
          <p className="text-2xl font-bold text-slate-900">{totalStock.wheat.toLocaleString()}</p>
        </div>
        <div className="card-hover">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-warning-50 rounded-lg flex items-center justify-center">
              <span className="text-lg">🫗</span>
            </div>
          </div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Oil (L)</p>
          <p className="text-2xl font-bold text-slate-900">{totalStock.oil.toLocaleString()}</p>
        </div>
        <div className="card-hover">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-danger-50 rounded-lg flex items-center justify-center">
              <span className="text-lg">🫘</span>
            </div>
          </div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Toor Dal (kg)</p>
          <p className="text-2xl font-bold text-slate-900">{totalStock.toorDal.toLocaleString()}</p>
        </div>
      </div>

      {/* Inventory Table - Original Style */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : inventory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No inventory records found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rice (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sugar (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wheat (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Oil (L)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toor Dal (kg)</th>
                {userRole !== 'STAFF' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">{item.shopId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.riceStock || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.sugarStock || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.wheatStock || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.oilStock || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.toorDalStock || 0}</td>
                  {userRole !== 'STAFF' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <Edit2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingItem ? 'Edit Inventory' : 'Add Inventory'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop ID</label>
                  <input
                    type="text"
                    value={formData.shopId}
                    onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                    disabled={!!editingItem}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rice Stock (kg)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.riceStock}
                    onChange={(e) => setFormData({ ...formData, riceStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sugar Stock (kg)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sugarStock}
                    onChange={(e) => setFormData({ ...formData, sugarStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wheat Stock (kg)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.wheatStock}
                    onChange={(e) => setFormData({ ...formData, wheatStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Oil Stock (L)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.oilStock}
                    onChange={(e) => setFormData({ ...formData, oilStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toor Dal Stock (kg)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.toorDalStock}
                    onChange={(e) => setFormData({ ...formData, toorDalStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingItem(null) }}
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
                      {editingItem ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingItem ? 'Update' : 'Add'
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

export default Inventory
