import { authClient } from './auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const session = await authClient.getSession();

    if (session?.data?.session?.token) {
      return {
        Authorization: `Bearer ${session.data.session.token}`,
        'Content-Type': 'application/json',
      };
    }

    return {
      'Content-Type': 'application/json',
    };
  }

  async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { requireAuth = true, headers = {}, ...restOptions } = options;

    const authHeaders = requireAuth ? await this.getAuthHeaders() : {};

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...restOptions,
      headers: {
        ...authHeaders,
        ...headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || 'API Error');
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: FetchOptions,
  ): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: FetchOptions,
  ): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: FetchOptions,
  ): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient(API_URL);
