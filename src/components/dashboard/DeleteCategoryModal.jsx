import { useState, useEffect } from 'react';

const DeleteCategoryModal = ({
  isOpen,
  onClose,
  onConfirm,
  category,
  productCount,
  categories // All available categories for reassignment
}) => {
  const [action, setAction] = useState('reassign'); // 'delete', 'keep', or 'reassign'
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  // Filter out the current category and its children from reassignment options
  const availableCategories = categories.filter(cat =>
    cat._id !== category?._id && cat.parent?._id !== category?._id
  );

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAction(productCount > 0 ? 'reassign' : 'delete');
      setSelectedCategoryId('');
      setError(null);
      setIsDeleting(false);
    }
  }, [isOpen, productCount]);

  const handleDelete = async () => {
    // Validation
    if (action === 'reassign' && !selectedCategoryId) {
      setError('Please select a category to reassign products to');
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      await onConfirm(action, selectedCategoryId);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete category');
      setIsDeleting(false);
    }
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {/* Warning Icon */}
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Delete Category: "{category.name}"
                </h3>

                <div className="mt-4">
                  {productCount > 0 ? (
                    <p className="text-sm text-gray-600 mb-4">
                      This category has <span className="font-semibold text-gray-900">{productCount} product{productCount !== 1 ? 's' : ''}</span>.
                      What would you like to do with {productCount === 1 ? 'it' : 'them'}?
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600 mb-4">
                      This category has no products. Are you sure you want to delete it?
                    </p>
                  )}

                  {/* Action Options */}
                  {productCount > 0 && (
                    <div className="space-y-3">
                      {/* Option 1: Delete Products */}
                      <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="action"
                          value="delete"
                          checked={action === 'delete'}
                          onChange={(e) => setAction(e.target.value)}
                          className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            Delete products
                          </div>
                          <div className="text-sm text-red-600">
                            All {productCount} product{productCount !== 1 ? 's' : ''} will be permanently deleted
                          </div>
                        </div>
                      </label>

                      {/* Option 2: Keep Products (requires reassignment) */}
                      <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="action"
                          value="keep"
                          checked={action === 'keep'}
                          onChange={(e) => setAction(e.target.value)}
                          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            Keep products (requires reassignment)
                          </div>
                          <div className="text-sm text-gray-600">
                            Products will be set to inactive & out of stock until reassigned to a new category
                          </div>
                        </div>
                      </label>

                      {/* Option 3: Reassign to Another Category */}
                      <label className="flex items-start p-3 border-2 border-indigo-300 rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors">
                        <input
                          type="radio"
                          name="action"
                          value="reassign"
                          checked={action === 'reassign'}
                          onChange={(e) => setAction(e.target.value)}
                          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900 mb-2">
                            Reassign to another category
                          </div>

                          {action === 'reassign' && (
                            <select
                              value={selectedCategoryId}
                              onChange={(e) => setSelectedCategoryId(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="">Select Category</option>
                              {availableCategories.map(cat => (
                                <option key={cat._id} value={cat._id}>
                                  {cat.parent ? `${cat.parent.name} > ${cat.name}` : cat.name}
                                </option>
                              ))}
                            </select>
                          )}

                          <div className="text-sm text-gray-600 mt-2">
                            Products will be moved to the selected category and remain active
                          </div>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                isDeleting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              }`}
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete Category'
              )}
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteCategoryModal;
