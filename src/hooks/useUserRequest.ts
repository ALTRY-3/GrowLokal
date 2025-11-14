/**
 * User & Order Requests Hook
 * Handles user profile and order-related API calls
 */

import { useState } from 'react';
import { requestService } from '@/services/RequestService';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type { UseRequestState } from '@/interfaces/common.interface';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: any[];
  totalAmount: number;
  status: string;
  shippingAddress: any;
  paymentInfo: any;
  createdAt: string;
}

interface OrderFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export const useUserRequest = () => {
  const [profileState, setProfileState] = useState<UseRequestState<User>>({
    data: null,
    loading: false,
    error: null,
  });

  const [ordersState, setOrdersState] = useState<UseRequestState<Order[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const [orderState, setOrderState] = useState<UseRequestState<Order>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Get user profile
   */
  const getProfile = async () => {
    setProfileState({ data: null, loading: true, error: null });
    
    try {
      const response = await requestService.get<User>(API_ENDPOINTS.USER.PROFILE);

      setProfileState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error: any) {
      setProfileState({ data: null, loading: false, error: error.message });
      throw error;
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (data: Partial<User>) => {
    setProfileState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await requestService.put<User>(
        API_ENDPOINTS.USER.PROFILE,
        data,
        { requireCsrf: true }
      );

      setProfileState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error: any) {
      setProfileState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
  };

  /**
   * Get user orders
   */
  const getOrders = async (filters?: OrderFilters) => {
    setOrdersState({ data: null, loading: true, error: null });
    
    try {
      const response = await requestService.get<Order[]>(
        API_ENDPOINTS.USER.ORDERS,
        { params: filters as any }
      );

      setOrdersState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error: any) {
      setOrdersState({ data: null, loading: false, error: error.message });
      throw error;
    }
  };

  /**
   * Get single order by ID
   */
  const getOrderById = async (orderId: string) => {
    setOrderState({ data: null, loading: true, error: null });
    
    try {
      const response = await requestService.get<Order>(
        API_ENDPOINTS.USER.ORDER_DETAIL(orderId)
      );

      setOrderState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error: any) {
      setOrderState({ data: null, loading: false, error: error.message });
      throw error;
    }
  };

  /**
   * Confirm order received
   */
  const confirmOrder = async (orderId: string) => {
    try {
      const response = await requestService.post<{ message: string }>(
        API_ENDPOINTS.USER.CONFIRM_ORDER(orderId),
        {},
        { requireCsrf: true }
      );
      
      // Refetch order to update state
      await getOrderById(orderId);
      
      return response;
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * Rate an order
   */
  const rateOrder = async (orderId: string, rating: number, review?: string) => {
    try {
      const response = await requestService.post<{ message: string }>(
        API_ENDPOINTS.USER.RATE_ORDER(orderId),
        { rating, review },
        { requireCsrf: true }
      );
      
      // Refetch order to update state
      await getOrderById(orderId);
      
      return response;
    } catch (error: any) {
      throw error;
    }
  };

  return {
    // Profile
    profileData: profileState.data,
    profileLoading: profileState.loading,
    profileError: profileState.error,
    getProfile,
    updateProfile,
    
    // Orders list
    ordersData: ordersState.data,
    ordersLoading: ordersState.loading,
    ordersError: ordersState.error,
    getOrders,
    
    // Single order
    orderData: orderState.data,
    orderLoading: orderState.loading,
    orderError: orderState.error,
    getOrderById,
    
    // Order actions
    confirmOrder,
    rateOrder,
  };
};
