import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Calendar, 
  BarChart3,
  LogOut,
  Menu,
  X,
  Shield,
  User,
  FileText,
  Settings,
  ClipboardList,
  Send,
  CheckSquare
} from 'lucide-react'

function AdminLayout({ onLogout, userRole }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const role = userRole || localStorage.getItem('role')

  // Navigation items with sections
  const getNavItems = () => {
    const sections = []

    // MAIN Section
    sections.push({
      section: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ]
    })

    // MANAGEMENT Section
    sections.push({
      section: 'MANAGEMENT',
      items: [
        { name: 'Users', path: '/users', icon: Users },
      ]
    })

    // Add Inventory for PDS Officer and Staff
    if (role === 'PDS_OFFICER' || role === 'STAFF') {
      sections[1].items.push({ name: 'Inventory', path: '/inventory', icon: Package })
    }

    sections[1].items.push({ name: 'Slots', path: '/slots', icon: Calendar })

    // REPORTS Section
    sections.push({
      section: 'REPORTS',
      items: [
        { name: 'Analytics', path: '/analytics', icon: BarChart3 },
      ]
    })

    // REPUTATION MANAGEMENT Section
    sections.push({
      section: 'REPUTATION',
      items: []
    })

    // Staff: Send Request to PDS Officer
    if (role === 'STAFF') {
      sections[2].items.push({ name: 'Staff Report', path: '/staff-requests', icon: Send })
    }

    // PDS Officer: View & Approve Requests
    if (role === 'PDS_OFFICER') {
      sections[2].items.push({ name: 'Officer Panel', path: '/officer-requests', icon: CheckSquare })
    }

    return sections
  }

  const navSections = getNavItems()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header - Dark Theme */}
      <header className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 fixed top-0 left-0 right-0 z-50 h-16">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-700 transition-colors"
            >
              {sidebarOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">SPDS</h1>
                <p className="text-xs text-slate-400">Smart Ration Distribution System</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {role && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-xl border border-slate-600">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-white">
                  {role === 'PDS_OFFICER' ? 'PDS Officer' : 'Staff Member'}
                </span>
              </div>
            )}
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 text-slate-300 hover:text-red-400 hover:bg-red-500/20 px-3 py-2 rounded-xl transition-all duration-200"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar - Dark Gradient with Sections */}
      <aside 
        className={`fixed top-16 left-0 h-[calc(100vh-64px)] ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800 transform transition-all duration-300 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
            {navSections.map((section, sectionIndex) => (
              <div key={section.section}>
                {/* Section Label */}
                {!sidebarCollapsed && (
                  <p className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {section.section}
                  </p>
                )}
                {sidebarCollapsed && (
                  <div className="w-full border-b border-slate-700 mb-4"></div>
                )}
                
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-primary-600/20 text-white border-l-4 border-primary-500 -ml-1 pl-5 shadow-lg shadow-primary-600/20'
                              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                          }`
                        }
                      >
                        <Icon size={20} className="flex-shrink-0" />
                        {!sidebarCollapsed && (
                          <span className="font-medium">{item.name}</span>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Sidebar Footer - Collapse Button */}
          <div className="p-4 border-t border-slate-700">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200"
            >
              {sidebarCollapsed ? (
                <span className="text-lg">→</span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">← Collapse</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`pt-16 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} min-h-screen transition-all duration-300 bg-slate-50`}>
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
