import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const { login } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    const response = await login(formData);
    
    if (response.token) {
      // Redirect to the page they tried to visit or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else {
      setError(response.message || 'Login failed. Please check your credentials.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-12 bg-gradient-to-br from-primary-700 to-accent-500">
      <div className="w-full max-w-md p-8 space-y-6 glass rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-white">Welcome Back!</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-white">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              onChange={handleChange}
              required
              disabled={isLoading}
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
              disabled={isLoading}
              className="w-full px-4 py-3 mt-1 text-white bg-white/20 border border-white/30 rounded-xl shadow-sm focus:ring-accent-400 focus:border-accent-400 disabled:bg-white/10 placeholder-gray-300"
            />
          </div>
          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-sm font-medium text-accent-500 hover:underline">
              Forgot password?
            </Link>
          </div>
          {error && (
            <div className="p-3 bg-red-500/80 border border-red-700 rounded-xl">
              <p className="text-sm text-white">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 text-lg text-primary-700 font-bold transition duration-300 ease-in-out bg-accent-500 rounded-xl hover:bg-accent-600 focus:outline-none focus:ring-4 focus:ring-accent-400/50 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
          >
            {isLoading ? (
              <>
                <svg 
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-700"
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
        <p className="text-sm text-center text-white/80">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-accent-500 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;