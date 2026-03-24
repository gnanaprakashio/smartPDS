import { ShieldAlert, UserX, AlertCircle, Zap, Ban, RotateCcw } from 'lucide-react';
import { useState } from 'react';

const Fraud = () => {
  const [activeTab, setActiveTab] = useState('alerts');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const fraudAlerts = [
    {
      id: '1',
      user: 'Ravi Kumar',
      rationCard: 'TN123456789',
      type: 'multiple_cards',
      severity: 'HIGH',
      details: 'Same card used 4 times today',
      timestamp: '2 min ago',
      status: 'pending'
    },
    {
      id: '2',
      user: 'Priya R',
      rationCard: 'TN234567890',
      type: 'otp_fails',
      severity: 'MEDIUM',
      details: '5 failed OTP attempts',
      timestamp: '15 min ago',
      status: 'pending'
    },
    {
      id: '3',
      user: 'Ahmed Khan',
      rationCard: 'TN345678901',
      type: 'slot_skipping',
      severity: 'LOW',
      details: 'Skipped 3 consecutive slots',
      timestamp: '1 hr ago',
      status: 'action_taken'
    }
  ];

  const adminActions = [
    { name: 'Suspend Card', icon: Ban, color: 'red' },
    { name: 'Manual Verify', icon: UserX, color: 'orange' },
    { name: 'Reset Reputation', icon: RotateCcw, color: 'blue' }
  ];

  const handleAdminAction = (action, alertId) => {
    // API call to /api/fraud/action
    console.log('Admin action:', action, 'on alert:', alertId);
  };

  const severityColor = (severity) => {
    switch (severity) {
      case 'HIGH': return 'from-red-500 to-orange-500';
      case 'MEDIUM': return 'from-yellow-500 to-amber-500';
      default: return 'from-emerald-500 to-green-500';
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl">
          <ShieldAlert className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Fraud Detection
          </h1>
          <p className="text-gray-500">Real-time fraud monitoring and response system</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-200/30 rounded-3xl p-8 text-center group hover:scale-[1.02] transition-all duration-300">
          <div className="text-4xl font-bold text-red-700 mb-2">3</div>
          <div className="text-xl font-bold text-red-900 mb-1">Active Alerts</div>
          <div className="text-red-600 text-sm font-medium">2 High Priority</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-200/30 rounded-3xl p-8 text-center group hover:scale-[1.02] transition-all duration-300">
          <div className="text-4xl font-bold text-emerald-700 mb-2">12</div>
          <div className="text-xl font-bold text-emerald-900 mb-1">Resolved Today</div>
          <div className="text-emerald-600 text-sm font-medium">95% resolution rate</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-200/30 rounded-3xl p-8 text-center group hover:scale-[1.02] transition-all duration-300">
          <div className="text-4xl font-bold text-indigo-700 mb-2">87%</div>
          <div className="text-xl font-bold text-indigo-900 mb-1">Detection Accuracy</div>
          <div className="text-indigo-600 text-sm font-medium">Machine learning model</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-1 border-b-2 font-bold text-sm whitespace-nowrap ${
                activeTab === 'alerts'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Alerts ({fraudAlerts.filter(a => a.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-bold text-sm whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Action History
            </button>
          </nav>
        </div>

        {/* Alerts Table */}
        <div className="p-8">
          {activeTab === 'alerts' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Ration Card</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fraudAlerts.map((alert) => (
                    <tr 
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedAlert?.id === alert.id ? 'bg-indigo-50 border-2 border-indigo-200' : ''}`}
                    >
                      <td className="px-6 py-6 font-mono font-semibold text-indigo-600">{alert.rationCard}</td>
                      <td className="px-6 py-6">
                        <div className="text-sm font-bold text-gray-900">{alert.user}</div>
                        <div className="text-sm text-gray-500">{alert.rationCard}</div>
                      </td>
                      <td className="px-6 py-6">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                          {alert.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          alert.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-sm text-gray-500">{alert.timestamp}</td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdminAction('suspend', alert.id);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all group"
                            title="Suspend Card"
                          >
                            <Ban className="h-4 w-4 group-hover:scale-110" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdminAction('manual_verify', alert.id);
                            }}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-xl transition-all group"
                            title="Manual Verify"
                          >
                            <UserX className="h-4 w-4 group-hover:scale-110" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdminAction('reset_reputation', alert.id);
                            }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group"
                            title="Reset Reputation"
                          >
                            <RotateCcw className="h-4 w-4 group-hover:scale-110" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="text-center py-20 text-gray-500">
              <ShieldAlert className="h-16 w-16 mx-auto mb-4 opacity-40" />
              <h3 className="text-2xl font-bold mb-2">Action History Coming Soon</h3>
              <p>Admin action logs will be available here</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl rounded-3xl p-8 border border-indigo-200/30 group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-xl text-indigo-900">Auto Scan</h4>
              <p className="text-indigo-700 text-sm">Run real-time fraud detection</p>
            </div>
          </div>
          <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-4 rounded-2xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-200">
            Scan Now
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-xl rounded-3xl p-8 border border-emerald-200/30 group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl">
              <AlertCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-xl text-emerald-900">Alert Rules</h4>
              <p className="text-emerald-700 text-sm">Configure fraud thresholds</p>
            </div>
          </div>
          <button className="w-full bg-gradient-to-r from-emerald-600 to-green-700 text-white py-4 rounded-2xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-200">
            Configure
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-xl rounded-3xl p-8 border border-orange-200/30 group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-xl text-orange-900">Reports</h4>
              <p className="text-orange-700 text-sm">Export fraud analytics</p>
            </div>
          </div>
          <button className="w-full bg-gradient-to-r from-orange-600 to-red-700 text-white py-4 rounded-2xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-200">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Fraud;

