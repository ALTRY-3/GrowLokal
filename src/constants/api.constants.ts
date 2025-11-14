/**
 * API Endpoints Constants
 * Centralized location for all API endpoints
 */

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    CSRF_TOKEN: '/api/auth/csrf-token',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    RESEND_VERIFICATION: '/api/auth/resend-verification',
    VERIFY_EMAIL: '/api/verify-email',
  },

  // User endpoints
  USER: {
    PROFILE: '/api/user/profile',
    ORDERS: '/api/user/orders',
    ORDER_DETAIL: (orderId: string) => `/api/user/orders/${orderId}`,
    CONFIRM_ORDER: (orderId: string) => `/api/user/orders/${orderId}/confirm`,
    RATE_ORDER: (orderId: string) => `/api/user/orders/${orderId}/rate`,
  },

  // Product endpoints
  PRODUCTS: {
    LIST: '/api/products',
    DETAIL: (id: string) => `/api/products/${id}`,
    BY_CATEGORY: (category: string, limit?: number) =>
      `/api/products?category=${category}${limit ? `&limit=${limit}` : ''}`,
    SEARCH: '/api/products/search',
  },

  // Cart endpoints
  CART: {
    GET: '/api/cart',
    ADD: '/api/cart',
    UPDATE: '/api/cart',
    REMOVE: (productId: string) => `/api/cart/remove/${productId}`,
    CLEAR: '/api/cart',
    MERGE: '/api/cart/merge',
  },

  // Wishlist endpoints
  WISHLIST: {
    GET: '/api/wishlist',
    ADD: '/api/wishlist',
    REMOVE: (productId: string) => `/api/wishlist?productId=${productId}`,
  },

  // Order endpoints
  ORDERS: {
    CREATE: '/api/orders',
    LIST: '/api/orders',
    DETAIL: (id: string) => `/api/orders/${id}`,
  },

  // Seller endpoints
  SELLER: {
    PROFILE: '/api/seller/profile',
    APPLY: '/api/seller/apply',
    STATUS: '/api/seller/status',
    PRODUCTS: '/api/seller/products',
    RESET: '/api/seller/reset',
  },

  // Payment endpoints
  PAYMENT: {
    CREATE_INTENT: '/api/payment/create-intent',
    CONFIRM: '/api/payment/confirm',
  },

  // Upload endpoint
  UPLOAD: '/api/upload',

  // Chatbot endpoint
  CHATBOT: '/api/chatbot',
} as const;

export default API_ENDPOINTS;
