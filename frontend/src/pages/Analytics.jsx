import { useState, useEffect, useRef } from 'react'
import { Users, Package, Calendar, TrendingUp, TrendingDown, AlertTriangle, Ban, ShieldAlert, UserX, Bell, User, RefreshCw, X, Check, Trash2, Info, AlertCircle } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { usersAPI, inventoryAPI, slotsAPI, fraudAPI, notificationsAPI } from '../services/api'

const COLORS = ['#3B82F6', '#14B8A6', '#F59E0B', '#EF4444']

const NOTIFICATION_ICONS = {
  INFO: Info,
  WARNING: AlertTriangle,
  ALERT: AlertCircle,
  FRAUD: ShieldAlert,
  SUCCESS: Check
}

const NOTIFICATION_COLORS = {
  INFO: '#3B82F6',
  WARNING: '#F59E0B',
  ALERT: '#EF4444',
  FRAUD: '#EF4444',
  SUCCESS: '#10B981'
}

function Analytics() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationRef = useRef(null)
  const [stats, setStats] = useState({
    users: [],
    inventory: [],
    slots: []
  })
  const [fraudStats, setFraudStats] = useState(null)

  useEffect(() => {
    fetchData()
    fetchNotifications()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getNotifications(20)
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.unreadCount)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id)
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(notifications.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleDeleteNotification = async (id) => {
    try {
      await notificationsAPI.deleteNotification(id)
      const deleted = notifications.find(n => n.id === id)
      setNotifications(notifications.filter(n => n.id !== id))
      if (deleted && !deleted.read) {
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const fetchData = async () => {
    try {
      const [usersRes, inventoryRes, slotsRes, fraudRes] = await Promise.allSettled([
        usersAPI.getUsers(1, 1000, null),
        inventoryAPI.getInventory(),
        slotsAPI.getSlots(),
        fraudAPI.getStats()
      ])

      let usersData = []
      if (usersRes.status === 'fulfilled') {
        const response = usersRes.value.data
        if (Array.isArray(response)) {
          usersData = response
        } else if (response?.users) {
          usersData = response.users
        }
      }

      let inventoryData = []
      if (inventoryRes.status === 'fulfilled') {
        const response = inventoryRes.value.data
        if (Array.isArray(response)) {
          inventoryData = response
        }
      }

      let slotsData = []
      if (slotsRes.status === 'fulfilled') {
        const response = slotsRes.value.data
        if (Array.isArray(response)) {
          slotsData = response
        }
      }

      if (fraudRes.status === 'fulfilled') {
        setFraudStats(fraudRes.value.data)
      }

      setStats({
        users: usersData,
        inventory: inventoryData,
        slots: slotsData
      })
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const cardTypeData = stats.users.reduce((acc, user) => {
    const existing = acc.find(item => item.name === user.cardType)
    if (existing) {
      existing.value++
    } else {
      acc.push({ name: user.cardType || 'Unknown', value: 1 })
    }
    return acc
  }, [])

  const inventoryData = stats.inventory.map(item => ({
    name: item.shopId || 'Shop',
    rice: item.riceStock || 0,
    wheat: item.wheatStock || 0,
    sugar: item.sugarStock || 0,
    oil: item.oilStock || 0
  }))

  const userStats = [
    { name: 'Total Users', value: stats.users.length, icon: Users, color: '#4F46E5', trend: '+12%', trendUp: true },
    { name: 'Inventory Shops', value: stats.inventory.length, icon: Package, color: '#10B981', trend: '-5%', trendUp: false },
    { name: 'Total Slots', value: stats.slots.length, icon: Calendar, color: '#F59E0B', trend: '+8%', trendUp: true },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-500 mt-1">System insights and statistics</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="p-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <h3 className="font-bold text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => {
                      const IconComponent = NOTIFICATION_ICONS[notification.type] || Info
                      const iconColor = NOTIFICATION_COLORS[notification.type] || '#3B82F6'
                      return (
                        <div 
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            !notification.read ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${iconColor}20` }}
                            >
                              <IconComponent className="w-4 h-4" style={{ color: iconColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 truncate">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <button 
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="w-4 h-4 text-gray-500" />
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button className="p-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
            <User className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {userStats.map((stat) => (
          <div key={stat.name} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{stat.name}</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mt-1">
                  {stat.value.toLocaleString()}
                </p>
                <div className={`flex items-center mt-2 text-sm font-medium ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.trendUp ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {stat.trend}
                  <span className="text-gray-400 ml-1">vs last month</span>
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br rounded-2xl flex items-center justify-center shadow-lg" 
                   style={{ background: `linear-gradient(135deg, ${stat.color}, ${stat.color}99)` }}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fraud & Risk Analytics */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Fraud & Risk Analytics</h2>
            <p className="text-gray-500 text-sm">Monitor suspicious activities and flagged accounts</p>
          </div>
        </div>
        
        {/* Fraud Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200/50 rounded-2xl p-5 hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Total Alerts</p>
                <p className="text-4xl font-bold text-red-700 mt-1">{fraudStats?.totalAlerts || 0}</p>
                <p className="text-red-500 text-xs mt-1">This week</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 rounded-2xl p-5 hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Suspicious</p>
                <p className="text-4xl font-bold text-orange-700 mt-1">{fraudStats?.suspiciousUsers || 0}</p>
                <p className="text-orange-500 text-xs mt-1">Users</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                <UserX className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-red-50 border border-yellow-200/50 rounded-2xl p-5 hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 text-sm font-medium">Flagged</p>
                <p className="text-4xl font-bold text-yellow-700 mt-1">{fraudStats?.flaggedAccounts || 0}</p>
                <p className="text-yellow-600 text-xs mt-1">Accounts</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <Ban className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Fraud Trend Chart & Severity Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fraud Trend Line Chart */}
          <div className="border border-gray-200/50 rounded-2xl p-5">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Fraud Trend (Last 7 Days)</h3>
            {fraudStats?.fraudTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={fraudStats.fraudTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#EF4444" strokeWidth={3} dot={{ fill: '#EF4444', strokeWidth: 2 }} name="Fraud Alerts" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>No fraud trend data available</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Severity Breakdown Pie Chart */}
          <div className="border border-gray-200/50 rounded-2xl p-5">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Severity Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'High', value: fraudStats?.severityBreakdown?.HIGH || 0 },
                    { name: 'Medium', value: fraudStats?.severityBreakdown?.MEDIUM || 0 },
                    { name: 'Low', value: fraudStats?.severityBreakdown?.LOW || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'High', value: fraudStats?.severityBreakdown?.HIGH || 0 },
                    { name: 'Medium', value: fraudStats?.severityBreakdown?.MEDIUM || 0 },
                    { name: 'Low', value: fraudStats?.severityBreakdown?.LOW || 0 }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#EF4444', '#F59E0B', '#10B981'][index]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Type Distribution */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">User Card Type Distribution</h2>
          {cardTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={cardTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cardTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No user data available
            </div>
          )}
        </div>

        {/* Inventory Overview */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Inventory by Shop</h2>
          {inventoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="rice" fill="#4F46E5" name="Rice" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wheat" fill="#10B981" name="Wheat" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No inventory data available
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">System Summary</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50/80 rounded-xl">
            <p className="text-sm text-gray-500">Active Users</p>
            <p className="text-2xl font-bold text-gray-800">{stats.users.length.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-gray-50/80 rounded-xl">
            <p className="text-sm text-gray-500">Total Inventory</p>
            <p className="text-2xl font-bold text-gray-800">{stats.inventory.length} shops</p>
          </div>
          <div className="p-4 bg-gray-50/80 rounded-xl">
            <p className="text-sm text-gray-500">Scheduled Slots</p>
            <p className="text-2xl font-bold text-gray-800">{stats.slots.length}</p>
          </div>
          <div className="p-4 bg-gray-50/80 rounded-xl">
            <p className="text-sm text-gray-500">Card Types</p>
            <p className="text-2xl font-bold text-gray-800">{cardTypeData.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
