import { useState, useEffect } from 'react'
import { queueAPI, rationAPI } from '../services/api.js'
import QueueCard from '../components/QueueCard.jsx'
import { FunnelIcon, ChartBarIcon } from '@heroicons/react/24/outline'

const AdminPanel = () => {
  const [queues, setQueues] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [queuesRes, invRes] = await Promise.all([
        queueAPI.allQueues(),
        rationAPI.inventory()
      ])
      setQueues(queuesRes.data)
      setInventory(invRes.data)
    } catch (error) {
      console.error('Failed to fetch admin data')
    } finally {
      setLoading(false)
    }
  }

  const serveNext = async (queueId) => {
    try {
      await queueAPI.updateStatus(queueId, 'SERVING')
      fetchData()
    } catch (error) {
      console.error('Failed to update status')
    }
  }

  if (loading) return <div>Loading admin panel...</div>

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-4">
          Admin Control Panel
        </h1>
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <div className="flex items-center bg-white p-4 rounded-xl shadow-md">
            <div className="flex-shrink-0">
              <FunnelIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Queues</p>
              <p className="text-2xl font-bold text-gray-900">{queues.filter(q => q.status === 'PENDING').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FunnelIcon className="h-7 w-7 mr-2 text-primary-600" />
            Live Queue
          </h2>
          <div className="space-y-4">
            {queues.map((queue) => (
              <div key={queue.id} className="flex items-center justify-between p-4 bg-white rounded-xl border-l-4 border-primary-500 shadow-sm">
                <QueueCard queue={queue} />
                queue.status === 'PENDING' &amp;&amp; (
                  <button
                    onClick={() => serveNext(queue.id)}
                    className="ml-4 btn-primary whitespace-nowrap px-6"
                  >
                    Serve Next
                  </button>
                )
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <ChartBarIcon className="h-7 w-7 mr-2 text-primary-600" />
            Inventory
          </h2>
          <div className="space-y-3">
            {inventory.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border">
                <div>
                  <p className="font-medium text-gray-900">{item.item}</p>
                  <p className="text-sm text-gray-500">{item.unit}</p>
                </div>
                <span 
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.stock < item.minStock 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {item.stock} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel

