/**
 * Common API Response Interfaces
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  errors?: string[];
}

/**
 * Request Configuration
 */
export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean>;
  requireAuth?: boolean;
  requireCsrf?: boolean;
}

/**
 * Hook State Interface
 */
export interface UseRequestState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
