import { useState, useEffect } from 'react';
import { Users, Send, AlertCircle, CheckCircle, Search, X, Package, Phone, User, CreditCard } from 'lucide-react';

const StaffRequests = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [shopName, setShopName] = useState('Ration Shop - TN01');

  useEffect(() => {
    fetchBlockedUsers();
    fetchAllUsers();
    fetchMyRequests();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reputation/blocked', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setBlockedUsers(data.blockedUsers);
      }
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.users) {
        setAllUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reputation/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMyRequests(data.requests);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!selectedUser || !reason.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reputation/staff-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          reason: reason
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Report sent successfully for ${selectedUser.name}`);
        setSelectedUser(null);
        setReason('');
        fetchMyRequests();
        setShowBlockedModal(false);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const openReportModal = (user) => {
    setSelectedUser(user);
    setReason('');
    setShowBlockedModal(true);
  };

  const filteredUsers = blockedUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.rationCardNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Report Panel</h1>
            <p className="text-gray-500">Submit reports for users with low reputation</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Blocked Users Button */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">User Reputation Management</h2>
            <p className="text-gray-500 mt-1">View blocked users and submit reports to PDS Officer</p>
          </div>
          <button
            onClick={() => setShowBlockedModal(true)}
            className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <AlertCircle className="h-5 w-5" />
            Blocked Users ({blockedUsers.length})
          </button>
        </div>
      </div>

      {/* My Submitted Reports */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-500" />
          My Submitted Reports
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Shop</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">User Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Ration Card</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Problem Description</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No reports submitted yet
                  </td>
                </tr>
              ) : (
                myRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{shopName}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{request.userName}</td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{request.rationCardNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{request.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blocked Users Modal */}
      {showBlockedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Blocked Users</h2>
                <p className="text-gray-500">Users with reputation score ≤ 10</p>
              </div>
              <button
                onClick={() => setShowBlockedModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[60vh]">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or card number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {selectedUser && (
                <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Send className="h-5 w-5 text-orange-500" />
                    Submit Report for: {selectedUser.name}
                  </h3>
                  <form onSubmit={handleSubmitRequest}>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Enter user's problem (e.g., Medical emergency - was hospitalized, Family issues - out of town, etc.)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={3}
                      required
                    />
                    <div className="flex gap-3 mt-3">
                      <button
                        type="submit"
                        disabled={submitting || reason.trim().length < 10}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Send className="h-5 w-5" />
                        {submitting ? 'Sending...' : 'Send Report'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Shop Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">User Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Ration Card</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Members</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Card Type</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No blocked users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{shopName}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                        <td className="px-4 py-3 font-mono text-sm text-gray-600">{user.rationCardNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.phone}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.members}</td>
                        <td className="px-4 py-3">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                            {user.cardType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openReportModal(user)}
                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all"
                          >
                            Report
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffRequests;