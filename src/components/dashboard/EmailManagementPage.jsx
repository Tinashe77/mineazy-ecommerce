import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { 
  sendCustomEmail, 
  sendNewsletter, 
  sendTestEmail, 
  getEmailTemplates, 
  getEmailStats 
} from '../../services/email';

const EmailManagementPage = () => {
  const { token, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('custom');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState(null);
  const [templates, setTemplates] = useState([]);

  // Custom Email Form
  const [customEmailData, setCustomEmailData] = useState({
    to: '',
    subject: '',
    message: '',
    isHtml: false,
  });

  // Newsletter Form
  const [newsletterData, setNewsletterData] = useState({
    subject: '',
    content: '',
    recipients: 'all', // all, customers, subscribers
  });

  // Test Email Form
  const [testEmailRecipient, setTestEmailRecipient] = useState('');

  useEffect(() => {
    fetchEmailStats();
    fetchEmailTemplates();
  }, []);

  const fetchEmailStats = async () => {
    try {
      const response = await getEmailStats(token);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Failed to fetch email stats', err);
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      const response = await getEmailTemplates(token);
      if (response.templates) {
        setTemplates(response.templates);
      }
    } catch (err) {
      console.error('Failed to fetch templates', err);
    }
  };

  const handleCustomEmailChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomEmailData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNewsletterChange = (e) => {
    const { name, value } = e.target;
    setNewsletterData(prev => ({ ...prev, [name]: value }));
  };

  const handleSendCustomEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await sendCustomEmail(token, customEmailData);
      
      if (response.success !== false) {
        setSuccess('Email sent successfully!');
        setCustomEmailData({
          to: '',
          subject: '',
          message: '',
          isHtml: false,
        });
        fetchEmailStats();
      } else {
        setError(response.message || 'Failed to send email');
      }
    } catch (err) {
      setError('Failed to send email: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNewsletter = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await sendNewsletter(token, newsletterData);
      
      if (response.success !== false) {
        setSuccess(`Newsletter sent to ${response.sentCount || 0} recipients!`);
        setNewsletterData({
          subject: '',
          content: '',
          recipients: 'all',
        });
        fetchEmailStats();
      } else {
        setError(response.message || 'Failed to send newsletter');
      }
    } catch (err) {
      setError('Failed to send newsletter: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await sendTestEmail(token, testEmailRecipient);
      
      if (response.success !== false) {
        setSuccess('Test email sent successfully!');
        setTestEmailRecipient('');
      } else {
        setError(response.message || 'Failed to send test email');
      }
    } catch (err) {
      setError('Failed to send test email: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Email Management</h1>

      {/* Email Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalSent || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-800">{stats.sentToday || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-800">{stats.sentThisWeek || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-800">{stats.failed || 0}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('custom')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'custom'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Custom Email
            </button>
            <button
              onClick={() => setActiveTab('newsletter')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'newsletter'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Newsletter
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'test'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Test Email
            </button>
          </nav>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === 'custom' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Send Custom Email</h2>
            <form onSubmit={handleSendCustomEmail}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Email(s) *
                  </label>
                  <input
                    type="text"
                    name="to"
                    value={customEmailData.to}
                    onChange={handleCustomEmailChange}
                    placeholder="email@example.com or comma-separated emails"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter one or more email addresses separated by commas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={customEmailData.subject}
                    onChange={handleCustomEmailChange}
                    placeholder="Email subject"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={customEmailData.message}
                    onChange={handleCustomEmailChange}
                    rows={10}
                    placeholder="Email content..."
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isHtml"
                    checked={customEmailData.isHtml}
                    onChange={handleCustomEmailChange}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Send as HTML (message contains HTML code)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {loading ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'newsletter' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Send Newsletter</h2>
            <form onSubmit={handleSendNewsletter}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipients *
                  </label>
                  <select
                    name="recipients"
                    value={newsletterData.recipients}
                    onChange={handleNewsletterChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Users</option>
                    <option value="customers">Customers Only</option>
                    <option value="subscribers">Newsletter Subscribers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={newsletterData.subject}
                    onChange={handleNewsletterChange}
                    placeholder="Newsletter subject"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    name="content"
                    value={newsletterData.content}
                    onChange={handleNewsletterChange}
                    rows={12}
                    placeholder="Newsletter content (supports HTML)..."
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    HTML is supported for rich formatting
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ This will send emails to multiple recipients. Please review carefully before sending.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {loading ? 'Sending...' : 'Send Newsletter'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'templates' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Email Templates</h2>
            {templates.length > 0 ? (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template._id} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {template.type}
                      </span>
                      <span className="text-gray-500">
                        Subject: {template.subject}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No email templates available.</p>
                <p className="text-sm mt-2">Email templates are managed by the system.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'test' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Send Test Email</h2>
            <form onSubmit={handleSendTestEmail}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Recipient Email *
                  </label>
                  <input
                    type="email"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    placeholder={user?.email || "test@example.com"}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Sends a test email to verify your email configuration
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ℹ️ This will send a test email to verify that your email service is working correctly.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {loading ? 'Sending...' : 'Send Test Email'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailManagementPage;