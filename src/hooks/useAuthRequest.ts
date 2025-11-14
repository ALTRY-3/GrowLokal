/**
 * Authentication Requests Hook
 * Handles all authentication-related API calls
 */

import { useState } from 'react';
import { requestService } from '@/services/RequestService';
import { API_ENDPOINTS } from '@/constants/api.constants';
import type { UseRequestState, ApiError } from '@/interfaces/common.interface';

interface LoginCredentials {
  email: string;
  password: string;
  recaptchaToken: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  recaptchaToken: string;
}

interface AuthResponse {
  message: string;
  user?: any;
  redirectUrl?: string;
}

export const useAuthRequest = () => {
  const [loginState, setLoginState] = useState<UseRequestState<AuthResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const [registerState, setRegisterState] = useState<UseRequestState<AuthResponse>>({
    data: null,
    loading: false,
    error: null,
  });

  const [logoutState, setLogoutState] = useState<UseRequestState<{ message: string }>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Login user
   */
  const login = async (credentials: LoginCredentials) => {
    setLoginState({ data: null, loading: true, error: null });
    
    try {
      const response = await requestService.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials,
        { requireCsrf: true }
      );

      setLoginState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      setLoginState({ data: null, loading: false, error: apiError.message });
      throw error;
    }
  };

  /**
   * Register new user
   */
  const register = async (data: RegisterData) => {
    setRegisterState({ data: null, loading: true, error: null });
    
    try {
      const response = await requestService.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        data,
        { requireCsrf: true }
      );

      setRegisterState({ data: response.data || null, loading: false, error: null });
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      setRegisterState({ data: null, loading: false, error: apiError.message });
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    setLogoutState({ data: null, loading: true, error: null });
    
    try {
      const response = await requestService.post<{ message: string }>(
        API_ENDPOINTS.AUTH.LOGOUT,
        {},
        { requireCsrf: true }
      );

      setLogoutState({ data: response.data || null, loading: false, error: null });
      
      // Clear CSRF token from localStorage
      localStorage.removeItem('csrf-token');
      
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      setLogoutState({ data: null, loading: false, error: apiError.message });
      throw error;
    }
  };

  /**
   * Request password reset
   */
  const forgotPassword = async (email: string) => {
    try {
      const response = await requestService.post<{ message: string }>(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        { email },
        { requireCsrf: true }
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Reset password with token
   */
  const resetPassword = async (token: string, password: string) => {
    try {
      const response = await requestService.post<{ message: string }>(
        API_ENDPOINTS.AUTH.RESET_PASSWORD,
        { token, password },
        { requireCsrf: true }
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Resend verification email
   */
  const resendVerification = async (email: string) => {
    try {
      const response = await requestService.post<{ message: string }>(
        API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
        { email },
        { requireCsrf: true }
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Verify email with token
   */
  const verifyEmail = async (token: string) => {
    try {
      const response = await requestService.get<{ message: string }>(
        `${API_ENDPOINTS.AUTH.VERIFY_EMAIL}?token=${token}`
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  return {
    // Login
    login,
    loginLoading: loginState.loading,
    loginError: loginState.error,
    loginData: loginState.data,
    
    // Register
    register,
    registerLoading: registerState.loading,
    registerError: registerState.error,
    registerData: registerState.data,
    
    // Logout
    logout,
    logoutLoading: logoutState.loading,
    logoutError: logoutState.error,
    
    // Password reset
    forgotPassword,
    resetPassword,
    
    // Email verification
    resendVerification,
    verifyEmail,
  };
};
