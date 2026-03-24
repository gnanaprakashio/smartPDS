import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Package, Calendar, TrendingUp, ArrowRight, Database, Server, Sparkles, Shield, CheckCircle, Clock, AlertTriangle, Percent } from 'lucide-react'
import { usersAPI, inventoryAPI, slotsAPI, scheduleAPI } from '../services/api'

function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInventory: 0,
    totalSlots: 0,
    loading: true
  })
  const [todaySummary, setTodaySummary] = useState({
    totalScheduled: 0,
    collected: 0,
    pending: 0,
    missed: 0,
    completionRate: 0
  })

  useEffect(() => {
    fetchDashboardData()
    fetchTodaySummary()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [usersRes, inventoryRes, slotsRes] = await Promise.allSettled([
        usersAPI.getUsers(),
        inventoryAPI.getInventory(),
        slotsAPI.getSlots()
      ])

      let users = 0
      if (usersRes.status === 'fulfilled') {
        const data = usersRes.value.data
        users = Array.isArray(data) ? data.length : (data?.users?.length || 0)
      }

      let inventory = 0
      if (inventoryRes.status === 'fulfilled') {
        inventory = Array.isArray(inventoryRes.value.data) ? inventoryRes.value.data.length : 0
      }

      let slots = 0
      if (slotsRes.status === 'fulfilled') {
        slots = Array.isArray(slotsRes.value.data) ? slotsRes.value.data.length : 0
      }

      setStats({
        totalUsers: users,
        totalInventory: inventory,
        totalSlots: slots,
        loading: false
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  const fetchTodaySummary = async () => {
    try {
      const res = await scheduleAPI.getTodaySummary()
      setTodaySummary(res.data)
    } catch (error) {
      console.error('Error fetching today summary:', error)
    }
  }

  const statCards = [
    { 
      name: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'bg-primary-500',
      textColor: 'text-primary-600',
      bgColor: 'bg-primary-50'
    },
    { 
      name: 'Inventory Items', 
      value: stats.totalInventory, 
      icon: Package, 
      color: 'bg-secondary-500',
      textColor: 'text-secondary-600',
      bgColor: 'bg-secondary-50'
    },
    { 
      name: 'Active Slots', 
      value: stats.totalSlots, 
      icon: Calendar, 
      color: 'bg-accent-500',
      textColor: 'text-accent-600',
      bgColor: 'bg-accent-50'
    },
    { 
      name: 'System Status', 
      value: 'Healthy', 
      icon: Shield, 
      color: 'bg-success-500',
      textColor: 'text-success-600',
      bgColor: 'bg-success-50'
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of SPDS - Smart Public Distribution System</p>
      </div>

      {/* Today's Summary */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Today's Summary</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Collected</span>
            </div>
            <p className="text-3xl font-bold text-green-700">{todaySummary.collected}</p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Pending</span>
            </div>
            <p className="text-3xl font-bold text-amber-700">{todaySummary.pending}</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Completion</span>
            </div>
            <p className="text-3xl font-bold text-blue-700">{todaySummary.completionRate}%</p>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">Missed</span>
            </div>
            <p className="text-3xl font-bold text-red-700">{todaySummary.missed}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="card-hover group">
            <div className="flex items-center justify-between mb-4">
              <div className={`stats-icon ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <TrendingUp className="w-5 h-5 text-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">
              {stat.loading ? '...' : stat.value}
            </p>
            <p className="text-sm text-slate-500">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          <span className="text-sm text-slate-400">Common tasks</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/users"
            className="group flex items-center justify-between p-5 bg-primary-50 rounded-xl hover:bg-primary-100 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Manage Users</p>
                <p className="text-sm text-slate-500">View & collect ration</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-primary-500 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            to="/inventory"
            className="group flex items-center justify-between p-5 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Update Inventory</p>
                <p className="text-sm text-slate-500">Stock management</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-secondary-500 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            to="/slots"
            className="group flex items-center justify-between p-5 bg-accent-50 rounded-xl hover:bg-accent-100 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Time Slots</p>
                <p className="text-sm text-slate-500">Schedule management</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-accent-500 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* System Status */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <Server className="w-5 h-5 text-primary-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">System Status</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-slate-400" />
              <span className="text-slate-600">Database</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-success-600">Connected</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-slate-400" />
              <span className="text-slate-600">API Server</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-success-600">Running</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-slate-400" />
              <span className="text-slate-600">AI Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-success-600">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
