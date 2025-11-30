"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FaArrowLeft, FaTimes, FaSpinner } from "react-icons/fa";
import "./add-product.css";

const categories = [
  { label: "Handicrafts", value: "handicrafts" },
  { label: "Fashion", value: "fashion" },
  { label: "Home", value: "home" },
  { label: "Food", value: "food" },
  { label: "Beauty", value: "beauty" },
];

export default function AddProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;
  
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  // Authentication check
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user) {
      router.push("/login");
      return;
    }

    // Load product data if in edit mode
    if (isEditMode && editId) {
      loadProductData(editId);
    }
  }, [session, status, router, isEditMode, editId]);

  // Load existing product data for editing
  const loadProductData = async (productId: string) => {
    try {
      setLoadingProduct(true);
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      if (data.success) {
        const product = data.data;
        setProductName(product.name);
        setProductDesc(product.description);
        setCategory(product.category);
        setPrice(product.price.toString());
        setStock(product.stock.toString());
        setExistingImages(product.images || []);
      } else {
        setError(data.message || 'Failed to load product');
      }
    } catch (error: any) {
      console.error('Error loading product:', error);
      setError('Failed to load product data');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArr = Array.from(e.target.files);

    setPhotos((prev) => [...prev, ...filesArr].slice(0, 3));
    e.target.value = "";
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveExistingImage = (idx: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleBack = () => {
    router.push("/product");
  };

  // Upload images to server
  const uploadImages = async (files: File[]): Promise<string[]> => {
    const imageUrls: string[] = [];
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'products');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      if (data.success) {
        imageUrls.push(data.url);
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    }
    
    return imageUrls;
  };

  // Handle form submission
  const handleSubmit = async (isDraft = false) => {
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(isEditMode ? 'Updating product...' : 'Creating product...');

      // Upload new images if any
      let newImageUrls: string[] = [];
      if (photos.length > 0) {
        console.log('Uploading new images:', photos.length);
        newImageUrls = await uploadImages(photos);
        console.log('New images uploaded:', newImageUrls);
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls];
      
      if (allImages.length === 0) {
        setError('At least one image is required');
        return;
      }

      // Generate SKU only for new products
      const generateSKU = () => {
        const categoryCode = category.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `${categoryCode}-${timestamp}-${random}`;
      };

      // Prepare product data
      const productData = {
        name: productName.trim(),
        description: productDesc.trim(),
        category: category,
        price: parseFloat(price),
        stock: parseInt(stock),
        images: allImages,
        thumbnailUrl: allImages[0],
        isActive: !isDraft,
        artistName: session?.user?.name || 'Unknown Artist',
        ...(isEditMode ? {} : { sku: generateSKU() }) // Only add SKU for new products
      };
      
      console.log('Product data:', productData);

      // Submit to API
      const url = isEditMode ? `/api/products/${editId}` : '/api/products';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();
      console.log('API response:', result);

      if (result.success) {
        setSuccess(true);
        console.log(isEditMode ? 'Product updated successfully!' : 'Product created successfully!');
        
        // Reset form for new products, keep data for edits
        if (!isEditMode) {
          setProductName("");
          setProductDesc("");
          setCategory("");
          setPrice("");
          setStock("");
          setPhotos([]);
          setExistingImages([]);
        }
        
        // Redirect after success
        setTimeout(() => {
          router.push("/product");
        }, 2000);
      } else {
        setError(result.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
        console.error(`Product ${isEditMode ? 'update' : 'creation'} failed:`, result);
      }
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} product:`, error);
      setError(error.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
    } finally {
      setLoading(false);
    }
  };

  // Improved validation
  const validateForm = () => {
    const errors = [];
    
    // Name validation
    if (!productName.trim()) errors.push("Product name is required");
    if (productName.trim().length < 3) errors.push("Product name must be at least 3 characters");
    if (productName.trim().length > 200) errors.push("Product name cannot exceed 200 characters");
    
    // Description validation  
    if (!productDesc.trim()) errors.push("Description is required");
    if (productDesc.trim().length < 10) errors.push("Description must be at least 10 characters");
    if (productDesc.trim().length > 2000) errors.push("Description cannot exceed 2000 characters");
    
    // Category validation
    if (!category) errors.push("Category is required");
    
    // Price validation
    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      errors.push("Price must be a positive number");
    }
    
    // Stock validation
    const stockNum = parseInt(stock);
    if (stock === "" || isNaN(stockNum) || stockNum < 0) {
      errors.push("Stock must be 0 or greater");
    }
    
    // Images validation - check both existing and new images
    const totalImages = existingImages.length + photos.length;
    if (totalImages === 0) errors.push("At least one product image is required");
    
    return errors;
  };

  const allFieldsValid = () => {
    const totalImages = existingImages.length + photos.length;
    return (
      productName.trim().length >= 3 &&
      productName.trim().length <= 200 &&
      productDesc.trim().length >= 10 &&
      productDesc.trim().length <= 2000 &&
      category &&
      parseFloat(price) > 0 &&
      parseInt(stock) >= 0 &&
      totalImages > 0
    );
  };

  return (
    <>
      <Navbar />
      <div className="add-product-wrapper" style={{ position: 'relative' }}>
        {/* Loading overlay for product data */}
        {loadingProduct && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <FaSpinner style={{ fontSize: '2rem', color: '#AF7928' }} className="fa-spin" />
              <p style={{ marginTop: '1rem', color: '#2e3f36' }}>Loading product...</p>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <FaSpinner style={{ fontSize: '2rem', color: '#AF7928' }} className="fa-spin" />
              <p style={{ marginTop: '1rem', color: '#2e3f36' }}>
                {isEditMode ? 'Updating product...' : 'Creating product...'}
              </p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            textAlign: 'center'
          }}>
            <h3>{isEditMode ? 'Product Updated Successfully!' : 'Product Created Successfully!'}</h3>
            <p>Redirecting to your products...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* Back Button and Title */}
        <div className="add-product-header-row">
          <button className="add-product-back-btn" onClick={handleBack} disabled={loading || loadingProduct}>
            <FaArrowLeft />
          </button>
          <span className="add-product-title">
            {isEditMode ? 'Edit Product' : 'Add Product'}
          </span>
        </div>

        {/* Photo Upload Card */}
        <div className="add-product-card add-product-photo-card">
          <div className="add-product-photo-list">
            {/* Existing Images */}
            {existingImages.map((imageUrl, idx) => (
              <div className="add-product-photo-preview" key={`existing-${idx}`}>
                <img
                  src={imageUrl}
                  alt={`Existing ${idx + 1}`}
                  className="add-product-photo-img"
                />
                <button
                  className="add-product-photo-remove"
                  onClick={() => handleRemoveExistingImage(idx)}
                  type="button"
                  aria-label="Remove existing photo"
                  style={{ backgroundColor: '#AF7928' }}
                >
                  <FaTimes />
                </button>
              </div>
            ))}
            
            {/* New Photos */}
            {photos.map((file, idx) => (
              <div className="add-product-photo-preview" key={`new-${idx}`}>
                <img
                  src={URL.createObjectURL(file)}
                  alt={`New ${idx + 1}`}
                  className="add-product-photo-img"
                />
                <button
                  className="add-product-photo-remove"
                  onClick={() => handleRemovePhoto(idx)}
                  type="button"
                  aria-label="Remove new photo"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
            
            {/* Add Photo Placeholder */}
            {(existingImages.length + photos.length) < 3 && (
              <label className="add-product-photo-placeholder">
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handlePhotoChange}
                  multiple
                  disabled={(existingImages.length + photos.length) >= 3}
                />
                <span className="add-photo-plus">+ Add Photo</span>
              </label>
            )}
          </div>
          <div className="add-product-photo-note">
            You can add up to 3 photos total. {existingImages.length > 0 && `(${existingImages.length} existing, ${3 - existingImages.length} more allowed)`}
          </div>
        </div>

        {/* Product Name */}
        <div className="add-product-card">
          <div className="add-product-card-header">
            Product Name <span className="required">*</span>
            <span className="char-limit">3-200 characters</span>
          </div>
          <input
            className="add-product-input"
            type="text"
            maxLength={200}
            placeholder="Enter Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
          <span style={{ fontSize: "12px", color: productName.length < 3 ? "#e74c3c" : productName.length <= 200 ? "#4caf50" : "#e74c3c" }}>
            {productName.length}/200 characters {productName.length >= 3 && productName.length <= 200 && "✓"}
          </span>
        </div>

        {/* Product Description */}
        <div className="add-product-card">
          <div className="add-product-card-header">
            Product Description <span className="required">*</span>
            <span className="char-limit">10-2000 characters</span>
          </div>
          <textarea
            className="add-product-textarea"
            maxLength={2000}
            placeholder="Describe your product in detail"
            value={productDesc}
            onChange={(e) => setProductDesc(e.target.value)}
            rows={6}
            required
          />
          <span style={{ fontSize: "12px", color: productDesc.length < 10 ? "#e74c3c" : productDesc.length <= 2000 ? "#4caf50" : "#e74c3c" }}>
            {productDesc.length}/2000 characters {productDesc.length >= 10 && productDesc.length <= 2000 && "✓"}
          </span>
        </div>

        {/* Category */}
        <div className="add-product-card">
          <div className="add-product-card-header">
            Category <span className="required">*</span>
          </div>
          <select
            className="add-product-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option value={cat.value} key={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="add-product-card add-product-fields-grid">
          <div className="add-product-field-row">
            <label className="add-product-card-header">
              Price <span style={{ color: "red" }}>*</span>
            </label>
            <input
              className="add-product-input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="₱0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <span style={{ fontSize: "12px", color: parseFloat(price) > 0 ? "#4caf50" : "#e74c3c" }}>
              {price && parseFloat(price) > 0 && "✓ Valid price"}
              {price && parseFloat(price) <= 0 && "Price must be greater than 0"}
            </span>
          </div>
          <div className="add-product-field-row">
            <label className="add-product-card-header">
              Stock <span style={{ color: "red" }}>*</span>
            </label>
            <input
              className="add-product-input"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
            <span style={{ fontSize: "12px", color: parseInt(stock) >= 0 ? "#4caf50" : "#e74c3c" }}>
              {stock !== "" && parseInt(stock) >= 0 && "✓ Valid stock"}
              {stock !== "" && parseInt(stock) < 0 && "Stock cannot be negative"}
            </span>
          </div>
          <hr className="add-product-divider" />
          <div className="add-product-btn-row">
            <button
              className="add-product-btn save"
              disabled={!allFieldsValid() || loading || loadingProduct}
              onClick={() => handleSubmit(true)}
              title={!allFieldsValid() ? "Fill all required fields correctly" : 
                     isEditMode ? "Update as draft" : "Save as draft"}
            >
              {loading ? <FaSpinner className="fa-spin" /> : 
               isEditMode ? "Update Draft" : "Save"}
            </button>
            <button
              className="add-product-btn publish"
              disabled={!allFieldsValid() || loading || loadingProduct}
              onClick={() => handleSubmit(false)}
              title={!allFieldsValid() ? "Fill all required fields correctly" : 
                     isEditMode ? "Update and publish" : "Publish product"}
            >
              {loading ? <FaSpinner className="fa-spin" /> : 
               isEditMode ? "Update & Publish" : "Publish"}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

