import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getContactMessageById, updateContactMessage, deleteContactMessage } from '../../services/contact';

const ContactMessageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [replyMode, setReplyMode] = useState(false);
  
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchMessage();
  }, [id]);

  const fetchMessage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getContactMessageById(token, id);
      
      if (response._id) {
        setMessage(response);
        setReplyText(response.response || '');
        
        // Mark as read if it's unread
        if (response.status === 'unread') {
          await updateContactMessage(token, id, { status: 'read' });
        }
      } else {
        setError('Message not found');
      }
    } catch (err) {
      setError('Failed to fetch message: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    
    try {
      const response = await updateContactMessage(token, id, {
        status: 'replied',
        response: replyText,
      });
      
      if (response.success !== false) {
        alert('Response saved successfully');
        setReplyMode(false);
        fetchMessage();
      } else {
        setError(response.message || 'Failed to save response');
      }
    } catch (err) {
      setError('Failed to save response: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this message? This action cannot be undone.')) {
      try {
        const response = await deleteContactMessage(token, id);
        
        if (response.success !== false) {
          navigate('/dashboard/contact');
        } else {
          alert('Failed to delete message: ' + response.message);
        }
      } catch (err) {
        alert('Failed to delete message: ' + err.message);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error && !message) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={() => navigate('/dashboard/contact')}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Back to Messages
        </button>
      </div>
    );
  }

  if (!message) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/dashboard/contact')}
            className="text-indigo-600 hover:text-indigo-800 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Messages
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{message.subject}</h1>
        </div>
        <div className="flex gap-2">
          {!replyMode && message.status !== 'replied' && (
            <button
              onClick={() => setReplyMode(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Reply
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Message</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
            </div>
          </div>

          {/* Reply Section */}
          {message.response && !replyMode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-800">Your Response</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{message.response}</p>
              <button
                onClick={() => setReplyMode(true)}
                className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Edit Response
              </button>
            </div>
          )}

          {replyMode && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Send Response</h2>
              <form onSubmit={handleReply}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Response
                  </label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={8}
                    required
                    placeholder="Type your response here..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {updating ? 'Saving...' : 'Save Response'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyMode(false);
                      setReplyText(message.response || '');
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Name:</span>
                <p className="font-medium">{message.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email:</span>
                <p className="font-medium">
                  <a href={`mailto:${message.email}`} className="text-indigo-600 hover:text-indigo-800">
                    {message.email}
                  </a>
                </p>
              </div>
              {message.phone && (
                <div>
                  <span className="text-sm text-gray-600">Phone:</span>
                  <p className="font-medium">
                    <a href={`tel:${message.phone}`} className="text-indigo-600 hover:text-indigo-800">
                      {message.phone}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Message Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Message Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <p className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    message.status === 'replied' ? 'bg-green-100 text-green-800' :
                    message.status === 'read' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {message.status}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-gray-600">Received:</span>
                <p className="font-medium mt-1">{formatDate(message.createdAt)}</p>
              </div>
              {message.updatedAt && message.updatedAt !== message.createdAt && (
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <p className="font-medium mt-1">{formatDate(message.updatedAt)}</p>
                </div>
              )}
              <div>
                <span className="text-gray-600">Message ID:</span>
                <p className="font-mono text-xs mt-1">{message._id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactMessageDetail;