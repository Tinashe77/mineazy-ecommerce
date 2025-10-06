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
      <div className="form-container text-center animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800">Email Verification</h2>
        <div className="mt-6">
          {status === 'verifying' && <p className="text-gray-600">{message}</p>}
          {status === 'success' && <p className="text-green-600">{message}</p>}
          {status === 'error' && <p className="text-red-600">{message}</p>}
        </div>
        <div className="mt-8">
          <Link
            to="/login"
            className="form-button"
          >
            Proceed to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;