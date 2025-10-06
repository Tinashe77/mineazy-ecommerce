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
    <div className="form-container mx-auto mt-10">
      <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="form-label">Current Password</label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            placeholder="••••••••"
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">New Password</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            placeholder="••••••••"
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>
        {message && <p className="text-sm text-green-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="form-button"
        >
          Change Password
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;