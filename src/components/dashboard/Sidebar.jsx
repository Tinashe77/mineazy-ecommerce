import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="px-8 py-4 border-b border-gray-700">
        <h2 className="text-2xl font-semibold">MineAdmin</h2>
      </div>
      <nav className="flex-1 px-4 py-4">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `block px-4 py-2 mt-2 text-sm rounded hover:bg-gray-700 ${
              isActive ? 'bg-gray-700' : ''
            }`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/dashboard/products"
          className={({ isActive }) =>
            `block px-4 py-2 mt-2 text-sm rounded hover:bg-gray-700 ${
              isActive ? 'bg-gray-700' : ''
            }`
          }
        >
          Products
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;