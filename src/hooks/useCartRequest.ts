/**
 * Cart Requests Hook
 * Handles all shopping cart API calls
 */

import { useState } from 'react';
import { requestService } from '@/services/RequestService';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type { UseRequestState, ApiResponse } from '@/interfaces/common.interface';

interface CartItem {
  product: string | any;
  quantity: number;
  price: number;
}

interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export const useCartRequest = () => {
  const [cartState, setCartState] = useState<UseRequestState<Cart>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Get cart
   */
  const getCart = async () => {
    setCartState({ data: null, loading: true, error: null });
    
    try {
      const response = await requestService.get<Cart>(API_ENDPOINTS.CART.GET);

      setCartState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error: any) {
      setCartState({ data: null, loading: false, error: error.message });
      throw error;
    }
  };

  /**
   * Add item to cart
   */
  const addToCart = async (productId: string, quantity: number = 1) => {
    setCartState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await requestService.post<Cart>(
        API_ENDPOINTS.CART.ADD,
        { productId, quantity },
        { requireCsrf: true }
      );

      setCartState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error: any) {
      setCartState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  /**
   * Update cart item quantity
   */
  const updateCartItem = async (productId: string, quantity: number) => {
    setCartState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await requestService.put<Cart>(
        API_ENDPOINTS.CART.UPDATE,
        { productId, quantity },
        { requireCsrf: true }
      );

      setCartState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error: any) {
      setCartState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  /**
   * Remove item from cart
   */
  const removeFromCart = async (productId: string) => {
    setCartState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await requestService.delete<Cart>(
        `${API_ENDPOINTS.CART.REMOVE}?productId=${productId}`,
        { requireCsrf: true }
      );

      setCartState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error: any) {
      setCartState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  /**
   * Clear entire cart
   */
  const clearCart = async () => {
    setCartState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await requestService.delete<Cart>(
        API_ENDPOINTS.CART.CLEAR,
        { requireCsrf: true }
      );

      setCartState({ data: null, loading: false, error: null });
      return response;
    } catch (error: any) {
      setCartState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  /**
   * Merge local cart with server cart
   */
  const mergeCart = async (localItems: CartItem[]) => {
    setCartState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await requestService.post<Cart>(
        API_ENDPOINTS.CART.MERGE,
        { items: localItems },
        { requireCsrf: true }
      );

      setCartState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error: any) {
      setCartState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  return {
    // Cart state
    cartData: cartState.data,
    cartLoading: cartState.loading,
    cartError: cartState.error,
    
    // Cart operations
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    mergeCart,
  };
};
