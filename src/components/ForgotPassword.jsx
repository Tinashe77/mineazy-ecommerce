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
      <div className="form-container-glass animate-fade-in">
        <h2 className="text-3xl font-bold text-center text-white">Forgot Password</h2>
        <p className="text-sm text-center text-white/80">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="form-label-glass">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input-glass"
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
            className="form-button-glass"
          >
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;