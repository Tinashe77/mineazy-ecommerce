import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getAdminInvoices, adminSendInvoice, adminGeneratePDF, bulkSendInvoices } from '../../services/invoices';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useContext(AuthContext);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  // Bulk selection
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [bulkSending, setBulkSending] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page,
        limit: 20,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await getAdminInvoices(token, params);
      
      if (response.invoices) {
        setInvoices(response.invoices);
        setPagination(response.pagination);
      } else {
        setError('Failed to fetch invoices');
      }
    } catch (err) {
      setError('Failed to fetch invoices: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchInvoices(1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      startDate: '',
      endDate: '',
    });
    setTimeout(() => fetchInvoices(1), 0);
  };

  const handleSendInvoice = async (orderId) => {
    if (window.confirm('Send invoice to customer via email?')) {
      try {
        const response = await adminSendInvoice(token, orderId);
        
        if (response.success !== false) {
          alert('Invoice sent successfully');
        } else {
          alert('Failed to send invoice: ' + response.message);
        }
      } catch (error) {
        alert('Failed to send invoice: ' + error.message);
      }
    }
  };

  const handleDownloadPDF = async (orderId, orderNumber) => {
    try {
      const blob = await adminGeneratePDF(token, orderId);
      
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${orderNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate PDF');
      }
    } catch (error) {
      alert('Failed to download invoice: ' + error.message);
    }
  };

  const handleSelectInvoice = (orderId) => {
    setSelectedInvoices(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedInvoices(invoices.map(inv => inv.order._id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleBulkSend = async () => {
    if (selectedInvoices.length === 0) {
      alert('Please select invoices to send');
      return;
    }

    if (window.confirm(`Send ${selectedInvoices.length} invoice(s) to customers?`)) {
      setBulkSending(true);
      try {
        const response = await bulkSendInvoices(token, selectedInvoices);
        
        if (response.success !== false) {
          alert(`Successfully sent ${selectedInvoices.length} invoice(s)`);
          setSelectedInvoices([]);
        } else {
          alert('Failed to send invoices: ' + response.message);
        }
      } catch (error) {
        alert('Failed to send invoices: ' + error.message);
      } finally {
        setBulkSending(false);
      }
    }
  };

  const handlePageChange = (page) => {
    fetchInvoices(page);
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
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && invoices.length === 0) {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Invoice Management</h1>
        {selectedInvoices.length > 0 && (
          <button
            onClick={handleBulkSend}
            disabled={bulkSending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {bulkSending ? 'Sending...' : `Send ${selectedInvoices.length} Invoice(s)`}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Order number or email"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => fetchInvoices()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results Info */}
      {pagination.totalInvoices !== undefined && (
        <div className="mb-4 text-gray-600">
          Showing {invoices.length} of {pagination.totalInvoices} invoices
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                    className="rounded"
                  />
                </th>
                <th className="py-3 px-6 text-left">Invoice #</th>
                <th className="py-3 px-6 text-left">Order #</th>
                <th className="py-3 px-6 text-left">Customer</th>
                <th className="py-3 px-6 text-center">Amount</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center">Date</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {invoices.map((invoice) => (
                <tr key={invoice._id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-center">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.order._id)}
                      onChange={() => handleSelectInvoice(invoice.order._id)}
                      className="rounded"
                    />
                  </td>
                  <td className="py-3 px-6 text-left">
                    <span className="font-mono font-medium">
                      INV-{invoice.invoiceNumber || invoice._id.slice(-8).toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-left">
                    <Link 
                      to={`/dashboard/orders/${invoice.order._id}`}
                      className="font-mono text-indigo-600 hover:text-indigo-800"
                    >
                      {invoice.order.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-6 text-left">
                    <div>
                      <div className="font-medium">
                        {invoice.order.customerInfo?.firstName} {invoice.order.customerInfo?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{invoice.order.customerInfo?.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-center font-medium">
                    {formatCurrency(invoice.order.total)}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.order.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : invoice.order.paymentStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {invoice.order.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center text-xs">
                    {formatDate(invoice.createdAt || invoice.order.createdAt)}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDownloadPDF(invoice.order._id, invoice.order.orderNumber)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        title="Download PDF"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleSendInvoice(invoice.order._id)}
                        className="text-green-600 hover:text-green-800 font-medium text-sm"
                        title="Send via Email"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <Link
                        to={`/dashboard/orders/${invoice.order._id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                        title="View Order"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoices.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            No invoices found. Try adjusting your filters.
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <div className="flex gap-1">
            {[...Array(pagination.totalPages)].map((_, index) => {
              const page = index + 1;
              const showPage = 
                page === 1 ||
                page === pagination.totalPages ||
                (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1);
              
              if (!showPage && page === 2) {
                return <span key={page} className="px-3 py-2">...</span>;
              }
              
              if (!showPage && page === pagination.totalPages - 1) {
                return <span key={page} className="px-3 py-2">...</span>;
              }
              
              if (!showPage) return null;
              
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 border rounded-lg ${
                    pagination.currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;