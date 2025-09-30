import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getQuoteById, updateQuote, sendQuoteToCustomer } from '../../services/quotes';

const QuoteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [updateData, setUpdateData] = useState({
    status: '',
    validUntil: '',
    notes: '',
    items: [],
  });

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const fetchQuote = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getQuoteById(token, id);
      
      if (response._id) {
        setQuote(response);
        setUpdateData({
          status: response.status || '',
          validUntil: response.validUntil ? new Date(response.validUntil).toISOString().split('T')[0] : '',
          notes: response.notes || '',
          items: response.items || [],
        });
      } else {
        setError('Quote not found');
      }
    } catch (err) {
      setError('Failed to fetch quote: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...updateData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    setUpdateData(prev => ({ ...prev, items: newItems }));
  };

  const handleUpdateQuote = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    
    try {
      const response = await updateQuote(token, id, updateData);
      
      if (response.success !== false) {
        alert('Quote updated successfully');
        setEditMode(false);
        fetchQuote();
      } else {
        setError(response.message || 'Failed to update quote');
      }
    } catch (err) {
      setError('Failed to update quote: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendQuote = async () => {
    if (window.confirm('Send this quote to the customer via email?')) {
      try {
        const response = await sendQuoteToCustomer(token, id);
        
        if (response.success !== false) {
          alert('Quote sent successfully');
          fetchQuote();
        } else {
          alert('Failed to send quote: ' + response.message);
        }
      } catch (err) {
        alert('Failed to send quote: ' + err.message);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateTotal = () => {
    return updateData.items.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice) || 0;
      const quantity = parseFloat(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
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

  if (error && !quote) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={() => navigate('/dashboard/quotes')}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Back to Quotes
        </button>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/dashboard/quotes')}
            className="text-indigo-600 hover:text-indigo-800 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Quotes
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            Quote QTE-{quote._id.slice(-8).toUpperCase()}
          </h1>
        </div>
        <div className="flex gap-2">
          {!editMode && quote.status !== 'accepted' && quote.status !== 'rejected' && (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Edit Quote
              </button>
              <button
                onClick={handleSendQuote}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Send to Customer
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quote Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quote Items</h2>
            {editMode ? (
              <form onSubmit={handleUpdateQuote}>
                <div className="space-y-4">
                  {updateData.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      {item.product ? (
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="text"
                            value={item.customItem?.name || ''}
                            onChange={(e) => handleItemChange(index, 'customItem', { ...item.customItem, name: e.target.value })}
                            placeholder="Item name"
                            className="w-full px-3 py-2 border rounded-lg mb-2"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <label className="text-xs text-gray-600">Quantity</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            min="1"
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Unit Price</label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            min="0"
                            step="0.01"
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Total</label>
                          <p className="text-sm font-medium mt-1">
                            {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setUpdateData({
                        status: quote.status || '',
                        validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : '',
                        notes: quote.notes || '',
                        items: quote.items || [],
                      });
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="space-y-4">
                  {quote.items?.map((item, index) => (
                    <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {item.product?.name || item.customItem?.name}
                        </h3>
                        {item.product && (
                          <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                        )}
                       {item.customItem?.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.customItem.description}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.unitPrice * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(quote.totalAmount || 0)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Contact Details</h3>
                <p className="text-sm">
                  {quote.customerInfo?.firstName} {quote.customerInfo?.lastName}
                </p>
                <p className="text-sm text-gray-600">{quote.customerInfo?.email}</p>
                <p className="text-sm text-gray-600">{quote.customerInfo?.phone}</p>
                {quote.customerInfo?.company && (
                  <p className="text-sm text-gray-600 mt-2">
                    Company: {quote.customerInfo.company}
                  </p>
                )}
              </div>
              
              {quote.customerInfo?.address && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Address</h3>
                  <p className="text-sm">{quote.customerInfo.address.street}</p>
                  <p className="text-sm text-gray-600">
                    {quote.customerInfo.address.city}, {quote.customerInfo.address.state}
                  </p>
                  <p className="text-sm text-gray-600">{quote.customerInfo.address.country}</p>
                </div>
              )}
            </div>

            {quote.notes && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium text-gray-700 mb-2">Customer Notes</h3>
                <p className="text-sm text-gray-600">{quote.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          {editMode ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Quote Status</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={updateData.status}
                    onChange={handleUpdateChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="quoted">Quoted</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    name="validUntil"
                    value={updateData.validUntil}
                    onChange={handleUpdateChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    name="notes"
                    value={updateData.notes}
                    onChange={handleUpdateChange}
                    rows={3}
                    placeholder="Internal notes..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Quote Status</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <p className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      quote.status === 'quoted' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {quote.status}
                    </span>
                  </p>
                </div>

                {quote.validUntil && (
                  <div>
                    <span className="text-sm text-gray-600">Valid Until:</span>
                    <p className="font-medium mt-1">{formatDate(quote.validUntil)}</p>
                  </div>
                )}

                {quote.rejectionReason && (
                  <div>
                    <span className="text-sm text-gray-600">Rejection Reason:</span>
                    <p className="text-sm mt-1 text-red-600">{quote.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quote Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quote Information</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Quote ID:</span>
                <p className="font-mono text-xs mt-1">{quote._id}</p>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <p className="font-medium mt-1">{formatDate(quote.createdAt)}</p>
              </div>
              {quote.updatedAt && quote.updatedAt !== quote.createdAt && (
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <p className="font-medium mt-1">{formatDate(quote.updatedAt)}</p>
                </div>
              )}
              {quote.respondedAt && (
                <div>
                  <span className="text-gray-600">Responded:</span>
                  <p className="font-medium mt-1">{formatDate(quote.respondedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetailPage;