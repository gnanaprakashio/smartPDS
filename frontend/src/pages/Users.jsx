import { useState, useEffect, useRef } from 'react'
import { Users as UsersIcon, Plus, Search, Upload, Check, X, Clock, Package, Trash2, Filter, RefreshCw, CreditCard, Users, Calendar, Phone, MapPin, ChevronRight, User, Wheat, Scale } from 'lucide-react'
import { usersAPI, scheduleAPI } from '../services/api'

function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showCollectModal, setShowCollectModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [enteredOtp, setEnteredOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [collectData, setCollectData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [shopId, setShopId] = useState('')
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState('')
  const [showCSVModal, setShowCSVModal] = useState(false)
  const [csvShopId, setCsvShopId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')  // For filtering by status
  const [cardTypeFilter, setCardTypeFilter] = useState('')  // For filtering by card type
  const [slotTimingFilter, setSlotTimingFilter] = useState('')  // For filtering by slot timing
  const [showPanel, setShowPanel] = useState(false)  // Slide-in panel
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [cardCounts, setCardCounts] = useState({ AAY: 0, PHH: 0, NPHH: 0, NPHH_S: 0 })
  // Display users from API (with server-side filtering) or search results
  const displayUsers = searchResults || users

  // Debounced search effect - calls backend API when searching
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsSearching(true)
        try {
          const response = await usersAPI.searchUsers(searchTerm.trim())
          if (response.data && response.data.users) {
            setSearchResults(response.data.users)
          }
        } catch (error) {
          console.error('Search error:', error)
          setSearchResults(null)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults(null)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(searchTimeout)
  }, [searchTerm])

  // Get unique time slots for filter dropdown
  const uniqueTimeSlots = [...new Set(users.map(u => u.timeSlot).filter(Boolean))]

  // Handle opening user details panel
  const handleUserClick = (user) => {
    setSelectedUser(user)
    setShowPanel(true)
  }

  const [formData, setFormData] = useState({
    rationCardNumber: '',
    name: '',
    phone: '',
    members: 1,
    cardType: 'PHH',
    shopId: ''
  })

  useEffect(() => {
    fetchUsers()
    fetchCardCounts()
    fetchShops()
    // Get user role and shopId from localStorage
    const role = localStorage.getItem('role')
    const storedShopId = localStorage.getItem('shopId')
    setUserRole(role)
    setShopId(storedShopId || '')
    if (storedShopId) {
      setFormData(prev => ({ ...prev, shopId: storedShopId }))
    }
  }, [])

  // Fetch all shops (for PDS Officer)
  const fetchShops = async () => {
    try {
      const role = localStorage.getItem('role')
      // Only PDS Officer can see all shops filter
      if (role === 'PDS_OFFICER') {
        const response = await usersAPI.getShops()
        if (response.data) {
          setShops(response.data)
        }
      }
    } catch (error) {
      console.error('Error fetching shops:', error)
    }
  }

  const fetchUsers = async (page = 1) => {
    try {
      const response = await usersAPI.getUsers(page, 20, selectedShop || null, statusFilter || null, cardTypeFilter || null, slotTimingFilter || null)
      // Handle both paginated and non-paginated responses
      if (response.data.users) {
        setUsers(response.data.users)
        setPagination(response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
      } else {
        setUsers(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch card type counts
  const fetchCardCounts = async () => {
    try {
      const response = await usersAPI.getCardCounts(selectedShop || null)
      if (response.data) {
        setCardCounts(response.data)
      }
    } catch (error) {
      console.error('Error fetching card counts:', error)
    }
  }

  // Handle delete all users (PDS Officer only)
  const handleDeleteAllUsers = async () => {
    const confirmed = window.confirm('Are you sure you want to delete ALL users? This action cannot be undone!')
    if (!confirmed) return
    
    const doubleConfirm = window.confirm('This will permanently delete all users. Continue?')
    if (!doubleConfirm) return
    
    try {
      const currentShopId = localStorage.getItem('shopId')
      const response = await usersAPI.deleteAllUsers(currentShopId || null)
      alert(response.data.message)
      fetchUsers()
      fetchCardCounts()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete users')
    }
  }

  // Handle reschedule missed users (Staff only)
  const handleReschedule = async () => {
    const confirmed = window.confirm('Reschedule MISSED users?\n\nThis will:\n1. Assign new slots to users with MISSED status\n2. Send new OTP notifications to them\n\nContinue?')
    if (!confirmed) return
    
    try {
      const currentShopId = localStorage.getItem('shopId')
      const response = await scheduleAPI.processMissed(currentShopId)
      
      alert(`Reschedule Complete!\n\nRescheduled: ${response.data.rescheduled} users\nOTP Notifications Sent: ${response.data.otpNotified}\nStill Pending: ${response.data.stillPending}\n\nNew Collection Date: ${response.data.newCollectionDate}`)
      
      // Refresh the users list
      fetchUsers()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to reschedule users')
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setLoading(true)
      fetchUsers(newPage)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataWithShop = { ...formData, shopId: shopId || formData.shopId }
      await usersAPI.register(dataWithShop)
      setShowModal(false)
      setFormData({ rationCardNumber: '', name: '', phone: '', members: 1, cardType: 'PHH', shopId: shopId || '' })
      fetchUsers()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to register user')
    }
  }

  // Handle CSV file upload
  const fileInputRef = useRef(null)

  const handleUploadCSV = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    
    // For PDS Officer, use the selected shop from CSV modal
    // For Staff, use their assigned shop
    const currentShopId = userRole === 'PDS_OFFICER' ? csvShopId : localStorage.getItem('shopId')
    if (currentShopId) {
      formData.append('shopId', currentShopId.trim())
    }

    try {
      const response = await usersAPI.uploadCSV(formData)
      const { totalRows, inserted, skippedDuplicates, errors } = response.data
      
      let message = `CSV uploaded!\nTotal rows: ${totalRows}\nInserted: ${inserted}\nSkipped duplicates: ${skippedDuplicates}`
      if (errors && errors.length > 0) {
        message += `\n\nFirst error: ${errors[0]}`
        message += `\nAll errors shown in console`
        console.log('All CSV errors:', errors)
      }
      alert(message)
      
      // Refresh users list and card counts
      fetchUsers()
      fetchCardCounts()
      setShowCSVModal(false)
      setCsvShopId('')
    } catch (error) {
      console.error('CSV upload error:', error)
      alert(error.response?.data?.error || 'Failed to upload CSV')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle opening collect modal - shows OTP and stock before confirming
  const handleCollectClick = (user) => {
    setSelectedUser(user)
    setEnteredOtp('')
    setOtpError('')
    setShowCollectModal(true)
  }

  // Handle confirming collection - with OTP verification
  const handleConfirmCollect = async () => {
    if (!selectedUser) return
    
    // Verify OTP entered by user
    if (!enteredOtp) {
      setOtpError('Please enter OTP')
      return
    }
    
    if (enteredOtp !== selectedUser.otp) {
      setOtpError('Invalid OTP - please verify with user')
      return
    }
    
    setOtpError('')
    
    try {
      const response = await usersAPI.updateUser(selectedUser.id, { collected: true })
      setCollectData(response.data)
      
      alert(`Ration Collected Successfully!\n\nStock remaining: Rice ${response.data.stockAfter?.riceStock || 0}kg, Wheat ${response.data.stockAfter?.wheatStock || 0}kg`)
      
      setShowCollectModal(false)
      setSelectedUser(null)
      setEnteredOtp('')
      setCollectData(null)
      // Refresh users list
      fetchUsers()
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to collect ration'
      alert(errorMsg)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Users</h1>
          <p className="text-text-secondary mt-1">Manage ration card holders</p>
          {/* Card Type Counts */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
              <span className="badge badge-danger">AAY</span>
              <span className="text-lg font-bold text-red-700">{cardCounts.AAY || 0}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
              <span className="badge badge-success">PHH</span>
              <span className="text-lg font-bold text-green-700">{cardCounts.PHH || 0}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <span className="badge badge-gray">NPHH</span>
              <span className="text-lg font-bold text-gray-700">{cardCounts.NPHH || 0}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg">
              <span className="badge badge-yellow">NPHH-S</span>
              <span className="text-lg font-bold text-yellow-700">{cardCounts.NPHH_S || 0}</span>
            </div>
            <div className="text-sm text-text-muted">
              (Total: {cardCounts.AAY + cardCounts.PHH + cardCounts.NPHH + cardCounts.NPHH_S})
            </div>
          </div>
          {/* Shop Filter Dropdown - Only for PDS Officer */}
          {userRole === 'PDS_OFFICER' && shops.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <Filter size={16} className="text-text-muted" />
              <select
                value={selectedShop}
                onChange={async (e) => {
                  const shopValue = e.target.value
                  setSelectedShop(shopValue)
                  setLoading(true)
                  try {
                    // Fetch users for selected shop with all filters
                    const response = await usersAPI.getUsers(1, 20, shopValue || null, statusFilter || null, cardTypeFilter || null, slotTimingFilter || null)
                    if (response.data.users) {
                      setUsers(response.data.users)
                      setPagination(response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
                    } else {
                      setUsers(response.data || [])
                    }
                    // Fetch card counts for selected shop
                    const countsResponse = await usersAPI.getCardCounts(shopValue || null)
                    if (countsResponse.data) {
                      setCardCounts(countsResponse.data)
                    }
                  } catch (error) {
                    console.error('Error fetching users:', error)
                  } finally {
                    setLoading(false)
                  }
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Shops</option>
                {shops.map((shop) => (
                  <option key={shop} value={shop}>
                    {shop}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Add User - Only for PDS Officer and Staff */}
          {(userRole === 'PDS_OFFICER' || userRole === 'STAFF') && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              <Plus size={20} />
              <span>Add User</span>
            </button>
          )}
          {/* CSV Upload - Only for PDS Officer */}
          {userRole === 'PDS_OFFICER' && (
            <>
              <button
                onClick={() => setShowCSVModal(true)}
                className="btn-secondary"
              >
                <Upload size={20} />
                <span>Upload CSV</span>
              </button>
            </>
          )}
          {/* Reschedule - Only for Staff when MISSED status is selected */}
          {userRole === 'STAFF' && statusFilter === 'MISSED' && (
            <button
              onClick={handleReschedule}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-colors"
            >
              <RefreshCw size={20} />
              <span>Reschedule</span>
            </button>
          )}
          {/* Delete All Users - Only for PDS Officer */}
          {userRole === 'PDS_OFFICER' && (
            <button
              onClick={handleDeleteAllUsers}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl transition-colors"
            >
              <Trash2 size={20} />
              <span>Remove All</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
            <input
              type="text"
              placeholder="Search by name, ration card number, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-12 w-full"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-5 w-5 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
              </div>
            )}
            {searchTerm && !isSearching && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSearchResults(null)
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          {/* Card Type Filter */}
          <select
            value={cardTypeFilter}
            onChange={async (e) => {
              const newCardType = e.target.value
              setCardTypeFilter(newCardType)
              setSearchResults(null)
              setLoading(true)
              try {
                const response = await usersAPI.getUsers(1, 20, selectedShop || null, statusFilter || null, newCardType || null, slotTimingFilter || null)
                if (response.data.users) {
                  setUsers(response.data.users)
                  setPagination(response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
                } else {
                  setUsers(response.data || [])
                }
              } catch (error) {
                console.error('Error filtering users:', error)
              } finally {
                setLoading(false)
              }
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[140px]"
          >
            <option value="">All Card Types</option>
            <option value="AAY">AAY</option>
            <option value="PHH">PHH</option>
            <option value="NPHH">NPHH</option>
            <option value="NPHH_S">NPHH-S</option>
          </select>
          
          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={async (e) => {
              const newStatus = e.target.value
              setStatusFilter(newStatus)
              setSearchResults(null)
              setLoading(true)
              try {
                const response = await usersAPI.getUsers(1, 20, selectedShop || null, newStatus || null, cardTypeFilter || null, slotTimingFilter || null)
                if (response.data.users) {
                  setUsers(response.data.users)
                  setPagination(response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
                } else {
                  setUsers(response.data || [])
                }
              } catch (error) {
                console.error('Error filtering users:', error)
              } finally {
                setLoading(false)
              }
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[140px]"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="MISSED">Missed</option>
          </select>
          
          {/* Slot Timing Filter */}
          <select
            value={slotTimingFilter}
            onChange={async (e) => {
              const newSlot = e.target.value
              setSlotTimingFilter(newSlot)
              setSearchResults(null)
              setLoading(true)
              try {
                const response = await usersAPI.getUsers(1, 20, selectedShop || null, statusFilter || null, cardTypeFilter || null, newSlot || null)
                if (response.data.users) {
                  setUsers(response.data.users)
                  setPagination(response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
                } else {
                  setUsers(response.data || [])
                }
              } catch (error) {
                console.error('Error filtering users:', error)
              } finally {
                setLoading(false)
              }
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[160px]"
          >
            <option value="">All Time Slots</option>
            {uniqueTimeSlots.map(slot => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>
        {/* Active Filters Display */}
        {(cardTypeFilter || statusFilter || slotTimingFilter) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-sm text-text-muted">Active filters:</span>
            {cardTypeFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                <CreditCard size={12} /> {cardTypeFilter}
                <button onClick={async () => { 
                  setCardTypeFilter('')
                  setLoading(true)
                  try {
                    const response = await usersAPI.getUsers(1, 20, selectedShop || null, statusFilter || null, null, slotTimingFilter || null)
                    if (response.data.users) {
                      setUsers(response.data.users)
                      setPagination(response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
                    }
                  } catch (error) {
                    console.error('Error clearing filter:', error)
                  } finally {
                    setLoading(false)
                  }
                }} className="ml-1 hover:text-indigo-900">
                  <X size={12} />
                </button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                <Clock size={12} /> {statusFilter}
                <button onClick={async () => { 
                  setStatusFilter('')
                  setLoading(true)
                  try {
                    const response = await usersAPI.getUsers(1, 20, selectedShop || null, null, cardTypeFilter || null, slotTimingFilter || null)
                    if (response.data.users) {
                      setUsers(response.data.users)
                      setPagination(response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
                    }
                  } catch (error) {
                    console.error('Error clearing filter:', error)
                  } finally {
                    setLoading(false)
                  }
                }} className="ml-1 hover:text-blue-900">
                  <X size={12} />
                </button>
              </span>
            )}
            {slotTimingFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                <Calendar size={12} /> {slotTimingFilter}
                <button onClick={async () => { 
                  setSlotTimingFilter('')
                  setLoading(true)
                  try {
                    const response = await usersAPI.getUsers(1, 20, selectedShop || null, statusFilter || null, cardTypeFilter || null, null)
                    if (response.data.users) {
                      setUsers(response.data.users)
                      setPagination(response.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
                    }
                  } catch (error) {
                    console.error('Error clearing filter:', error)
                  } finally {
                    setLoading(false)
                  }
                }} className="ml-1 hover:text-amber-900">
                  <X size={12} />
                </button>
              </span>
            )}
            <button 
              onClick={() => { 
                setCardTypeFilter(''); 
                setStatusFilter(''); 
                setSlotTimingFilter(''); 
                setSearchResults(null);
                setLoading(true);
                usersAPI.getUsers(1, 20, selectedShop || null, null, null, null).then(res => {
                  if (res.data.users) {
                    setUsers(res.data.users)
                    setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
                  }
                }).catch(err => console.error('Error clearing filters:', err))
                .finally(() => setLoading(false))
              }}
              className="text-xs text-text-muted hover:text-red-600 ml-2 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="spinner"></div>
          </div>
        ) : displayUsers.length === 0 ? (
          <div className="empty-state">
            <UsersIcon className="empty-state-icon" />
            <h3 className="empty-state-title">No users found</h3>
            <p className="empty-state-description">
              {searchTerm || cardTypeFilter || statusFilter || slotTimingFilter 
                ? 'No users match your current filters. Try adjusting your search criteria.'
                : 'Upload a CSV file or add users manually to get started.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full">
              <thead className="sticky top-0 bg-gradient-to-r from-slate-50 to-gray-50 z-10">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Shop</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ration Card</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Members</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Card Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Slot</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">OTP</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Collect</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayUsers.map((user, index) => (
                  <tr 
                    key={user.id} 
                    onClick={() => handleUserClick(user)}
                    className={`hover:bg-indigo-50/50 cursor-pointer transition-colors duration-150 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                        {user.shopId || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 text-sm">{user.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-sm font-mono">{user.rationCardNumber}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-gray-400" />
                        {user.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                        <Users size={12} />
                        {user.members || 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                        user.cardType === 'AAY' ? 'bg-red-100 text-red-700' :
                        user.cardType === 'PHH' ? 'bg-green-100 text-green-700' :
                        user.cardType === 'NPHH' ? 'bg-gray-100 text-gray-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        <CreditCard size={12} />
                        {user.cardType}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {user.slotNumber ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          <Calendar size={12} />
                          Slot {user.slotNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-sm">
                      {user.timeSlot ? (
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <Clock size={12} className="text-gray-400" />
                          {user.timeSlot}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {user.otp ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full" title="OTP Sent">
                          <Check size={14} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-300 rounded-full" title="OTP Not Sent">
                          <X size={14} />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCollectClick(user) }}
                        disabled={user.collected}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${
                          user.collected 
                            ? 'bg-green-100 text-green-600 cursor-default' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110'
                        }`}
                        title={user.collected ? 'Ration Collected' : 'Click to Collect Ration'}
                      >
                        <Check size={16} />
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                        user.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        user.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                        user.status === 'MISSED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.status === 'COMPLETED' && <Check size={12} />}
                        {user.status === 'SCHEDULED' && <Clock size={12} />}
                        {user.status === 'MISSED' && <X size={12} />}
                        {user.status === 'PENDING' && <Clock size={12} />}
                        {user.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <ChevronRight size={16} className="text-gray-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
            <h2 className="text-xl font-bold text-text-primary mb-6">Register New User</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ration Card Number</label>
                  <input
                    type="text"
                    value={formData.rationCardNumber}
                    onChange={(e) => setFormData({ ...formData, rationCardNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. of Family Members</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.members}
                    onChange={(e) => setFormData({ ...formData, members: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Type</label>
                  <select
                    value={formData.cardType}
                    onChange={(e) => setFormData({ ...formData, cardType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="AAY">AAY (Antyodaya Anna Yojana)</option>
                    <option value="PHH">PHH (Priority Household)</option>
                    <option value="NPHH">NPHH (Non-Priority Household)</option>
                    <option value="NPHH_S">NPHH-S (Sugar Card)</option>
                  </select>
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
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Ration Modal */}
      {showCollectModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
            <h2 className="text-xl font-bold text-text-primary mb-6">Collect Ration</h2>
            
            <div className="space-y-4">
              {/* User Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-2">User Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Name:</span> <span className="font-medium">{selectedUser.name}</span></div>
                  <div><span className="text-gray-500">Card:</span> <span className="font-medium">{selectedUser.rationCardNumber}</span></div>
                  <div><span className="text-gray-500">Members:</span> <span className="font-medium">{selectedUser.members || 1} 👤</span></div>
                  <div><span className="text-gray-500">Type:</span> <span className="font-medium">{selectedUser.cardType}</span></div>
                  <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{selectedUser.phone}</span></div>
                </div>
              </div>

              {/* OTP Input - User must provide OTP */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <label className="block text-sm font-medium text-yellow-800 mb-2">
                  Enter OTP from user to confirm:
                </label>
                <input
                  type="text"
                  value={enteredOtp}
                  onChange={(e) => {
                    setEnteredOtp(e.target.value)
                    setOtpError('')
                  }}
                  placeholder="Enter 4-digit OTP"
                  maxLength={4}
                  className={`w-full px-4 py-3 text-center text-xl font-mono tracking-widest border-2 rounded-lg focus:outline-none focus:ring-2 ${
                    otpError 
                      ? 'border-red-300 focus:ring-red-200 bg-red-50' 
                      : 'border-yellow-300 focus:ring-yellow-200 bg-white'
                  }`}
                />
                {otpError && (
                  <p className="mt-2 text-sm text-red-600 text-center">{otpError}</p>
                )}
                <p className="mt-2 text-xs text-yellow-700 text-center">
                  Ask the user for the OTP sent to their phone
                </p>
              </div>

              {/* Stock Info */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-medium text-green-800 mb-2">
                  TNPDS Stock for {selectedUser.members || 1} Member(s) ({selectedUser.cardType})
                </h3>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="bg-white rounded p-2">
                    <div className="text-lg font-bold text-gray-800">
                      {/* AAY & NPHH = FIXED per card, PHH = per person */}
                      {(selectedUser.cardType === 'AAY' ? 35 : selectedUser.cardType === 'NPHH' ? 12 : selectedUser.cardType === 'PHH' ? 5 * (selectedUser.members || 1) : 0)}kg
                    </div>
                    <div className="text-xs text-gray-500">Rice</div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="text-lg font-bold text-gray-800">
                      {/* Fixed 5kg per card (not per person) */}
                      {selectedUser.cardType === 'NPHH_S' ? 0 : 5}kg
                    </div>
                    <div className="text-xs text-gray-500">Wheat</div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="text-lg font-bold text-gray-800">
                      {(selectedUser.cardType === 'NPHH_S' ? (0.5 * (selectedUser.members || 1) + 3) : (selectedUser.cardType === 'AAY' ? 1.5 : selectedUser.cardType === 'PHH' ? 0.5 : 0.5) * (selectedUser.members || 1)).toFixed(1)}kg
                    </div>
                    <div className="text-xs text-gray-500">Sugar</div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="text-lg font-bold text-gray-800">
                      {Math.min((selectedUser.cardType === 'NPHH_S' ? 1 : (selectedUser.cardType === 'AAY' ? 1 : selectedUser.cardType === 'PHH' ? 1 : 1)) * (selectedUser.members || 1), 1)}L
                    </div>
                    <div className="text-xs text-gray-500">Oil (max 1L)</div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="text-lg font-bold text-gray-800">
                      {/* Fixed 1kg per card (not per person) */}
                      {selectedUser.cardType === 'NPHH_S' ? 0 : 1}kg
                    </div>
                    <div className="text-xs text-gray-500">Toor Dal</div>
                  </div>
                </div>
              </div>

              {/* Slot Info */}
              {selectedUser.slotNumber && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-700">Slot:</span>
                    <span className="font-bold text-purple-800">#{selectedUser.slotNumber}</span>
                    <span className="text-purple-700">Time:</span>
                    <span className="font-bold text-purple-800">{selectedUser.timeSlot || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCollectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCollect}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Check size={20} className="mr-2" />
                Confirm Collect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Upload Modal - Only for PDS Officer */}
      {showCSVModal && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
            <h2 className="text-xl font-bold text-text-primary mb-6">Upload CSV for Shop</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <input
                  type="text"
                  value={csvShopId}
                  onChange={(e) => setCsvShopId(e.target.value.toUpperCase().trim())}
                  placeholder="Enter new or existing shop name (e.g., SHOP014)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter a new shop name to create users for a new shop, or an existing shop name
                </p>
              </div>

              {csvShopId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select CSV File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleUploadCSV}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    CSV should contain: card_number, name, phone_number, card_type, members, area, reputation
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => { setShowCSVModal(false); setCsvShopId('') }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-in User Details Panel */}
      {showPanel && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowPanel(false)}
          />
          
          {/* Panel */}
          <div className="relative w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">User Details</h2>
                  <p className="text-indigo-200 text-xs">Complete information</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPanel(false)}
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Info Card */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <User size={16} className="text-indigo-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="font-medium text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="font-medium text-gray-900">{selectedUser.phone}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Ration Card Number</p>
                    <p className="font-mono font-medium text-gray-900">{selectedUser.rationCardNumber}</p>
                  </div>
                </div>
              </div>

              {/* Card Type & Members */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard size={16} className="text-red-600" />
                    <p className="text-xs text-red-600 font-medium">Card Type</p>
                  </div>
                  <p className="text-2xl font-bold text-red-700">{selectedUser.cardType}</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-indigo-600" />
                    <p className="text-xs text-indigo-600 font-medium">Members</p>
                  </div>
                  <p className="text-2xl font-bold text-indigo-700">{selectedUser.members || 1}</p>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-600" />
                  Schedule Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Slot Number</p>
                    <p className="font-medium text-gray-900">{selectedUser.slotNumber || '-'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Time Slot</p>
                    <p className="font-medium text-gray-900">{selectedUser.timeSlot || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Status & Collection */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Clock size={16} className="text-indigo-600" />
                  Status & Collection
                </h3>
                <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${
                      selectedUser.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      selectedUser.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                      selectedUser.status === 'MISSED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedUser.status === 'COMPLETED' && <Check size={14} />}
                      {selectedUser.status === 'SCHEDULED' && <Clock size={14} />}
                      {selectedUser.status === 'MISSED' && <X size={14} />}
                      {selectedUser.status || 'PENDING'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedUser.collected ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                        <Check size={14} /> Collected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                        <Clock size={14} /> Pending
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">OTP Status</p>
                  <div className="flex items-center gap-2">
                    {selectedUser.otp ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <Check size={12} /> Sent
                        </span>
                        <span className="text-xs text-gray-500">Code: {selectedUser.otp}</span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        <X size={12} /> Not Sent
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Shop Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-indigo-600" />
                  Shop Information
                </h3>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Assigned Shop ID</p>
                  <p className="font-medium text-gray-900">{selectedUser.shopId || 'Not Assigned'}</p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  handleCollectClick(selectedUser)
                  setShowPanel(false)
                }}
                disabled={selectedUser.collected}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  selectedUser.collected
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Check size={18} />
                {selectedUser.collected ? 'Collected' : 'Collect Ration'}
              </button>
              <button
                onClick={() => setShowPanel(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage

