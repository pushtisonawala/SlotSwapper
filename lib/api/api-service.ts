// API configuration and base service
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://slotswapper-1-izr3.onrender.com/api'

export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}

export interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  created_at: string
}

export interface Event {
  id: number
  title: string
  description?: string
  start_time: string
  end_time: string
  status: 'BUSY' | 'SWAPPABLE' | 'SWAP_PENDING'
  owner: number
  owner_email: string
  owner_name: string
  duration_minutes: number
  is_past: boolean
  created_at: string
  updated_at: string
}

export interface SwapRequest {
  id: number
  requester: number
  receiver: number
  requester_email: string
  requester_name: string
  receiver_email: string
  receiver_name: string
  requester_event: number
  receiver_event: number
  requester_event_details: Event
  receiver_event_details: Event
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
  message?: string
  created_at: string
  updated_at: string
  responded_at?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface AuthResponse {
  message: string
  user: User
  tokens: AuthTokens
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
  username: string
}

export interface CreateEventRequest {
  title: string
  description?: string
  start_time: string
  end_time: string
  status?: 'BUSY' | 'SWAPPABLE'
}

export interface CreateSwapRequestRequest {
  my_slot_id: number
  their_slot_id: number
  message?: string
}

export interface SwapResponseRequest {
  accept: boolean
}

class ApiService {
  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (includeAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }
    
    return headers
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(!endpoint.includes('/auth/')),
          ...options.headers,
        },
      })

      const data = await response.json()
      
      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : this.extractErrorMessage(data),
        status: response.status,
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      }
    }
  }

  private extractErrorMessage(data: any): string {
    if (typeof data === 'string') return data
    if (data?.message) return data.message
    if (data?.error) return data.error
    if (data?.detail) return data.detail
    if (Array.isArray(data)) return data.join(', ')
    if (typeof data === 'object') {
      // Handle validation errors
      const errors = Object.values(data).flat()
      if (errors.length > 0) return errors.join(', ')
    }
    return 'An error occurred'
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest('/health/')
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: this.getHeaders(false),
    })
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.makeRequest('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: this.getHeaders(false),
    })
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.makeRequest('/auth/profile/')
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.makeRequest('/auth/profile/', {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  // Events
  async getEvents(): Promise<ApiResponse<Event[]>> {
    return this.makeRequest('/events/')
  }

  async createEvent(eventData: CreateEventRequest): Promise<ApiResponse<Event>> {
    return this.makeRequest('/events/', {
      method: 'POST',
      body: JSON.stringify(eventData),
    })
  }

  async updateEvent(id: number, eventData: Partial<CreateEventRequest>): Promise<ApiResponse<Event>> {
    return this.makeRequest(`/events/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(eventData),
    })
  }

  async deleteEvent(id: number): Promise<ApiResponse<void>> {
    return this.makeRequest(`/events/${id}/`, {
      method: 'DELETE',
    })
  }

  async getSwappableSlots(page = 1, limit = 50): Promise<ApiResponse<Event[]>> {
    return this.makeRequest(`/swappable-slots/?page=${page}&limit=${limit}`)
  }

  // Swap Requests
  async createSwapRequest(requestData: CreateSwapRequestRequest): Promise<ApiResponse<{ message: string; swap_request: SwapRequest }>> {
    return this.makeRequest('/swap-request/', {
      method: 'POST',
      body: JSON.stringify(requestData),
    })
  }

  async respondToSwapRequest(requestId: number, response: SwapResponseRequest): Promise<ApiResponse<{ message: string; swap_request: SwapRequest }>> {
    return this.makeRequest(`/swap-response/${requestId}/`, {
      method: 'POST',
      body: JSON.stringify(response),
    })
  }

  async getIncomingSwapRequests(): Promise<ApiResponse<SwapRequest[]>> {
    return this.makeRequest('/swap-requests/incoming/')
  }

  async getOutgoingSwapRequests(): Promise<ApiResponse<SwapRequest[]>> {
    return this.makeRequest('/swap-requests/outgoing/')
  }

  async cancelSwapRequest(requestId: number): Promise<ApiResponse<{ message: string; swap_request: SwapRequest }>> {
    return this.makeRequest(`/swap-requests/${requestId}/cancel/`, {
      method: 'POST',
    })
  }
}

export const apiService = new ApiService()