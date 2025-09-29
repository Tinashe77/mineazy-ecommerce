import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const ResendVerification = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { resendVerification } = useContext(AuthContext);

  const handleClick = async () => {
    setMessage('');
    setError('');
    const response = await resendVerification();
    if (response.success) {
      setMessage('A new verification email has been sent to your address.');
    } else {
      setError(response.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="p-4 mt-6 text-center bg-yellow-100 border-l-4 border-yellow-500 rounded-md">
      <p className="text-sm text-yellow-800">
        Your account is not verified. Please check your email for a verification link.
      </p>
      <button
        onClick={handleClick}
        className="mt-4 px-4 py-2 text-sm font-medium text-white transition duration-150 ease-in-out bg-primary-700 rounded-md hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Resend Verification Email
      </button>
      {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default ResendVerification;