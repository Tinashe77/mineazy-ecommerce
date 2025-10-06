import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getDashboardStats } from '../../services/admin';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
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
      {/* Hero Card with Stats */}
      {stats && (
        <div className="bg-gradient-to-br from-green-400 via-blue-400 to-purple-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-5xl font-bold">{formatCurrency(stats.stats.totalRevenue || 0).replace('.00', '')}</h2>
                <p className="text-white/80 text-sm mt-1">Congratulations, </p>
                {/* <p className="text-white/80 text-sm mt-1">Congratulations, {user?.firstName}</p> */}
                <p className="text-white/70 text-xs">Your sales record has been great</p>
              </div>
            </div>
            
            <Link to="/dashboard/orders">
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-2.5 rounded-xl font-medium transition-all">
                View Sales
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Statistics</h2>
            <p className="text-sm text-gray-500">Updated Last Month Ago</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Annual Sales */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(stats.stats.totalRevenue || 0).replace('.00', '')}</h3>
              <p className="text-sm text-gray-500 mt-1">Annual Sales</p>
            </div>

            {/* Customers */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{stats.stats.totalUsers || 0}</h3>
              <p className="text-sm text-gray-500 mt-1">Customers</p>
            </div>

            {/* Products */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{stats.stats.totalProducts || 0}</h3>
              <p className="text-sm text-gray-500 mt-1">Products</p>
            </div>

            {/* Orders */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{stats.stats.totalOrders || 0}</h3>
              <p className="text-sm text-gray-500 mt-1">Total Orders</p>
            </div>

            {/* Pending Orders */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{stats.stats.pendingOrders || 0}</h3>
              <p className="text-sm text-gray-500 mt-1">Pending Orders</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Report */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Revenue Report</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span className="text-sm text-gray-600">Earning</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-sm text-gray-600">Expense</span>
              </div>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5">
                <option>2020</option>
                <option>2021</option>
                <option>2022</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-3xl font-bold text-gray-800">{formatCurrency(stats?.stats?.totalRevenue || 0)}</div>
            <div className="text-sm text-gray-500">Total Revenue - Last {period} days</div>
          </div>

          {stats?.revenueByDay && stats.revenueByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="_id" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                  stroke="#888"
                />
                <YAxis stroke="#888" />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="orders" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No data available
            </div>
          )}

          <div className="mt-6 text-center">
            <button className="bg-primary-700 hover:bg-primary-800 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
              Increase Budget
            </button>
          </div>
        </div>

        {/* Orders & Earnings */}
        <div className="space-y-6">
          {/* Orders */}
          {stats && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Orders</h3>
              <div className="text-3xl font-bold text-gray-800 mb-2">{stats.stats.totalOrders || 0}</div>
              <p className="text-sm text-gray-600 mb-4">
                {stats.stats.recentOrders || 0} new orders in last {period} days
              </p>
              {stats.revenueByDay && stats.revenueByDay.length > 0 && (
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={stats.revenueByDay.slice(-6)}>
                    <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Low Stock Alert */}
          {stats && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Alert</h3>
              <div className="text-3xl font-bold text-gray-800 mb-4">{stats.stats.lowStockProducts || 0}</div>
              <p className="text-sm text-orange-600 mb-4">Products running low on stock</p>
              <Link to="/dashboard/products?inStock=false">
                <button className="w-full bg-orange-50 text-orange-600 py-2 rounded-xl font-medium hover:bg-orange-100 transition-colors">
                  View Products
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        {stats?.recentOrders && stats.recentOrders.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Recent Orders</h3>
              <Link to="/dashboard/orders" className="text-sm text-primary-700 hover:text-primary-800 font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recentOrders.slice(0, 5).map((order) => (
                <Link 
                  key={order._id}
                  to={`/dashboard/orders/${order._id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{order.customerInfo?.email}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{formatCurrency(order.total)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        
      </div>      {/* Additional Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Status Breakdown */}
          {stats.ordersByStatus && stats.ordersByStatus.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status</h3>
              <div className="space-y-3">
                {stats.ordersByStatus.map((status) => {
                  const statusColors = {
                    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-500' },
                    processing: { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' },
                    shipped: { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'bg-purple-500' },
                    delivered: { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500' },
                    cancelled: { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' },
                  };
                  const colors = statusColors[status._id] || statusColors.pending;
                  const percentage = stats.stats.totalOrders > 0 ? (status.count / stats.stats.totalOrders * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={status._id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text} capitalize`}>
                          {status._id}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">{status.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`${colors.bar} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/dashboard/products/new" className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-800">Add Product</p>
              </Link>

              <Link to="/dashboard/orders" className="p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors group">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-800">View Orders</p>
              </Link>

              <Link to="/dashboard/users" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-800">Manage Users</p>
              </Link>

              <Link to="/dashboard/settings" className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors group">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-800">Settings</p>
              </Link>
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">System Alerts</h3>
            <div className="space-y-3">
              {stats.stats.pendingOrders > 0 && (
                <Link to="/dashboard/orders?status=pending" className="block p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Pending Orders</p>
                      <p className="text-xs text-gray-500">{stats.stats.pendingOrders} orders awaiting processing</p>
                    </div>
                  </div>
                </Link>
              )}

              {stats.stats.lowStockProducts > 0 && (
                <Link to="/dashboard/products?inStock=false" className="block p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Low Stock Alert</p>
                      <p className="text-xs text-gray-500">{stats.stats.lowStockProducts} products need restocking</p>
                    </div>
                  </div>
                </Link>
              )}

              {stats.stats.newMessages > 0 && (
                <Link to="/dashboard/contact" className="block p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">New Messages</p>
                      <p className="text-xs text-gray-500">{stats.stats.newMessages} unread contact messages</p>
                    </div>
                  </div>
                </Link>
              )}

              {stats.stats.pendingOrders === 0 && stats.stats.lowStockProducts === 0 && stats.stats.newMessages === 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-green-800">All systems operational</p>
                  <p className="text-xs text-green-600 mt-1">No alerts at this time</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;