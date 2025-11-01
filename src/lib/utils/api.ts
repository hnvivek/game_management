import { toast } from "sonner";

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

export interface ApiError {
  error: string;
  details?: any;
  status?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      // Get auth token from cookie or localStorage
      const token = this.getAuthToken();

      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return { data, status: response.status };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 500,
      };
    }
  }

  private getAuthToken(): string | null {
    // Try to get token from cookie first (server-side compatible)
    if (typeof document === 'undefined') {
      // Server-side - you might need to pass the token from headers
      return null;
    }

    // Client-side - try cookie first, then localStorage
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));

    if (authCookie) {
      return authCookie.split('=')[1];
    }

    // Fallback to localStorage
    return localStorage.getItem('auth-token');
  }

  // HTTP Methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<T>(`${endpoint}${queryString}`);
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

// API wrapper functions with toast notifications
export const api = {
  // Get request with toast
  get: async <T>(endpoint: string, params?: Record<string, any>, options?: { showToast?: boolean }) => {
    const response = await apiClient.get<T>(endpoint, params);
    if (response.error && options?.showToast !== false) {
      toast.error(response.error);
    }
    return response;
  },

  // Post request with toast
  post: async <T>(endpoint: string, data?: any, options?: { showToast?: boolean, successMessage?: string }) => {
    const response = await apiClient.post<T>(endpoint, data);
    if (response.error && options?.showToast !== false) {
      toast.error(response.error);
    } else if (!response.error && options?.successMessage && options?.showToast !== false) {
      toast.success(options.successMessage);
    }
    return response;
  },

  // Put request with toast
  put: async <T>(endpoint: string, data?: any, options?: { showToast?: boolean, successMessage?: string }) => {
    const response = await apiClient.put<T>(endpoint, data);
    if (response.error && options?.showToast !== false) {
      toast.error(response.error);
    } else if (!response.error && options?.successMessage && options?.showToast !== false) {
      toast.success(options.successMessage);
    }
    return response;
  },

  // Patch request with toast
  patch: async <T>(endpoint: string, data?: any, options?: { showToast?: boolean, successMessage?: string }) => {
    const response = await apiClient.patch<T>(endpoint, data);
    if (response.error && options?.showToast !== false) {
      toast.error(response.error);
    } else if (!response.error && options?.successMessage && options?.showToast !== false) {
      toast.success(options.successMessage);
    }
    return response;
  },

  // Delete request with toast
  delete: async <T>(endpoint: string, options?: { showToast?: boolean, successMessage?: string }) => {
    const response = await apiClient.delete<T>(endpoint);
    if (response.error && options?.showToast !== false) {
      toast.error(response.error);
    } else if (!response.error && options?.successMessage && options?.showToast !== false) {
      toast.success(options.successMessage || "Deleted successfully");
    }
    return response;
  },
};

// Utility for handling API errors in forms
export const handleApiError = (error: any, setFieldError?: (field: string, message: string) => void) => {
  if (error?.details && typeof error.details === 'object' && setFieldError) {
    // Handle validation errors from Zod
    Object.entries(error.details).forEach(([field, message]) => {
      setFieldError(field, String(message));
    });
  } else {
    // Handle general errors
    toast.error(error?.error || 'An unexpected error occurred');
  }
};

// Utility for paginated requests
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const fetchPaginated = async <T>(
  endpoint: string,
  page: number = 1,
  limit: number = 10,
  filters?: Record<string, any>
): Promise<PaginatedResponse<T>> => {
  const params = {
    page: page.toString(),
    limit: limit.toString(),
    ...filters,
  };

  const response = await api.get<PaginatedResponse<T>>(endpoint, params);

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data!;
};

// File upload utility
export const uploadFile = async (file: File, endpoint: string = '/api/upload'): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = apiClient.getAuthToken();

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
};