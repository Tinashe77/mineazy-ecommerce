import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { createBlogPost, updateBlogPost, getBlogPosts, getBlogCategories } from '../../services/blog';

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
  const [existingImage, setExistingImage] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchPost();
    }
  }, [id, isEditMode]);

  const fetchCategories = async () => {
    try {
      const response = await getBlogCategories();
      if (response.categories) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchPost = async () => {
    setLoading(true);
    try {
      const response = await getBlogPosts({ status: '' });
      const post = response.posts?.find(p => p._id === id);
      
      if (post) {
        setFormData({
          title: post.title || '',
          content: post.content || '',
          excerpt: post.excerpt || '',
          category: post.category?._id || '',
          tags: post.tags?.join(', ') || '',
          status: post.status || 'draft',
          metaTitle: post.metaTitle || '',
          metaDescription: post.metaDescription || '',
        });
        setExistingImage(post.featuredImage || '');
      }
    } catch (err) {
      setError('Failed to fetch post data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFeaturedImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const postData = new FormData();
    
    // Append form fields
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        postData.append(key, formData[key]);
      }
    });
    
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
    return <div className="text-center py-12">Loading post...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {isEditMode ? 'Edit Blog Post' : 'Create New Post'}
      </h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter post title"
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Excerpt
            </label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows={3}
              placeholder="Brief description of the post"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={15}
              placeholder="Write your post content here..."
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            />
            <p className="text-sm text-gray-500 mt-1">
              Supports Markdown formatting
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="mining, equipment, industry, tips"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Featured Image
            </label>
            {existingImage && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">Current image:</p>
                <img 
                  src={existingImage} 
                  alt="Current featured" 
                  className="w-full max-w-md h-48 object-cover rounded border"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              Recommended size: 1200x630px
            </p>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleChange}
                  placeholder="SEO title for search engines"
                  maxLength={60}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.metaTitle.length}/60 characters
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Meta Description
                </label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleChange}
                  rows={3}
                  placeholder="SEO description for search engines"
                  maxLength={160}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.metaDescription.length}/160 characters
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Post' : 'Create Post'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/blog')}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogPostForm;