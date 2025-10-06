import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getSettings, updateSettings, testSmtpSettings, testPaymentGateway } from '../../services/settings';

const SettingsPage = () => {
  const { token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [testing, setTesting] = useState(false);

  const [settings, setSettings] = useState({
    general: {
      siteName: '',
      siteDescription: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      currency: 'USD',
      timezone: 'UTC',
      language: 'en',
    },
    email: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: '',
      encryption: 'tls',
    },
    payment: {
      enablePaypal: false,
      paypalClientId: '',
      paypalSecret: '',
      enableStripe: false,
      stripePublicKey: '',
      stripeSecretKey: '',
      paymentMode: 'test',
      paymentCurrency: 'USD',
    },
    shipping: {
      enableShipping: true,
      freeShippingThreshold: 0,
      defaultShippingCost: 0,
      shippingMethods: [
        { name: 'Standard', cost: 10, estimatedDays: '5-7' },
        { name: 'Express', cost: 25, estimatedDays: '2-3' },
      ],
    },
    tax: {
      enableTax: true,
      taxRate: 0,
      taxInclusive: false,
    },
    orders: {
      orderPrefix: 'ORD',
      minOrderAmount: 0,
      maxOrderAmount: 0,
      autoConfirm: false,
    },
    notifications: {
      enableEmailNotifications: true,
      adminEmail: '',
      notifyOnNewOrder: true,
      notifyOnLowStock: true,
      notifyOnQuoteRequest: true,
      lowStockThreshold: 10,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getSettings(token);
      
      if (response.settings) {
        setSettings(prev => ({
          ...prev,
          ...response.settings,
        }));
      }
    } catch (err) {
      setError('Failed to fetch settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      general: { ...prev.general, [name]: value },
    }));
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      email: { ...prev.email, [name]: value },
    }));
  };

  const handlePaymentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleShippingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        [name]: type === 'checkbox' ? checked : parseFloat(value) || value,
      },
    }));
  };

  const handleTaxChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      tax: {
        ...prev.tax,
        [name]: type === 'checkbox' ? checked : parseFloat(value) || value,
      },
    }));
  };

  const handleOrdersChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      orders: {
        ...prev.orders,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleNotificationsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await updateSettings(token, settings);
      
      if (response.success !== false) {
        setSuccess('Settings saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Failed to save settings');
      }
    } catch (err) {
      setError('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await testSmtpSettings(token, settings.email);
      
      if (response.success !== false) {
        setSuccess('Test email sent successfully! Check your inbox.');
      } else {
        setError(response.message || 'Failed to send test email');
      }
    } catch (err) {
      setError('Failed to send test email: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleTestPayment = async () => {
    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await testPaymentGateway(token, settings.payment);
      
      if (response.success !== false) {
        setSuccess('Payment gateway connection successful!');
      } else {
        setError(response.message || 'Failed to connect to payment gateway');
      }
    } catch (err) {
      setError('Failed to test payment gateway: ' + err.message);
    } finally {
      setTesting(false);
    }
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

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">System Settings</h1>

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

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'general'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'email'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Email/SMTP
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'payment'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payment
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'shipping'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Shipping
            </button>
            <button
              onClick={() => setActiveTab('tax')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'tax'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tax
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'notifications'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notifications
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSaveSettings}>
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">General Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name *
                  </label>
                  <input
                    type="text"
                    name="siteName"
                    value={settings.general.siteName}
                    onChange={handleGeneralChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={settings.general.contactEmail}
                    onChange={handleGeneralChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={settings.general.contactPhone}
                    onChange={handleGeneralChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={settings.general.currency}
                    onChange={handleGeneralChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    name="timezone"
                    value={settings.general.timezone}
                    onChange={handleGeneralChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    name="language"
                    value={settings.general.language}
                    onChange={handleGeneralChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Description
                </label>
                <textarea
                  name="siteDescription"
                  value={settings.general.siteDescription}
                  onChange={handleGeneralChange}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address
                </label>
                <textarea
                  name="address"
                  value={settings.general.address}
                  onChange={handleGeneralChange}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Email/SMTP Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Email/SMTP Settings</h2>
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {testing ? 'Testing...' : 'Test Email'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Host *
                  </label>
                  <input
                    type="text"
                    name="smtpHost"
                    value={settings.email.smtpHost}
                    onChange={handleEmailChange}
                    placeholder="smtp.gmail.com"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Port *
                  </label>
                  <input
                    type="number"
                    name="smtpPort"
                    value={settings.email.smtpPort}
                    onChange={handleEmailChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Username *
                  </label>
                  <input
                    type="text"
                    name="smtpUser"
                    value={settings.email.smtpUser}
                    onChange={handleEmailChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Password *
                  </label>
                  <input
                    type="password"
                    name="smtpPassword"
                    value={settings.email.smtpPassword}
                    onChange={handleEmailChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Email *
                  </label>
                  <input
                    type="email"
                    name="fromEmail"
                    value={settings.email.fromEmail}
                    onChange={handleEmailChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Name *
                  </label>
                  <input
                    type="text"
                    name="fromName"
                    value={settings.email.fromName}
                    onChange={handleEmailChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Encryption
                  </label>
                  <select
                    name="encryption"
                    value={settings.email.encryption}
                    onChange={handleEmailChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> For Gmail, you may need to create an "App Password" instead of using your regular password.
                  Enable 2-step verification in your Google account, then generate an app-specific password.
                </p>
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Payment Gateway Settings</h2>
                <button
                  type="button"
                  onClick={handleTestPayment}
                  disabled={testing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Mode
                </label>
                <select
                  name="paymentMode"
                  value={settings.payment.paymentMode}
                  onChange={handlePaymentChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="test">Test Mode</option>
                  <option value="live">Live Mode</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Use test mode for development and testing
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Currency
                </label>
                <select
                  name="paymentCurrency"
                  value={settings.payment.paymentCurrency}
                  onChange={handlePaymentChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">ZiG</option>
                  {/* <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option> */}
                </select>
              </div>

              {/* PayPal Settings */}
              <div className="border-t pt-6">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    name="enablePaypal"
                    checked={settings.payment.enablePaypal}
                    onChange={handlePaymentChange}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <label className="ml-2 text-lg font-medium text-gray-700">
                    Enable PayPal
                  </label>
                </div>

                {settings.payment.enablePaypal && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PayPal Client ID
                      </label>
                      <input
                        type="text"
                        name="paypalClientId"
                        value={settings.payment.paypalClientId}
                        onChange={handlePaymentChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PayPal Secret
                      </label>
                      <input
                        type="password"
                        name="paypalSecret"
                        value={settings.payment.paypalSecret}
                        onChange={handlePaymentChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Stripe Settings */}
              <div className="border-t pt-6">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    name="enableStripe"
                    checked={settings.payment.enableStripe}
                    onChange={handlePaymentChange}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <label className="ml-2 text-lg font-medium text-gray-700">
                    Enable Stripe
                  </label>
                </div>

                {settings.payment.enableStripe && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stripe Public Key
                      </label>
                      <input
                        type="text"
                        name="stripePublicKey"
                        value={settings.payment.stripePublicKey}
                        onChange={handlePaymentChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stripe Secret Key
                      </label>
                      <input
                        type="password"
                        name="stripeSecretKey"
                        value={settings.payment.stripeSecretKey}
                        onChange={handlePaymentChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Settings */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Settings</h2>

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  name="enableShipping"
                  checked={settings.shipping.enableShipping}
                  onChange={handleShippingChange}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Enable Shipping
                </label>
              </div>

              {settings.shipping.enableShipping && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Free Shipping Threshold
                      </label>
                      <input
                        type="number"
                        name="freeShippingThreshold"
                        value={settings.shipping.freeShippingThreshold}
                        onChange={handleShippingChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Set to 0 to disable free shipping
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Shipping Cost
                      </label>
                      <input
                        type="number"
                        name="defaultShippingCost"
                        value={settings.shipping.defaultShippingCost}
                        onChange={handleShippingChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Shipping Methods</h3>
                    <div className="space-y-4">
                      {settings.shipping.shippingMethods.map((method, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Method Name
                              </label>
                              <input
                                type="text"
                                value={method.name}
                                readOnly
                                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cost
                              </label>
                              <input
                                type="number"
                                value={method.cost}
                                readOnly
                                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estimated Days
                              </label>
                              <input
                                type="text"
                                value={method.estimatedDays}
                                readOnly
                                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Contact support to customize shipping methods
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tax Settings */}
          {activeTab === 'tax' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Tax Settings</h2>

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  name="enableTax"
                  checked={settings.tax.enableTax}
                  onChange={handleTaxChange}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Enable Tax Calculation
                </label>
              </div>

              {settings.tax.enableTax && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        name="taxRate"
                        value={settings.tax.taxRate}
                        onChange={handleTaxChange}
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Enter the tax rate as a percentage (e.g., 8.5 for 8.5%)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Type
                      </label>
                      <select
                        name="taxInclusive"
                        value={settings.tax.taxInclusive}
                        onChange={handleTaxChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value={false}>Tax Exclusive (added to price)</option>
                        <option value={true}>Tax Inclusive (included in price)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Tax Exclusive:</strong> Tax is calculated and added to the product price at checkout.
                      <br />
                      <strong>Tax Inclusive:</strong> Tax is already included in the displayed product price.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Order Settings */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Order Settings</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Number Prefix
                  </label>
                  <input
                    type="text"
                    name="orderPrefix"
                    value={settings.orders.orderPrefix}
                    onChange={handleOrdersChange}
                    placeholder="ORD"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Example: ORD-12345
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Order Amount
                  </label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={settings.orders.minOrderAmount}
                    onChange={handleOrdersChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Set to 0 for no minimum
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Order Amount
                  </label>
                  <input
                    type="number"
                    name="maxOrderAmount"
                    value={settings.orders.maxOrderAmount}
                    onChange={handleOrdersChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Set to 0 for no maximum
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="autoConfirm"
                  checked={settings.orders.autoConfirm}
                  onChange={handleOrdersChange}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Auto-confirm orders after payment
                </label>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  name="enableEmailNotifications"
                  checked={settings.notifications.enableEmailNotifications}
                  onChange={handleNotificationsChange}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Enable Email Notifications
                </label>
              </div>

              {settings.notifications.enableEmailNotifications && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notification Email
                    </label>
                    <input
                      type="email"
                      name="adminEmail"
                      value={settings.notifications.adminEmail}
                      onChange={handleNotificationsChange}
                      placeholder="admin@example.com"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Email address to receive admin notifications
                    </p>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Notification Types</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="notifyOnNewOrder"
                          checked={settings.notifications.notifyOnNewOrder}
                          onChange={handleNotificationsChange}
                          className="h-4 w-4 text-indigo-600 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Notify on new orders
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="notifyOnLowStock"
                          checked={settings.notifications.notifyOnLowStock}
                          onChange={handleNotificationsChange}
                          className="h-4 w-4 text-indigo-600 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Notify on low stock alerts
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="notifyOnQuoteRequest"
                          checked={settings.notifications.notifyOnQuoteRequest}
                          onChange={handleNotificationsChange}
                          className="h-4 w-4 text-indigo-600 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Notify on quote requests
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      name="lowStockThreshold"
                      value={settings.notifications.lowStockThreshold}
                      onChange={handleNotificationsChange}
                      min="0"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Get notified when product stock falls below this number
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 pt-6 border-t flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              type="button"
              onClick={fetchSettings}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Reset to Saved
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;