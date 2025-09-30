import { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const response = await resetPassword({ token, password });
    if (response.success) {
      setMessage('Your password has been reset successfully. You can now log in.');
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setError(response.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-12 bg-gradient-to-br from-primary-700 to-accent-500">
      <div className="w-full max-w-md p-8 space-y-6 glass rounded-2xl shadow-2xl animate-fade-in">
        <h2 className="text-3xl font-bold text-center text-white">Reset Password</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-white">New Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 mt-1 text-white bg-white/20 border border-white/30 rounded-xl shadow-sm focus:ring-accent-400 focus:border-accent-400 disabled:bg-white/10 placeholder-gray-300"
            />
          </div>
          {message && (
            <div className="p-3 bg-green-500/80 border border-green-700 rounded-xl">
              <p className="text-sm text-white">{message}</p>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-500/80 border border-red-700 rounded-xl">
              <p className="text-sm text-white">{error}</p>
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 text-lg text-primary-700 font-bold transition duration-300 ease-in-out bg-accent-500 rounded-xl hover:bg-accent-600 focus:outline-none focus:ring-4 focus:ring-accent-400/50 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;