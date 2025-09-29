import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verifyEmail as verifyEmailService } from '../services/auth';

const VerifyEmail = () => {
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email address...');
  const { token } = useParams();

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token found.');
        return;
      }
      const response = await verifyEmailService({ token });
      if (response.success) {
        setStatus('success');
        setMessage('Your email has been successfully verified! You can now log in.');
      } else {
        setStatus('error');
        setMessage(response.message || 'Failed to verify email. The link may be invalid or expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-md p-8 text-center bg-white rounded-lg shadow-md animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800">Email Verification</h2>
        <div className="mt-6">
          {status === 'verifying' && <p className="text-gray-600">{message}</p>}
          {status === 'success' && <p className="text-green-600">{message}</p>}
          {status === 'error' && <p className="text-red-600">{message}</p>}
        </div>
        <div className="mt-8">
          <Link
            to="/login"
            className="w-full py-2 text-white transition duration-150 ease-in-out bg-primary-700 rounded-md hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Proceed to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;