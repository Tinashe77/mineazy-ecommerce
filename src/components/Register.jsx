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
      <div className="form-container-glass">
        <h2 className="text-3xl font-bold text-center text-white">Create an Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="form-label-glass">First Name</label>
              <input
                type="text"
                name="firstName"
                placeholder="John"
                onChange={handleChange}
                required
                className="form-input-glass"
              />
            </div>
            <div>
              <label className="form-label-glass">Last Name</label>
              <input
                type="text"
                name="lastName"
                placeholder="Doe"
                onChange={handleChange}
                required
                className="form-input-glass"
              />
            </div>
          </div>
          <div>
            <label className="form-label-glass">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              onChange={handleChange}
              required
              className="form-input-glass"
            />
          </div>
          <div>
            <label className="form-label-glass">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              onChange={handleChange}
              required
              className="form-input-glass"
            />
          </div>
          <div>
            <label className="form-label-glass">Phone Number (Optional)</label>
            <input
              type="text"
              name="phone"
              placeholder="+263-xxx-xxxx"
              onChange={handleChange}
              className="form-input-glass"
            />
          </div>
          {error && (
            <div className="p-3 bg-red-500/80 border border-red-700 rounded-xl">
              <p className="text-sm text-white">{error}</p>
            </div>
          )}
          <button
            type="submit"
            className="form-button-glass"
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