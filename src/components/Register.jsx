import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'customer',
  });
  const { register } = useContext(AuthContext);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const response = await register(formData);
    if (!response.token) {
      setError(response.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-12 bg-gradient-to-br from-primary-700 to-accent-500">
      <div className="w-full max-w-md p-8 space-y-6 glass rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-white">Create an Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-white">First Name</label>
              <input
                type="text"
                name="firstName"
                placeholder="John"
                onChange={handleChange}
                required
                className="w-full px-4 py-3 mt-1 text-white bg-white/20 border border-white/30 rounded-xl shadow-sm focus:ring-accent-400 focus:border-accent-400 disabled:bg-white/10 placeholder-gray-300"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white">Last Name</label>
              <input
                type="text"
                name="lastName"
                placeholder="Doe"
                onChange={handleChange}
                required
                className="w-full px-4 py-3 mt-1 text-white bg-white/20 border border-white/30 rounded-xl shadow-sm focus:ring-accent-400 focus:border-accent-400 disabled:bg-white/10 placeholder-gray-300"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-white">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              onChange={handleChange}
              required
              className="w-full px-4 py-3 mt-1 text-white bg-white/20 border border-white/30 rounded-xl shadow-sm focus:ring-accent-400 focus:border-accent-400 disabled:bg-white/10 placeholder-gray-300"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              onChange={handleChange}
              required
              className="w-full px-4 py-3 mt-1 text-white bg-white/20 border border-white/30 rounded-xl shadow-sm focus:ring-accent-400 focus:border-accent-400 disabled:bg-white/10 placeholder-gray-300"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white">Phone Number (Optional)</label>
            <input
              type="text"
              name="phone"
              placeholder="+263-xxx-xxxx"
              onChange={handleChange}
              className="w-full px-4 py-3 mt-1 text-white bg-white/20 border border-white/30 rounded-xl shadow-sm focus:ring-accent-400 focus:border-accent-400 disabled:bg-white/10 placeholder-gray-300"
            />
          </div>
          {error && (
            <div className="p-3 bg-red-500/80 border border-red-700 rounded-xl">
              <p className="text-sm text-white">{error}</p>
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 text-lg text-primary-700 font-bold transition duration-300 ease-in-out bg-accent-500 rounded-xl hover:bg-accent-600 focus:outline-none focus:ring-4 focus:ring-accent-400/50 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
          >
            Create Account
          </button>
        </form>
        <p className="text-sm text-center text-white/80">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent-500 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;