/**
 * Order Requests Hook
 * Handles order creation and checkout
 */

import { useState } from 'react';
import { requestService } from '@/services/RequestService';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type { UseRequestState } from '@/interfaces/common.interface';

interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface OrderData {
  items: Array<{
    product: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  totalAmount: number;
}

interface OrderResponse {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentIntentId?: string;
}

export const useOrderRequest = () => {
  const [createState, setCreateState] = useState<UseRequestState<OrderResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Create new order
   */
  const createOrder = async (orderData: OrderData) => {
    setCreateState({ data: null, loading: true, error: null });
    
    try {
      const response = await requestService.post<OrderResponse>(
        API_ENDPOINTS.ORDERS.CREATE,
        orderData,
        { requireCsrf: true }
      );

      setCreateState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error: any) {
      setCreateState({ data: null, loading: false, error: error.message });
      throw error;
    }
  };

  return {
    // Order creation
    createOrder,
    createOrderLoading: createState.loading,
    createOrderError: createState.error,
    createOrderData: createState.data,
  };
};
