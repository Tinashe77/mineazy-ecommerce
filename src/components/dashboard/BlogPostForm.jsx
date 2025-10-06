import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { createBlogPost, updateBlogPost, getBlogPosts, getBlogCategories } from '../../services/blog';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BlogPostForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: '',
    status: 'draft',
    metaTitle: '',
    metaDescription: '',
  });

  const [featuredImage, setFeaturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImage, setExistingImage] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Configure toolbar modules
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'image', 'video'
  ];

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchPost();
    }
  }, [id, isEditMode]);

  const fetchCategories = async () => {
    try {
      const response = await getBlogCategories();
      if (Array.isArray(response)) {
        setCategories(response);
      } else if (response.categories) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
      setError('Failed to load categories');
    }
  };

  const fetchPost = async () => {
    setLoading(true);
    try {
      // Fetch all posts (draft, published, archived) by not passing status parameter
      // The backend defaults to 'published' if status is provided, so we need to fetch without it
      const draftPosts = await getBlogPosts({ status: 'draft' });
      const publishedPosts = await getBlogPosts({ status: 'published' });
      const archivedPosts = await getBlogPosts({ status: 'archived' });
      
      // Combine all posts
      const allPosts = [
        ...(draftPosts.posts || []),
        ...(publishedPosts.posts || []),
        ...(archivedPosts.posts || [])
      ];
      
      const post = allPosts.find(p => p._id === id);
      
      if (post) {
        // Populate form with post data
        setFormData({
          title: post.title || '',
          content: post.content || '',
          excerpt: post.excerpt || '',
          category: post.category?._id || post.category || '',
          tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
          status: post.status || 'draft',
          metaTitle: post.metaTitle || '',
          metaDescription: post.metaDescription || '',
        });
        
        // Set featured image if exists
        if (post.featuredImage) {
          setExistingImage(post.featuredImage);
          setImagePreview(post.featuredImage);
        }
      } else {
        setError('Post not found');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to fetch post data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFeaturedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFeaturedImage(null);
    setImagePreview('');
    setExistingImage('');
  };

  const handleSubmit = async (status) => {
    setLoading(true);
    setError(null);

    const postData = new FormData();
    
    // Append form fields
    Object.keys(formData).forEach(key => {
      if (formData[key] !== '' && formData[key] !== null) {
        postData.append(key, formData[key]);
      }
    });
    
    // Override status with the one passed to the function
    postData.set('status', status);
    
    // Append image if selected
    if (featuredImage) {
      postData.append('featuredImage', featuredImage);
    }

    try {
      let response;
      if (isEditMode) {
        response = await updateBlogPost(token, id, postData);
      } else {
        response = await createBlogPost(token, postData);
      }
      
      if (response.success !== false) {
        navigate('/dashboard/blog');
      } else {
        setError(response.message || 'Failed to save post');
      }
    } catch (err) {
      setError('Failed to save post. Please check your input.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !formData.title) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit Post' : 'Add New Post'}
              </h1>
              <button
                type="button"
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                ⚙️
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard/blog')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className="px-4 py-2 text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('published')}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50"
              >
                💾
                {loading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Title Input */}
              <div className="p-6 border-b border-gray-200">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Add title"
                  required
                  className="w-full text-3xl font-bold text-gray-500 placeholder-gray-400 border-0 focus:ring-0 p-0"
                  style={{ outline: 'none', boxShadow: 'none' }}
                />
              </div>
 {/* Content Editor - INCREASED HEIGHT */}
              <div className="p-6">
                <style>{`
                  .ql-editor {
                    color: #6b7280 !important;
                    font-size: 16px;
                  }
                  .ql-editor.ql-blank::before {
                    color: #9ca3af !important;
                  }
                    .ql-container.ql-snow {
    border: 1px solid #ccc;
    min-height: 200px;
}
                `}</style>
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(value) => handleChange('content', value)}
                  modules={quillModules}
                  formats={quillFormats}
                  className="bg-white"
                  style={{ minHeight: '200px' }}
                  placeholder="Start writing your blog post..."
                />
                <p className="text-sm text-gray-500 mt-4">
                  💡 Tip: Use the toolbar above for formatting options
                </p>
              </div>

              {/* Featured Image Section */}
              <div className="p-6 border-b border-gray-200">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Featured"
                      className="w-full max-h-96 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg"
                    >
                      ❌
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-12 h-12 text-gray-400 mb-3 text-4xl">🖼️</div>
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-semibold">Click to upload</span> featured image
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB (1200x630px recommended)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>

             
              {/* Excerpt */}
              <div className="p-6 border-t border-gray-200">
                <details className="group">
                  <summary className="cursor-pointer text-gray-700 font-medium flex items-center justify-between hover:text-gray-900">
                    <span>Excerpt</span>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-4">
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => handleChange('excerpt', e.target.value)}
                      rows={3}
                      placeholder="Write an excerpt (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-500"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Brief description for archives and search results
                    </p>
                  </div>
                </details>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className={`w-80 space-y-6 ${showSidebar ? 'block' : 'hidden lg:block'}`}>
            {/* Publish Box */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                ⚙️ Publish
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 mb-3">No categories available</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((cat) => (
                    <label key={cat._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="radio"
                        name="category"
                        value={cat._id}
                        checked={formData.category === cat._id}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                      {cat.postCount !== undefined && (
                        <span className="text-xs text-gray-400 ml-auto">({cat.postCount})</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => navigate('/dashboard/blog/categories')}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add New Category
              </button>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🏷️ Tags
              </h3>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                placeholder="mining, equipment, industry"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                Separate tags with commas
              </p>
            </div>

            {/* SEO Settings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <details className="group">
                <summary className="cursor-pointer font-semibold text-gray-900 flex items-center justify-between hover:text-gray-700">
                  <span>SEO Settings</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => handleChange('metaTitle', e.target.value)}
                      maxLength={60}
                      placeholder="SEO title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.metaTitle.length}/60 characters
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={formData.metaDescription}
                      onChange={(e) => handleChange('metaDescription', e.target.value)}
                      maxLength={160}
                      rows={3}
                      placeholder="SEO description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.metaDescription.length}/160 characters
                    </p>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostForm;