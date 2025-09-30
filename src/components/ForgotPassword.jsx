import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { forgotPassword } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const response = await forgotPassword(email);
    if (response.success) {
      setMessage('If an account with that email exists, a password reset link has been sent.');
    } else {
      setError(response.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-12 bg-gradient-to-br from-primary-700 to-accent-500">
      <div className="w-full max-w-md p-8 space-y-6 glass rounded-2xl shadow-2xl animate-fade-in">
        <h2 className="text-3xl font-bold text-center text-white">Forgot Password</h2>
        <p className="text-sm text-center text-white/80">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-white">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
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
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;