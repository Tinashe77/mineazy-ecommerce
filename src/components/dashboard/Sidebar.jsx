import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="px-8 py-4 border-b border-gray-700">
        <h2 className="text-2xl font-semibold">MineAdmin</h2>
        {user && (
          <p className="text-sm text-gray-400 mt-1">{user.email}</p>
        )}
      </div>
      
      <nav className="flex-1 px-4 py-4">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            `block px-4 py-2 mt-2 text-sm rounded hover:bg-gray-700 ${
              isActive ? 'bg-gray-700' : ''
            }`
          }
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </div>
        </NavLink>
        
        <NavLink
          to="/dashboard/orders"
          className={({ isActive }) =>
            `block px-4 py-2 mt-2 text-sm rounded hover:bg-gray-700 ${
              isActive ? 'bg-gray-700' : ''
            }`
          }
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Orders
          </div>
        </NavLink>

        <NavLink
          to="/dashboard/invoices"
          className={({ isActive }) =>
            `block px-4 py-2 mt-2 text-sm rounded hover:bg-gray-700 ${
              isActive ? 'bg-gray-700' : ''
            }`
          }
        >
         <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Invoices
          </div>
        </NavLink>
        
        <NavLink
          to="/dashboard/products"
          className={({ isActive }) =>
            `block px-4 py-2 mt-2 text-sm rounded hover:bg-gray-700 ${
              isActive ? 'bg-gray-700' : ''
            }`
          }
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Products
          </div>
        </NavLink>
        
        <NavLink
          to="/dashboard/categories"
          className={({ isActive }) =>
            `block px-4 py-2 mt-2 text-sm rounded hover:bg-gray-700 ${
              isActive ? 'bg-gray-700' : ''
            }`
          }
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Categories
          </div>
        </NavLink>
<NavLink
  to="/dashboard/blog"
  className={({ isActive }) =>
    `block px-4 py-2 mt-2 text-sm rounded hover:bg-gray-700 ${
      isActive ? 'bg-gray-700' : ''
    }`
  }
>
  <div className="flex items-center gap-2">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
    Blog
  </div>
</NavLink>
        <NavLink
          to="/dashboard/users"
          className={({ isActive }) =>
            `block px-4 py-2 mt-2 text-sm rounded hover:bg-gray-700 ${
              isActive ? 'bg-gray-700' : ''
            }`
          }
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Users
          </div>
        </NavLink>
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full px-4 py-2 text-sm text-left rounded hover:bg-gray-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;