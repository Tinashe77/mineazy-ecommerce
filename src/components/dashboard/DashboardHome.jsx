import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getDashboardStats } from '../../services/admin';
import StatCard from './StatCard';

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboardStats(token);
        if (response.stats) {
          setStats(response.stats);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
      {stats ? (
        <div className="grid grid-cols-1 gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} />
          <StatCard title="Total Orders" value={stats.totalOrders} />
          <StatCard title="Total Products" value={stats.totalProducts} />
          <StatCard title="Total Users" value={stats.totalUsers} />
        </div>
      ) : (
        <p className="mt-4 text-gray-600">Could not load dashboard statistics.</p>
      )}
    </div>
  );
};

export default DashboardHome;