/**
 * Product Requests Hook
 * Handles all product-related API calls
 */

import { useState } from 'react';
import { requestService } from '@/services/RequestService';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type { UseRequestState, PaginatedResponse } from '@/interfaces/common.interface';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  seller: any;
  ratings?: number;
  numReviews?: number;
}

interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export const useProductRequest = () => {
  const [productsState, setProductsState] = useState<UseRequestState<PaginatedResponse<Product[]>>>({
    data: null,
    loading: false,
    error: null,
  });

  const [productState, setProductState] = useState<UseRequestState<Product>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Get all products with filters
   */
  const getProducts = async (filters?: ProductFilters) => {
    setProductsState({ data: null, loading: true, error: null });
    
    try {
      const response = await requestService.get<Product[]>(
        API_ENDPOINTS.PRODUCTS.LIST,
        { params: filters as any }
      );

      setProductsState({ data: response as any, loading: false, error: null });
      return response;
    } catch (error: any) {
      setProductsState({ data: null, loading: false, error: error.message });
      throw error;
    }
  };

  /**
   * Get single product by ID
   */
  const getProductById = async (id: string) => {
    setProductState({ data: null, loading: true, error: null });
    
    try {
      const response = await requestService.get<Product>(
        API_ENDPOINTS.PRODUCTS.DETAIL(id)
      );

      setProductState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error: any) {
      setProductState({ data: null, loading: false, error: error.message });
      throw error;
    }
  };

  /**
   * Search products
   */
  const searchProducts = async (query: string, page?: number, limit?: number) => {
    setProductsState({ data: null, loading: true, error: null });
    
    try {
      const response = await requestService.get<Product[]>(
        API_ENDPOINTS.PRODUCTS.SEARCH,
        { params: { query, page, limit } as any }
      );

      setProductsState({ data: response as any, loading: false, error: null });
      return response;
    } catch (error: any) {
      setProductsState({ data: null, loading: false, error: error.message });
      throw error;
    }
  };

  /**
   * Get products by category
   */
  const getProductsByCategory = async (category: string, limit?: number) => {
    setProductsState({ data: null, loading: true, error: null });
    
    try {
      const response = await requestService.get<Product[]>(
        API_ENDPOINTS.PRODUCTS.BY_CATEGORY(category, limit)
      );

      setProductsState({ data: response as any, loading: false, error: null });
      return response;
    } catch (error: any) {
      setProductsState({ data: null, loading: false, error: error.message });
      throw error;
    }
  };

  return {
    // Products list
    getProducts,
    productsLoading: productsState.loading,
    productsError: productsState.error,
    productsData: productsState.data,
    
    // Single product
    getProductById,
    productLoading: productState.loading,
    productError: productState.error,
    productData: productState.data,
    
    // Search
    searchProducts,
    
    // Category
    getProductsByCategory,
  };
};
