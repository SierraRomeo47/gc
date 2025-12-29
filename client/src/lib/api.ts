/**
 * API client for GHGConnect backend
 * Provides type-safe methods to fetch data from the backend
 * Now uses shared types and view models from @shared
 */

import type {
  UserViewModel,
  VesselViewModel,
  FleetViewModel,
  PortViewModel,
  FuelViewModel,
  UserAccessInfo,
  ImportedFile,
  CalculationFormula,
  ApiSuccessResponse,
  ApiErrorResponse,
} from "@shared/viewModels";

const API_BASE = 'http://localhost:5000';  // Hybrid setup - frontend and backend on same port

/**
 * Delay utility for exponential backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * User-friendly error messages based on status codes
 */
function getErrorMessage(status: number, defaultMessage: string): string {
  const messages: Record<number, string> = {
    400: 'Bad request. Please check your input.',
    401: 'You are not authorized. Please log in.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    408: 'Request timeout. Please try again.',
    429: 'Too many requests. Please wait and try again.',
    500: 'Server error. Please try again later.',
    502: 'Bad gateway. The server is temporarily unavailable.',
    503: 'Service unavailable. Please try again later.',
    504: 'Gateway timeout. Please try again.',
  };
  
  return messages[status] || defaultMessage;
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, status?: number): boolean {
  // Network errors are retryable
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  // Specific status codes are retryable
  if (status) {
    return [408, 429, 500, 502, 503, 504].includes(status);
  }
  
  return false;
}

/**
 * Generic fetch wrapper with error handling and retry logic
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit,
  retries = 3
): Promise<T> {
  let lastError: Error | null = null;
  const timeout = 30000; // 30 second timeout

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        // Check if we should retry
        if (isRetryableError(null, response.status) && attempt < retries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const backoffDelay = Math.pow(2, attempt) * 1000;
          console.warn(
            `Retrying ${endpoint} after ${backoffDelay}ms (attempt ${attempt + 1}/${retries})`
          );
          await delay(backoffDelay);
          continue;
        }

        // Throw user-friendly error
        const message = getErrorMessage(
          response.status,
          errorData.error || errorData.message || errorText
        );
        throw new Error(message);
      }

      const jsonResponse = await response.json();
      
      // Handle standardized API response format
      if (jsonResponse.success === false) {
        throw new Error(jsonResponse.error || 'API request failed');
      }
      
      // If response has data property (standardized format), return data
      if (jsonResponse.success === true && 'data' in jsonResponse) {
        return jsonResponse.data as T;
      }
      
      // Otherwise return the whole response (legacy format)
      return jsonResponse as T;
    } catch (error: any) {
      lastError = error;

      // Handle timeout
      if (error.name === 'AbortError') {
        if (attempt < retries - 1) {
          await delay(Math.pow(2, attempt) * 1000);
          continue;
        }
        throw new Error('Request timeout. Please check your connection and try again.');
      }

      // Handle network errors
      if (isRetryableError(error) && attempt < retries - 1) {
        const backoffDelay = Math.pow(2, attempt) * 1000;
        console.warn(
          `Network error, retrying ${endpoint} after ${backoffDelay}ms (attempt ${attempt + 1}/${retries})`
        );
        await delay(backoffDelay);
        continue;
      }

      // If not retryable or last attempt, throw
      if (attempt === retries - 1) {
        console.error(`Failed to fetch ${endpoint} after ${retries} attempts:`, error);
        throw new Error(
          error.message || 'Network error. Please check your connection and try again.'
        );
      }
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error('Unknown error occurred');
}

/**
 * Vessels API
 */
export const vesselsAPI = {
  /**
   * Get all vessels from database (falls back to demo if DB unavailable)
   */
  getAll: () => fetchAPI<VesselViewModel[]>('/api/vessels/all'),
  
  /**
   * Get demo vessels for development (26 vessels with synthetic data)
   */
  getDemo: () => fetchAPI<VesselViewModel[]>('/api/vessels/demo'),
  
  /**
   * Create a new vessel
   */
  create: (vessel: Partial<VesselViewModel>) => fetchAPI<VesselViewModel>('/api/vessels', {
    method: 'POST',
    body: JSON.stringify(vessel),
  }),
  
  /**
   * Update an existing vessel
   */
  update: (id: string, vessel: Partial<VesselViewModel>) => fetchAPI<VesselViewModel>(`/api/vessels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vessel),
  }),
  
  /**
   * Delete a vessel
   */
  delete: (id: string) => fetchAPI<void>(`/api/vessels/${id}`, {
    method: 'DELETE',
  }),
};

/**
 * Users API
 */
export const usersAPI = {
  /**
   * Get all users
   */
  getAll: () => fetchAPI<UserViewModel[]>('/api/users'),
  
  /**
   * Create a new user
   */
  create: (user: Partial<UserViewModel>) => fetchAPI<UserViewModel>('/api/users', {
    method: 'POST',
    body: JSON.stringify(user),
  }),
  
  /**
   * Update an existing user
   */
  update: (id: string, user: Partial<UserViewModel>) => fetchAPI<UserViewModel>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  }),
  
  /**
   * Delete a user
   */
  delete: async (id: string) => {
    console.log('Attempting to delete user with ID:', id);
    await fetchAPI<{ success: boolean, id: string }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get accessible fleets for a user
   */
  getFleets: (userId: string) => fetchAPI<FleetViewModel[]>(`/api/users/${userId}/fleets`),

  /**
   * Grant fleet access to a user
   */
  grantFleetAccess: (userId: string, fleetId: string, expiresAt?: string) => 
    fetchAPI<any>(`/api/users/${userId}/fleets/${fleetId}`, {
      method: 'POST',
      body: JSON.stringify({ expiresAt }),
    }),

  /**
   * Revoke fleet access from a user
   */
  revokeFleetAccess: (userId: string, fleetId: string) => 
    fetchAPI<{ success: boolean }>(`/api/users/${userId}/fleets/${fleetId}`, {
      method: 'DELETE',
    }),

  /**
   * Get accessible vessels for a user
   */
  getVessels: (userId: string) => fetchAPI<VesselViewModel[]>(`/api/users/${userId}/vessels`),

  /**
   * Grant vessel access to a user
   */
  grantVesselAccess: (userId: string, vesselId: string, expiresAt?: string) => 
    fetchAPI<any>(`/api/users/${userId}/vessels/${vesselId}`, {
      method: 'POST',
      body: JSON.stringify({ expiresAt }),
    }),

  /**
   * Revoke vessel access from a user
   */
  revokeVesselAccess: (userId: string, vesselId: string) => 
    fetchAPI<{ success: boolean }>(`/api/users/${userId}/vessels/${vesselId}`, {
      method: 'DELETE',
    }),

  /**
   * Get comprehensive access information for a user
   */
  getAccessInfo: (userId: string) => fetchAPI<UserAccessInfo>(`/api/users/${userId}/access`),
};

/**
 * Fleets API
 */
export const fleetsAPI = {
  /**
   * Get all fleets
   */
  getAll: () => fetchAPI<FleetViewModel[]>('/api/fleets'),
  
  /**
   * Get demo fleets
   */
  getDemo: () => fetchAPI<FleetViewModel[]>('/api/fleets/demo'),
  
  /**
   * Create a new fleet
   */
  create: (fleet: Partial<FleetViewModel>) => fetchAPI<FleetViewModel>('/api/fleets', {
    method: 'POST',
    body: JSON.stringify(fleet),
  }),
  
  /**
   * Update an existing fleet
   */
  update: (id: string, fleet: Partial<FleetViewModel>) => fetchAPI<FleetViewModel>(`/api/fleets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fleet),
  }),
  
  /**
   * Delete a fleet
   */
  delete: (id: string) => fetchAPI<void>(`/api/fleets/${id}`, {
    method: 'DELETE',
  }),
};

/**
 * Ports API
 */
export const portsAPI = {
  /**
   * Get all ports
   */
  getAll: () => fetchAPI<PortViewModel[]>('/api/ports'),
  
  /**
   * Get a specific port by ID
   */
  getById: (id: string) => fetchAPI<PortViewModel>(`/api/ports/${id}`),
};

/**
 * Fuels API
 */
export const fuelsAPI = {
  /**
   * Get all fuel types
   */
  getAll: () => fetchAPI<FuelViewModel[]>('/api/fuels'),
  
  /**
   * Get a specific fuel by ID
   */
  getById: (id: string) => fetchAPI<FuelViewModel>(`/api/fuels/${id}`),
};

/**
 * Data Import API
 */
export const dataImportAPI = {
  /**
   * Get all imported files
   */
  getFiles: () => fetchAPI<ImportedFile[]>('/api/data-imports'),
  
  /**
   * Upload a file
   */
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/api/data-imports/upload`, {
      method: 'POST',
      body: formData, // Don't set Content-Type header, let browser set it with boundary
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  },
  
  /**
   * Get calculation formulas
   */
  getFormulas: () => fetchAPI<CalculationFormula[]>('/api/calculation-formulas'),
  
  /**
   * Update a calculation formula
   */
  updateFormula: (id: string, formula: Partial<CalculationFormula>) =>
    fetchAPI<CalculationFormula>(`/api/calculation-formulas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formula),
    }),
  
  /**
   * Export data
   */
  exportData: async (format: 'csv' | 'xlsx' | 'sql', dataType: string) => {
    const response = await fetch(
      `${API_BASE}/api/data-exports/${format}?type=${dataType}`,
      {
        method: 'GET',
      }
    );
    
    if (!response.ok) {
      throw new Error(`Export failed (${response.status})`);
    }
    
    return await response.blob();
  },
};

/**
 * Health API
 */
export const healthAPI = {
  /**
   * Check overall system health
   */
  check: () => fetchAPI<{
    status: string;
    timestamp: string;
    uptime: number;
    database: {
      healthy: boolean;
      details: {
        connected: boolean;
        totalConnections?: number;
        idleConnections?: number;
        waitingClients?: number;
        error?: string;
      };
    };
    memory: {
      used: number;
      total: number;
      unit: string;
    };
    environment: string;
    mode: string;
  }>('/api/health'),
  
  /**
   * Check database health specifically
   */
  checkDatabase: () => fetchAPI('/api/health/db'),
};

/**
 * Public Stats API (no auth required)
 */
export const statsAPI = {
  /**
   * Get public statistics
   */
  getPublic: () => fetchAPI<{
    portsCount: number;
    fuelsCount: number;
    status: string;
  }>('/api/public/stats'),
};

// Export all APIs as a single object
export const api = {
  vessels: vesselsAPI,
  users: usersAPI,
  fleets: fleetsAPI,
  ports: portsAPI,
  fuels: fuelsAPI,
  dataImport: dataImportAPI,
  health: healthAPI,
  stats: statsAPI,
};

export default api;

// Export fetchAPI function
export { fetchAPI };

// Re-export types for convenience
export type {
  UserViewModel as User,
  VesselViewModel as Vessel,
  FleetViewModel as Fleet,
  PortViewModel as Port,
  FuelViewModel as Fuel,
  UserAccessInfo,
  ImportedFile,
  CalculationFormula,
};
