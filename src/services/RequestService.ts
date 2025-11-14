/**
 * Request Service
 * Centralized HTTP client for all API requests
 */

import type { RequestConfig, ApiResponse, ApiError } from '@/interfaces/common.interface';

class RequestService {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Build full URL with query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseURL || window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Prepare request headers
   */
  private async prepareHeaders(config?: RequestConfig): Promise<HeadersInit> {
    const headers = { ...this.defaultHeaders };

    // Add custom headers from config
    if (config?.headers) {
      Object.assign(headers, config.headers);
    }

    // Add CSRF token if required
    if (config?.requireCsrf) {
      try {
        const csrfToken = await this.getCsrfToken();
        if (csrfToken) {
          Object.assign(headers, { 'X-CSRF-Token': csrfToken });
        }
      } catch (error) {
        console.warn('Failed to get CSRF token:', error);
      }
    }

    return headers;
  }

  /**
   * Get CSRF token from cookie or API
   */
  private async getCsrfToken(): Promise<string | null> {
    // Try to get from localStorage first (cached)
    const cached = localStorage.getItem('csrf-token');
    if (cached) return cached;

    // Fetch from API
    try {
      const response = await fetch('/api/auth/csrf-token', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.csrfToken) {
        localStorage.setItem('csrf-token', data.csrfToken);
        return data.csrfToken;
      }
    } catch (error) {
      console.error('CSRF token fetch failed:', error);
    }
    
    return null;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      const errorData = isJson ? await response.json() : { message: response.statusText };
      
      const error: ApiError = {
        message: errorData.message || errorData.error || 'Request failed',
        status: response.status,
        statusText: response.statusText,
        errors: errorData.errors,
      };

      // Handle specific error codes
      if (response.status === 401) {
        // Unauthorized - could trigger logout
        if (typeof window !== 'undefined') {
          console.warn('Unauthorized request, consider redirecting to login');
        }
      }

      throw error;
    }

    if (isJson) {
      const data = await response.json();
      return data;
    }

    // Non-JSON response (e.g., text, blob)
    return {
      success: true,
      data: await response.text() as any,
    };
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.buildURL(endpoint, config?.params);
      const headers = await this.prepareHeaders(config);

      const response = await fetch(url, {
        ...config,
        headers,
        credentials: 'include', // Include cookies for session
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      // Re-throw ApiError
      if (error.status) {
        throw error;
      }

      // Network or other errors
      const apiError: ApiError = {
        message: error.message || 'Network error occurred',
        status: 0,
      };
      throw apiError;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    });
  }

  /**
   * Upload file (FormData)
   */
  async upload<T>(
    endpoint: string,
    formData: FormData,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const headers = await this.prepareHeaders(config);
    
    // Remove Content-Type for FormData (browser will set it with boundary)
    const uploadHeaders = { ...headers };
    delete (uploadHeaders as any)['Content-Type'];

    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      headers: uploadHeaders,
      body: formData,
    });
  }
}

// Export singleton instance
export const requestService = new RequestService();
export default requestService;
