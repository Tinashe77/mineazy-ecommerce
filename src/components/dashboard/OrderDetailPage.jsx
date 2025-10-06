import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getOrderById, updateOrderStatus } from '../../services/orders';
import { downloadInvoice, sendInvoice } from '../../services/invoices';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  
  const [updateData, setUpdateData] = useState({
    status: '',
    paymentStatus: '',
    trackingNumber: '',
    notes: '',
  });

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getOrderById(token, id);
      
      if (response._id) {
        setOrder(response);
        setUpdateData({
          status: response.status || '',
          paymentStatus: response.paymentStatus || '',
          trackingNumber: response.trackingNumber || '',
          notes: response.notes || '',
        });
      } else {
        setError('Order not found');
      }
    } catch (err) {
      setError('Failed to fetch order: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const blob = await downloadInvoice(token, id);
      
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${order.orderNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate invoice');
      }
    } catch (err) {
      alert('Failed to download invoice: ' + err.message);
    }
  };

  const handleSendInvoice = async () => {
    if (window.confirm('Send invoice to customer via email?')) {
      try {
        const response = await sendInvoice(token, id);
        
        if (response.success !== false) {
          alert('Invoice sent successfully');
        } else {
          alert('Failed to send invoice: ' + response.message);
        }
      } catch (err) {
        alert('Failed to send invoice: ' + err.message);
      }
    }
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    
    try {
      const response = await updateOrderStatus(token, id, updateData);
      
      if (response.success !== false) {
        alert('Order updated successfully');
        fetchOrder();
      } else {
        setError(response.message || 'Failed to update order');
      }
    } catch (err) {
      setError('Failed to update order: ' + err.message);
    } finally {
      setUpdating(false);
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

  if (error && !order) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={() => navigate('/dashboard/orders')}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/dashboard/orders')}
            className="text-indigo-600 hover:text-indigo-800 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            Order {order.orderNumber}
          </h1>
        </div>
      </div>
      
      <div className="flex gap-2 mb-6">
        <button
          onClick={handleDownloadInvoice}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Invoice
        </button>
        <button
          onClick={handleSendInvoice}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Send Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}
              {order.shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span>{formatCurrency(order.shipping)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Contact Details</h3>
                <p className="text-sm">
                  {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                </p>
                <p className="text-sm text-gray-600">{order.customerInfo?.email}</p>
                <p className="text-sm text-gray-600">{order.customerInfo?.phone}</p>
              </div>
              
              {order.customerInfo?.address && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Shipping Address</h3>
                  <p className="text-sm">{order.customerInfo.address.street}</p>
                  <p className="text-sm text-gray-600">
                    {order.customerInfo.address.city}, {order.customerInfo.address.state} {order.customerInfo.address.zipCode}
                  </p>
                  <p className="text-sm text-gray-600">{order.customerInfo.address.country}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Status</h2>
            
            <form onSubmit={handleUpdateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Status
                </label>
                <select
                  name="status"
                  value={updateData.status}
                  onChange={handleUpdateChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-700"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  name="paymentStatus"
                  value={updateData.paymentStatus}
                  onChange={handleUpdateChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-700"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="payment_on_delivery">Payment on Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking Number
                </label>
                <input
                  type="text"
                  name="trackingNumber"
                  value={updateData.trackingNumber}
                  onChange={handleUpdateChange}
                  placeholder="e.g., TRACK123456"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Notes
                </label>
                <textarea
                  name="notes"
                  value={updateData.notes}
                  onChange={handleUpdateChange}
                  rows={3}
                  placeholder="Add notes about this order..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-700"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={updating}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Order'}
              </button>
            </form>
          </div>

          {/* Order Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Information</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Order Date:</span>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
              
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <p className="font-medium">{formatDate(order.updatedAt)}</p>
                </div>
              )}

              <div>
                <span className="text-gray-600">Payment Method:</span>
                <p className="font-medium capitalize">
                  {order.paymentMethod?.replace(/_/g, ' ')}
                </p>
              </div>

              {order.trackingNumber && (
                <div>
                  <span className="text-gray-600">Tracking Number:</span>
                  <p className="font-mono font-medium">{order.trackingNumber}</p>
                </div>
              )}

              <div>
                <span className="text-gray-600">Customer Type:</span>
                <p className="font-medium">
                  {order.isGuest ? 'Guest' : 'Registered'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;