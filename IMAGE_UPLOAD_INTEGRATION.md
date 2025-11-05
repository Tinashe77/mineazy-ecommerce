# Image Upload Integration Guide

This guide explains how the frontend integrates with the backend for image upload operations, using the existing `PUT /api/products/:id` endpoint.

## Overview

The application provides two ways to add images to products:
1. **Single Product Image Upload** - Add images to one product at a time via the "Add Images" button in the product listing
2. **Bulk Image Upload** - Add images to multiple products at once via the "Bulk Images" button

Both methods use the existing backend endpoint: `PUT /api/products/:id`

---

## Backend Endpoint Reference

### Endpoint: `PUT /api/products/:id`

**Location:** `routes/products.js:664`

**Purpose:** Update an existing product, including adding/removing images

**Authentication:** Required (Admin or Inventory Manager role)

**Upload Handler:** `upload.array('images')` - Accepts multiple images

#### Request Format

```http
PUT /api/products/:id
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

#### Form Data Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `images` | File[] | Array of image files to add (appended to existing) |
| `removeImages` | String[] | Array of image URLs to remove |
| `name` | String | (Optional) Product name |
| `description` | String | (Optional) Product description |
| `price` | Number | (Optional) Product price |
| ... | ... | Any other product fields to update |

#### Key Backend Behaviors (Line 728)

1. **Images are APPENDED** - New images are added to existing ones, not replaced
2. **Cloudinary Storage** - Images are uploaded to Cloudinary (or local storage if configured)
3. **Media Tracking** - All images are registered in the Media collection
4. **Removal Support** - Can remove specific images using `removeImages` parameter

#### Response Format

```json
{
  "success": true,
  "product": {
    "_id": "product_id",
    "name": "Product Name",
    "images": [
      "cloudinary_url_1",
      "cloudinary_url_2",
      "cloudinary_url_3"
    ],
    ...
  }
}
```

---

## Frontend Implementation

### 1. Single Product Image Upload

**Component:** `src/components/dashboard/AddProductImages.jsx`

**User Flow:**
1. User clicks "Add Images" button on product row in `ProductsPage`
2. Modal opens showing product details
3. User drags/drops or selects images
4. Images are previewed before upload
5. User clicks "Upload" to add images to the product

**Code Example:**

```javascript
import { updateProduct } from '../../services/products';

const handleUpload = async () => {
  const formData = new FormData();

  // Append all selected images
  selectedFiles.forEach(file => {
    formData.append('images', file);
  });

  // Call the update endpoint
  const response = await updateProduct(token, product._id, formData);

  if (response.success !== false) {
    // Success - images were appended to the product
    alert(`Successfully added ${selectedFiles.length} image(s)`);
  }
};
```

**Key Points:**
- Uses `FormData` for file upload
- Field name MUST be `'images'` (plural) to match backend `upload.array('images')`
- No `Content-Type` header (browser sets it automatically with boundary)
- Images are appended to existing product images

---

### 2. Bulk Image Upload

**Component:** `src/components/dashboard/BulkImageImport.jsx`

**User Flow:**
1. User clicks "Bulk Images" button
2. Selects a category to filter products
3. Uploads multiple images (drag/drop or browse)
4. System auto-matches images to products based on:
   - Exact image path match (if product already has that image)
   - Filename matching product name
   - Fuzzy matching on product name/SKU
5. User reviews and adjusts matches
6. System uploads images and assigns to multiple products

**Code Example:**

```javascript
import { bulkUploadImages } from '../../services/products';

// Build mapping: { "filename.jpg": ["productId1", "productId2"] }
const mapping = {};
Object.entries(imageMatches).forEach(([filename, match]) => {
  mapping[filename] = match.products.map(p => p.id);
});

// Upload images with mapping
const response = await bulkUploadImages(token, imageFiles, mapping);
```

**Backend Integration:**

The bulk upload uses a special endpoint that internally calls the same `PUT /api/products/:id` endpoint for each product:

```http
POST /api/products/bulk-images
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- images: [file1, file2, file3, ...]
- mapping: {"file1.jpg": ["productId1", "productId2"], "file2.jpg": ["productId3"]}
```

---

## Service Layer

### File: `src/services/products.js`

#### Function: `updateProduct`

```javascript
export const updateProduct = async (token, id, productData) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // NO Content-Type header for FormData
      },
      body: productData, // FormData object
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};
```

#### Function: `bulkUploadImages`

```javascript
export const bulkUploadImages = async (token, imageFiles, mapping) => {
  try {
    const formData = new FormData();

    // Append all image files
    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    // Append mapping data as JSON string
    formData.append('mapping', JSON.stringify(mapping));

    const response = await fetch(`${API_URL}/bulk-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // NO Content-Type header
      },
      body: formData,
    });

    return await handleResponse(response);
  } catch (error) {
    return { success: false, message: error.message };
  }
};
```

---

## Backend Requirements Checklist

To ensure seamless integration, your backend must:

### ✅ Essential Requirements

1. **Endpoint Exists**
   - `PUT /api/products/:id` endpoint is available
   - Located at `routes/products.js:664`

2. **Multipart Form Data Handling**
   ```javascript
   const multer = require('multer');
   const upload = multer({ storage: /* your storage config */ });

   router.put('/:id',
     authenticate,
     authorize(['admin', 'inventory_manager']),
     upload.array('images'),  // ← MUST use .array('images')
     async (req, res) => {
       // Your handler
     }
   );
   ```

3. **Image Append Logic** (Line 728)
   ```javascript
   // Images should be APPENDED, not replaced
   if (req.files && req.files.length > 0) {
     const newImages = req.files.map(file => file.path); // or cloudinary URL
     product.images = [...product.images, ...newImages]; // ← APPEND
   }
   ```

4. **Authentication & Authorization**
   - Requires valid JWT token in `Authorization: Bearer <token>` header
   - User must have `admin` or `inventory_manager` role

5. **Image Storage**
   - Cloudinary integration (recommended)
   - OR local file storage with proper URL generation

6. **Media Collection Tracking**
   - Register uploaded images in Media collection for tracking

### ✅ Optional Enhancements

7. **Remove Images Support**
   ```javascript
   if (req.body.removeImages) {
     const removeUrls = Array.isArray(req.body.removeImages)
       ? req.body.removeImages
       : JSON.parse(req.body.removeImages);

     product.images = product.images.filter(
       img => !removeUrls.includes(img)
     );
   }
   ```

8. **Bulk Images Endpoint** (for bulk operations)
   ```javascript
   router.post('/bulk-images',
     authenticate,
     authorize(['admin', 'inventory_manager']),
     upload.array('images'),
     async (req, res) => {
       const mapping = JSON.parse(req.body.mapping);
       // Process mapping and assign images to products
     }
   );
   ```

---

## Common Issues & Solutions

### Issue 1: Images are being replaced instead of appended

**Problem:** New images replace all existing images

**Solution:** Ensure backend appends new images to existing array:
```javascript
// ❌ WRONG - Replaces images
product.images = req.files.map(f => f.path);

// ✅ CORRECT - Appends images
product.images = [...product.images, ...req.files.map(f => f.path)];
```

### Issue 2: "Multipart boundary not found" error

**Problem:** Frontend sets `Content-Type: multipart/form-data` manually

**Solution:** Remove Content-Type header, let browser set it:
```javascript
// ❌ WRONG
fetch(url, {
  headers: {
    'Content-Type': 'multipart/form-data', // ← Remove this
    'Authorization': `Bearer ${token}`,
  },
  body: formData
});

// ✅ CORRECT
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
    // No Content-Type - browser adds it with boundary
  },
  body: formData
});
```

### Issue 3: Images not uploading

**Problem:** Field name mismatch between frontend and backend

**Solution:** Ensure field name is exactly `'images'`:
```javascript
// Frontend
formData.append('images', file); // ← Must be 'images'

// Backend
upload.array('images') // ← Must match frontend
```

### Issue 4: 401 Unauthorized

**Problem:** Missing or invalid authentication token

**Solution:** Ensure token is valid and user has correct role:
```javascript
// Check token exists
if (!token) {
  console.error('No authentication token');
  return;
}

// Token should be in Authorization header
headers: {
  'Authorization': `Bearer ${token}`,
}
```

---

## Testing Checklist

### Single Product Upload

- [ ] Click "Add Images" on a product
- [ ] Modal opens with correct product details
- [ ] Drag and drop images works
- [ ] File browser selection works
- [ ] Image previews display correctly
- [ ] Can remove images before upload
- [ ] Upload button is disabled when no images selected
- [ ] Upload shows loading state
- [ ] Success message appears after upload
- [ ] Product list refreshes with new image count
- [ ] Images appear on product detail page

### Bulk Upload

- [ ] Click "Bulk Images" button
- [ ] Category selection filters products
- [ ] Upload multiple images
- [ ] Auto-matching works (exact path, filename, fuzzy)
- [ ] Can manually search and assign products
- [ ] Can assign one image to multiple products
- [ ] Can remove matches before upload
- [ ] Unmatched images shown separately
- [ ] Upload processes all matched images
- [ ] Success results show file mappings and updated products
- [ ] Error handling works for failed uploads

---

## API Response Examples

### Success Response

```json
{
  "success": true,
  "product": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "ROUND BAR 18MM*3M",
    "sku": "RB-18-3M",
    "images": [
      "https://res.cloudinary.com/.../existing-image-1.jpg",
      "https://res.cloudinary.com/.../existing-image-2.jpg",
      "https://res.cloudinary.com/.../newly-added-image-1.jpg",
      "https://res.cloudinary.com/.../newly-added-image-2.jpg"
    ],
    "price": 125.50,
    "stockQuantity": 50
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Product not found"
}
```

### Bulk Upload Success

```json
{
  "success": true,
  "uploaded": 5,
  "failed": 0,
  "productsUpdated": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "productName": "Product 1",
      "imagesAdded": 2,
      "totalImages": 5
    }
  ],
  "fileMappings": [
    {
      "originalName": "image1.jpg",
      "storedUrl": "cloudinary_url",
      "productIds": ["507f1f77bcf86cd799439011"]
    }
  ]
}
```

---

## Best Practices

1. **Always use FormData for file uploads**
   - Never stringify files to JSON
   - Let browser handle multipart encoding

2. **Never set Content-Type header for FormData**
   - Browser automatically adds multipart/form-data with boundary
   - Manual setting will break the upload

3. **Validate file types and sizes on frontend**
   - Check file.type.startsWith('image/')
   - Limit file sizes (recommended: 5MB max)

4. **Provide user feedback**
   - Show loading states during upload
   - Display previews before upload
   - Show success/error messages
   - Refresh data after successful upload

5. **Handle errors gracefully**
   - Network errors
   - Authentication errors
   - File size/type errors
   - Backend validation errors

6. **Optimize images before upload** (optional)
   - Compress large images
   - Convert to WebP format
   - Generate thumbnails

---

## Security Considerations

1. **Authentication Required**
   - All image upload endpoints require authentication
   - Use JWT tokens in Authorization header

2. **Role-Based Access**
   - Only admin and inventory_manager roles can upload images
   - Frontend should check user role before showing upload UI

3. **File Validation**
   - Backend should validate file types (whitelist: jpg, png, gif, webp)
   - Backend should enforce file size limits
   - Backend should sanitize filenames

4. **Rate Limiting**
   - Consider implementing rate limits for upload endpoints
   - Prevent abuse and DOS attacks

5. **CORS Configuration**
   - Ensure backend allows frontend origin
   - Configure proper CORS headers for file uploads

---

## Performance Optimization

1. **Lazy Loading Images**
   - Load product images on demand
   - Use intersection observer for infinite scroll

2. **Image CDN**
   - Use Cloudinary's CDN for fast delivery
   - Leverage Cloudinary transformations for resizing

3. **Batch Uploads**
   - Process multiple files in parallel when possible
   - Show progress for each file

4. **Compression**
   - Enable gzip/brotli compression for API responses
   - Optimize image quality vs file size

---

## Summary

The image upload integration follows these principles:

1. **Reuses Existing Endpoint** - Uses `PUT /api/products/:id` for single uploads
2. **Appends Images** - New images are added to existing ones (line 728)
3. **Multipart Form Data** - All uploads use FormData with `images` field
4. **No Manual Headers** - Browser automatically sets Content-Type with boundary
5. **Role-Based Security** - Requires authentication and proper authorization
6. **User-Friendly UI** - Drag/drop, previews, auto-matching, and clear feedback

By following this guide, you can ensure seamless integration between the frontend image upload features and your backend product update endpoint.
