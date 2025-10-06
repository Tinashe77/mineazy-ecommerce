import { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ResendVerification from './ResendVerification';

const Profile = () => {
  const { user, logout, refreshUser } = useContext(AuthContext);

  useEffect(() => {
    refreshUser();
  }, []);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="mb-4 text-lg text-gray-700">You are not logged in.</p>
        <Link
          to="/login"
          className="px-6 py-2 text-white transition duration-150 ease-in-out bg-primary-700 rounded-md hover:bg-primary-800"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="form-container animate-fade-in">
        <h2 className="text-3xl font-bold text-center text-gray-800">
          Welcome, {user.firstName}!
        </h2>
        {!user.isVerified && <ResendVerification />}
        <div className="p-6 border border-gray-200 rounded-md">
          <div className="flex justify-between py-3 border-b">
            <span className="font-medium text-gray-600">First Name:</span>
            <span className="text-gray-800">{user.firstName}</span>
          </div>
          <div className="flex justify-between py-3 border-b">
            <span className="font-medium text-gray-600">Last Name:</span>
            <span className="text-gray-800">{user.lastName}</span>
          </div>
          <div className="flex justify-between py-3 border-b">
            <span className="font-medium text-gray-600">Email:</span>
            <span className="text-gray-800">{user.email}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="font-medium text-gray-600">Role:</span>
            <span className="px-3 py-1 text-sm font-semibold text-white bg-accent-500 rounded-full">
              {user.role}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full py-2 mt-6 text-white transition duration-150 ease-in-out bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;