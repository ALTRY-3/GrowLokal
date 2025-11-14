/**
 * Wishlist Requests Hook
 * Handles all wishlist-related API calls
 */

import { useState } from 'react';
import { requestService } from '@/services/RequestService';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type { UseRequestState } from '@/interfaces/common.interface';

interface WishlistItem {
  _id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
}

interface Wishlist {
  items: WishlistItem[];
  totalItems: number;
}

export const useWishlistRequest = () => {
  const [wishlistState, setWishlistState] = useState<UseRequestState<Wishlist>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Get wishlist
   */
  const getWishlist = async () => {
    setWishlistState({ data: null, loading: true, error: null });
    
    try {
      const response = await requestService.get<Wishlist>(API_ENDPOINTS.WISHLIST.GET);

      setWishlistState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error: any) {
      setWishlistState({ data: null, loading: false, error: error.message });
      throw error;
    }
  };

  /**
   * Add product to wishlist
   */
  const addToWishlist = async (productId: string) => {
    setWishlistState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await requestService.post<Wishlist>(
        API_ENDPOINTS.WISHLIST.ADD,
        { productId },
        { requireCsrf: true }
      );

      setWishlistState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error: any) {
      setWishlistState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  /**
   * Remove product from wishlist
   */
  const removeFromWishlist = async (productId: string) => {
    setWishlistState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await requestService.delete<Wishlist>(
        `${API_ENDPOINTS.WISHLIST.REMOVE}?productId=${productId}`,
        { requireCsrf: true }
      );

      setWishlistState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error: any) {
      setWishlistState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  /**
   * Toggle product in wishlist (add if not exists, remove if exists)
   */
  const toggleWishlist = async (productId: string, isInWishlist: boolean) => {
    if (isInWishlist) {
      return removeFromWishlist(productId);
    } else {
      return addToWishlist(productId);
    }
  };

  /**
   * Check if product is in wishlist
   */
  const isProductInWishlist = (productId: string): boolean => {
    if (!wishlistState.data?.items) return false;
    return wishlistState.data.items.some(item => item._id === productId);
  };

  return {
    // Wishlist state
    wishlistData: wishlistState.data,
    wishlistLoading: wishlistState.loading,
    wishlistError: wishlistState.error,
    
    // Wishlist operations
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isProductInWishlist,
  };
};
