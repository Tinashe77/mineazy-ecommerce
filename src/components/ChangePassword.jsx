import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { changePassword } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const response = await changePassword(formData);
    if (response.success) {
      setMessage('Your password has been changed successfully.');
      setFormData({ currentPassword: '', newPassword: '' });
    } else {
      setError(response.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-lg p-8 mx-auto mt-10 space-y-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700">Current Password</label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            placeholder="••••••••"
            onChange={handleChange}
            required
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">New Password</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            placeholder="••••••••"
            onChange={handleChange}
            required
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full py-2 text-white transition duration-150 ease-in-out bg-primary-700 rounded-md hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Change Password
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;