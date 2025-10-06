import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getAdminQuotes, deleteQuote } from '../../services/quotes';

const QuotesPage = () => {
  const [quotes, setQuotes] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useContext(AuthContext);
  const [showFilters, setShowFilters] = useState(false);


  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async (page = 1) => {
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

      const response = await getAdminQuotes(token, params);
      
      if (response.quotes) {
        setQuotes(response.quotes);
        setPagination(response.pagination);
      } else {
        setError('Failed to fetch quotes');
      }
    } catch (err) {
      setError('Failed to fetch quotes: ' + err.message);
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
    fetchQuotes(1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
    });
    setTimeout(() => fetchQuotes(1), 0);
  };

  const handleDelete = async (id, customerName) => {
    if (window.confirm(`Delete quote request from ${customerName}?`)) {
      try {
        const response = await deleteQuote(token, id);
        
        if (response.success !== false) {
          fetchQuotes(pagination.currentPage);
        } else {
          alert('Failed to delete quote: ' + response.message);
        }
      } catch (error) {
        alert('Failed to delete quote: ' + error.message);
      }
    }
  };

  const handlePageChange = (page) => {
    fetchQuotes(page);
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading && quotes.length === 0) {
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
        <h1 className="text-3xl font-bold text-gray-800">Quotes & RFQ Management</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Customer name or email"
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
                <option value="pending">Pending</option>
                <option value="quoted">Quoted</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
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
            onClick={() => fetchQuotes()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results Info */}
      {pagination.totalQuotes !== undefined && (
        <div className="mb-4 text-gray-600">
          Showing {quotes.length} of {pagination.totalQuotes} quotes
        </div>
      )}

      {/* Quotes Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Quote #</th>
                <th className="py-3 px-6 text-left">Customer</th>
                <th className="py-3 px-6 text-center">Items</th>
                <th className="py-3 px-6 text-center">Total</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center">Date</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {quotes.map((quote) => (
                <tr key={quote._id} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-6 text-left">
                    <span className="font-mono font-medium">
                      QTE-{quote._id.slice(-8).toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-left">
                    <div>
                      <div className="font-medium">
                        {quote.customerInfo?.firstName} {quote.customerInfo?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{quote.customerInfo?.email}</div>
                      {quote.customerInfo?.company && (
                        <div className="text-xs text-gray-500">{quote.customerInfo.company}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-6 text-center">{quote.items?.length || 0}</td>
                  <td className="py-3 px-6 text-center font-medium">
                    {quote.totalAmount ? formatCurrency(quote.totalAmount) : 'N/A'}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(quote.status)}`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center text-xs">
                    {formatDate(quote.createdAt)}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        to={`/dashboard/quotes/${quote._id}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(quote._id, `${quote.customerInfo?.firstName} ${quote.customerInfo?.lastName}`)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {quotes.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            No quote requests found. Try adjusting your filters.
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

export default QuotesPage;