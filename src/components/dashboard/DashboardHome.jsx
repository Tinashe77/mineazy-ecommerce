import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getDashboardStats } from '../../services/admin';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatCard from './StatCard';

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(30);
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    fetchStats();
  }, [token, period]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getDashboardStats(token, period);
      
      if (response.stats) {
        setStats(response);
      } else {
        setError(response.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError('Failed to fetch dashboard stats: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.firstName}!</p>
        </div>
        <div>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      {stats && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Total Revenue" 
              value={formatCurrency(stats.stats.totalRevenue || 0)}
              change={stats.stats.revenueChange}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="bg-indigo-500"
            />
            <StatCard 
              title="Total Orders" 
              value={stats.stats.totalOrders || 0}
              change={stats.stats.ordersChange}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
              color="bg-green-500"
            />
            <StatCard 
              title="Total Products" 
              value={stats.stats.totalProducts || 0}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              color="bg-purple-500"
            />
            <StatCard 
              title="Total Users" 
              value={stats.stats.totalUsers || 0}
              change={stats.stats.usersChange}
              icon={
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
              color="bg-pink-500"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            {stats.revenueByDay && stats.revenueByDay.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Revenue Overview</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="_id" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="Orders" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Orders by Status */}
            {stats.ordersByStatus && stats.ordersByStatus.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Orders by Status</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.ordersByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ _id, count }) => `${_id}: ${count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.ordersByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Quick Stats & Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Alerts */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Alerts</h2>
              <div className="space-y-4">
                <Link to="/dashboard/orders?status=pending" className="block p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Pending Orders</p>
                      <p className="text-2xl font-bold text-yellow-900">{stats.stats.pendingOrders || 0}</p>
                    </div>
                    <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </Link>

                <Link to="/dashboard/products?inStock=false" className="block p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-800">Low Stock Products</p>
                      <p className="text-2xl font-bold text-red-900">{stats.stats.lowStockProducts || 0}</p>
                    </div>
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </Link>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Recent Orders</p>
                      <p className="text-2xl font-bold text-green-900">{stats.stats.recentOrders || 0}</p>
                    </div>
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">New Messages</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.stats.newMessages || 0}</p>
                    </div>
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Top Selling Products</h2>
              {stats.topProducts && stats.topProducts.length > 0 ? (
                <div className="space-y-4">
                  {stats.topProducts.slice(0, 5).map((product, index) => (
                    <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{product.name}</p>
                          <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">{product.totalSold || 0} sold</p>
                        <p className="text-sm text-gray-500">{formatCurrency(product.totalRevenue || 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No sales data available</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          {stats.recentOrders && stats.recentOrders.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Recent Orders</h2>
                <Link to="/dashboard/orders" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                  View All →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 border-b">
                      <th className="pb-3">Order #</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.slice(0, 5).map((order) => (
                      <tr key={order._id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3">
                          <Link to={`/dashboard/orders/${order._id}`} className="font-mono text-indigo-600 hover:text-indigo-800">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3">
                          {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                        </td>
                        <td className="py-3 font-medium">{formatCurrency(order.total)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardHome;