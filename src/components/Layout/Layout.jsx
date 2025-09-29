import { useContext } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 font-sans">
      <header className="bg-white shadow-md">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary-700">
            MineEquip
          </Link>
          <ul className="flex items-center space-x-6">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`text-gray-600 hover:text-primary-700 transition duration-150 ${
                    location.pathname === link.path ? 'font-semibold text-primary-700' : ''
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-md hover:bg-primary-800 transition"
                >
                  My Account
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-primary-700 border border-primary-700 rounded-md hover:bg-primary-50 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-700 rounded-md hover:bg-primary-800 transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>
      <footer className="bg-white mt-12 py-6 border-t">
        <div className="container mx-auto px-6 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} MineEquip. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;