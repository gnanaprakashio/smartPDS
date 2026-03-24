import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileText, Users, AlertTriangle, Shield, Search, Package } from 'lucide-react';

const OfficerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [shopName, setShopName] = useState('Ration Shop - TN01');

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reputation/requests?status=${filterStatus}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !actionReason.trim()) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reputation/approve-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          reason: actionReason
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Accepted! User ${data.data.userName} reputation reset to 50.`);
        setSelectedRequest(null);
        setActionReason('');
        fetchRequests();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !actionReason.trim()) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reputation/reject-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          reason: actionReason
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Rejected successfully.`);
        setSelectedRequest(null);
        setActionReason('');
        fetchRequests();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter(req =>
    req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.rationCardNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
          <Shield className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PDS Officer Report Panel</h1>
          <p className="text-gray-500">Review and process staff submitted reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setFilterStatus('PENDING')}
          className={`bg-white rounded-2xl p-6 border-2 cursor-pointer transition-all ${
            filterStatus === 'PENDING' ? 'border-yellow-400 shadow-lg' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div 
          onClick={() => setFilterStatus('APPROVED')}
          className={`bg-white rounded-2xl p-6 border-2 cursor-pointer transition-all ${
            filterStatus === 'APPROVED' ? 'border-green-400 shadow-lg' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div 
          onClick={() => setFilterStatus('REJECTED')}
          className={`bg-white rounded-2xl p-6 border-2 cursor-pointer transition-all ${
            filterStatus === 'REJECTED' ? 'border-red-400 shadow-lg' : 'border-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
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
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" />
            Staff Reports ({filteredRequests.length})
          </h2>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user name or ration card number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Shop Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Ration Card Number</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">User Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Problem Description</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Staff Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No reports found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{shopName}</td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{request.rationCardNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{request.userName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{request.reason}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{request.staffName}</td>
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
                    <td className="px-4 py-3">
                      {request.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setActionReason('');
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all"
                          >
                            View & Action
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {selectedRequest && selectedRequest.status === 'PENDING' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Report Details & Action</h2>
              <p className="text-gray-500">Review and take action on staff report</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Shop Name</p>
                    <p className="font-medium text-gray-900">{shopName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ration Card Number</p>
                    <p className="font-mono font-medium text-gray-900">{selectedRequest.rationCardNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">User Name</p>
                    <p className="font-medium text-gray-900">{selectedRequest.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Staff Name</p>
                    <p className="font-medium text-gray-900">{selectedRequest.staffName}</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-sm font-bold text-orange-800 mb-2">Problem Description</p>
                <p className="text-gray-700 italic">"{selectedRequest.reason}"</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Officer Decision Reason
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for your decision (e.g., Verified medical certificate - genuine emergency, Insufficient proof - rejected)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={processing || actionReason.trim().length < 10}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                >
                  <CheckCircle className="h-6 w-6" />
                  Accept
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing || actionReason.trim().length < 5}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                >
                  <XCircle className="h-6 w-6" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerRequests;