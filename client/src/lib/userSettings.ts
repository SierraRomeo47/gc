// User Settings Service for Vessel Management with Backend Integration
export interface UserVesselSettings {
  userId: string;
  favorites: string[]; // Array of vessel IDs
  tags: Record<string, string[]>; // vesselId -> array of tag names
  viewMode: 'tiles' | 'list';
  searchHistory: string[];
  currency: 'EUR' | 'USD' | 'GBP'; // Currency preference
  language: 'en' | 'es' | 'fr' | 'de'; // Language preference
  timezone: string; // Timezone preference
  theme: 'light' | 'dark' | 'system'; // Theme preference
  filters: {
    vesselType: string[];
    flag: string[];
    complianceStatus: string[];
    iceClass: string[];
    engineType: string[];
  };
  sortBy: 'name' | 'imo' | 'type' | 'flag' | 'compliance' | 'ghgIntensity';
  sortOrder: 'asc' | 'desc';
}

export class UserSettingsService {
  private static readonly STORAGE_KEY = 'ghgconnect_vessel_settings';
  private static readonly SYNC_QUEUE_KEY = 'ghgconnect_sync_queue';
  private static readonly LAST_SYNC_KEY = 'ghgconnect_last_sync';
  
  // Get user settings from backend with localStorage cache
  static async getUserSettings(userId: string): Promise<UserVesselSettings> {
    try {
      // Try to fetch from backend first
      const response = await fetch(`/api/user-preferences/${userId}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const preferences = await response.json();
        
        // Update cache and sync timestamp
        localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(preferences));
        localStorage.setItem(`${this.LAST_SYNC_KEY}_${userId}`, new Date().toISOString());
        
        return preferences;
      }
    } catch (error) {
      console.warn('Failed to fetch user preferences from backend, using cache:', error);
    }
    
    // Fallback to localStorage cache
    const stored = localStorage.getItem(`${this.STORAGE_KEY}_${userId}`);
    if (stored) {
      try {
        const cached = JSON.parse(stored);
        // Mark as stale for next sync attempt
        this.markAsStale(userId);
        return cached;
      } catch (error) {
        console.warn('Failed to parse cached preferences:', error);
      }
    }
    
    // Return default settings
    return this.getDefaultSettings(userId);
  }
  
  // Save user settings to backend with localStorage cache
  static async saveUserSettings(settings: UserVesselSettings): Promise<void> {
    try {
      const response = await fetch(`/api/user-preferences/${settings.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        // Update cache and sync timestamp
        localStorage.setItem(`${this.STORAGE_KEY}_${settings.userId}`, JSON.stringify(settings));
        localStorage.setItem(`${this.LAST_SYNC_KEY}_${settings.userId}`, new Date().toISOString());
        return;
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to save user preferences to backend, queuing for sync:', error);
      
      // Queue for offline sync
      this.queueForSync(settings);
      
      // Save to localStorage as backup
      localStorage.setItem(`${this.STORAGE_KEY}_${settings.userId}`, JSON.stringify(settings));
    }
  }
  
  // Add vessel to favorites
  static async addToFavorites(userId: string, vesselId: string): Promise<void> {
    try {
      const response = await fetch(`/api/user-preferences/${userId}/favorites`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ vesselId, action: 'add' }),
      });
      
      if (response.ok) {
        // Update cache
        const settings = await this.getUserSettings(userId);
        if (!settings.favorites.includes(vesselId)) {
          settings.favorites.push(vesselId);
          localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(settings));
        }
        return;
      }
    } catch (error) {
      console.warn('Failed to add favorite to backend, using cache:', error);
    }
    
    // Fallback to cache update
    const settings = await this.getUserSettings(userId);
    if (!settings.favorites.includes(vesselId)) {
      settings.favorites.push(vesselId);
      await this.saveUserSettings(settings);
    }
  }
  
  // Remove vessel from favorites
  static async removeFromFavorites(userId: string, vesselId: string): Promise<void> {
    try {
      const response = await fetch(`/api/user-preferences/${userId}/favorites`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ vesselId, action: 'remove' }),
      });
      
      if (response.ok) {
        // Update cache
        const settings = await this.getUserSettings(userId);
        settings.favorites = settings.favorites.filter(id => id !== vesselId);
        localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(settings));
        return;
      }
    } catch (error) {
      console.warn('Failed to remove favorite from backend, using cache:', error);
    }
    
    // Fallback to cache update
    const settings = await this.getUserSettings(userId);
    settings.favorites = settings.favorites.filter(id => id !== vesselId);
    await this.saveUserSettings(settings);
  }
  
  // Toggle favorite status
  static async toggleFavorite(userId: string, vesselId: string): Promise<boolean> {
    const settings = await this.getUserSettings(userId);
    const isFavorite = settings.favorites.includes(vesselId);
    
    if (isFavorite) {
      await this.removeFromFavorites(userId, vesselId);
    } else {
      await this.addToFavorites(userId, vesselId);
    }
    
    return !isFavorite;
  }
  
  // Add tag to vessel
  static async addTag(userId: string, vesselId: string, tagName: string): Promise<void> {
    try {
      const response = await fetch(`/api/user-preferences/${userId}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ vesselId, tagName, action: 'add' }),
      });
      
      if (response.ok) {
        // Update cache
        const settings = await this.getUserSettings(userId);
        if (!settings.tags[vesselId]) {
          settings.tags[vesselId] = [];
        }
        if (!settings.tags[vesselId].includes(tagName)) {
          settings.tags[vesselId].push(tagName);
          localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(settings));
        }
        return;
      }
    } catch (error) {
      console.warn('Failed to add tag to backend, using cache:', error);
    }
    
    // Fallback to cache update
    const settings = await this.getUserSettings(userId);
    if (!settings.tags[vesselId]) {
      settings.tags[vesselId] = [];
    }
    if (!settings.tags[vesselId].includes(tagName)) {
      settings.tags[vesselId].push(tagName);
      await this.saveUserSettings(settings);
    }
  }
  
  // Remove tag from vessel
  static async removeTag(userId: string, vesselId: string, tagName: string): Promise<void> {
    try {
      const response = await fetch(`/api/user-preferences/${userId}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ vesselId, tagName, action: 'remove' }),
      });
      
      if (response.ok) {
        // Update cache
        const settings = await this.getUserSettings(userId);
        if (settings.tags[vesselId]) {
          settings.tags[vesselId] = settings.tags[vesselId].filter(tag => tag !== tagName);
          localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(settings));
        }
        return;
      }
    } catch (error) {
      console.warn('Failed to remove tag from backend, using cache:', error);
    }
    
    // Fallback to cache update
    const settings = await this.getUserSettings(userId);
    if (settings.tags[vesselId]) {
      settings.tags[vesselId] = settings.tags[vesselId].filter(tag => tag !== tagName);
      await this.saveUserSettings(settings);
    }
  }
  
  // Get vessel tags
  static async getVesselTags(userId: string, vesselId: string): Promise<string[]> {
    const settings = await this.getUserSettings(userId);
    return settings.tags[vesselId] || [];
  }
  
  // Set view mode
  static async setViewMode(userId: string, mode: 'tiles' | 'list'): Promise<void> {
    const settings = await this.getUserSettings(userId);
    settings.viewMode = mode;
    await this.saveUserSettings(settings);
  }
  
  // Add to search history
  static async addToSearchHistory(userId: string, searchTerm: string): Promise<void> {
    const settings = await this.getUserSettings(userId);
    // Remove if already exists
    settings.searchHistory = settings.searchHistory.filter(term => term !== searchTerm);
    // Add to beginning
    settings.searchHistory.unshift(searchTerm);
    // Keep only last 10 searches
    settings.searchHistory = settings.searchHistory.slice(0, 10);
    await this.saveUserSettings(settings);
  }
  
  // Set filters
  static async setFilters(userId: string, filters: Partial<UserVesselSettings['filters']>): Promise<void> {
    const settings = await this.getUserSettings(userId);
    settings.filters = { ...settings.filters, ...filters };
    await this.saveUserSettings(settings);
  }
  
  // Set sort options
  static async setSortOptions(userId: string, sortBy: UserVesselSettings['sortBy'], sortOrder: UserVesselSettings['sortOrder']): Promise<void> {
    const settings = await this.getUserSettings(userId);
    settings.sortBy = sortBy;
    settings.sortOrder = sortOrder;
    await this.saveUserSettings(settings);
  }

  // Set currency preference
  static async setCurrency(userId: string, currency: 'EUR' | 'USD' | 'GBP'): Promise<void> {
    try {
      const response = await fetch(`/api/user-preferences/${userId}/currency`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ currency }),
      });
      
      if (response.ok) {
        // Update cache
        const settings = await this.getUserSettings(userId);
        settings.currency = currency;
        localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(settings));
        return;
      }
    } catch (error) {
      console.warn('Failed to update currency on backend, using cache:', error);
    }
    
    // Fallback to cache update
    const settings = await this.getUserSettings(userId);
    settings.currency = currency;
    await this.saveUserSettings(settings);
  }

  // Set language preference
  static async setLanguage(userId: string, language: 'en' | 'es' | 'fr' | 'de'): Promise<void> {
    try {
      const response = await fetch(`/api/user-preferences/${userId}/language`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ language }),
      });
      
      if (response.ok) {
        // Update cache
        const settings = await this.getUserSettings(userId);
        settings.language = language;
        localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(settings));
        return;
      }
    } catch (error) {
      console.warn('Failed to update language on backend, using cache:', error);
    }
    
    // Fallback to cache update
    const settings = await this.getUserSettings(userId);
    settings.language = language;
    await this.saveUserSettings(settings);
  }

  // Set timezone preference
  static async setTimezone(userId: string, timezone: string): Promise<void> {
    try {
      const response = await fetch(`/api/user-preferences/${userId}/timezone`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ timezone }),
      });
      
      if (response.ok) {
        // Update cache
        const settings = await this.getUserSettings(userId);
        settings.timezone = timezone;
        localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(settings));
        return;
      }
    } catch (error) {
      console.warn('Failed to update timezone on backend, using cache:', error);
    }
    
    // Fallback to cache update
    const settings = await this.getUserSettings(userId);
    settings.timezone = timezone;
    await this.saveUserSettings(settings);
  }

  // Set theme preference
  static async setTheme(userId: string, theme: 'light' | 'dark' | 'system'): Promise<void> {
    try {
      const response = await fetch(`/api/user-preferences/${userId}/theme`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ theme }),
      });
      
      if (response.ok) {
        // Update cache
        const settings = await this.getUserSettings(userId);
        settings.theme = theme;
        localStorage.setItem(`${this.STORAGE_KEY}_${userId}`, JSON.stringify(settings));
        return;
      }
    } catch (error) {
      console.warn('Failed to update theme on backend, using cache:', error);
    }
    
    // Fallback to cache update
    const settings = await this.getUserSettings(userId);
    settings.theme = theme;
    await this.saveUserSettings(settings);
  }
  
  // Reset all settings
  static async resetSettings(userId: string): Promise<void> {
    const defaultSettings = this.getDefaultSettings(userId);
    await this.saveUserSettings(defaultSettings);
  }
  
  // Get all unique tags across all vessels
  static async getAllTags(userId: string): Promise<string[]> {
    const settings = await this.getUserSettings(userId);
    const allTags = new Set<string>();
    Object.values(settings.tags).forEach(vesselTags => {
      vesselTags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }

  // Get default settings
  private static getDefaultSettings(userId: string): UserVesselSettings {
    return {
      userId,
      favorites: [],
      tags: {},
      viewMode: 'tiles',
      searchHistory: [],
      currency: 'EUR',
      language: 'en',
      timezone: 'UTC',
      theme: 'system',
      filters: {
        vesselType: [],
        flag: [],
        complianceStatus: [],
        iceClass: [],
        engineType: []
      },
      sortBy: 'name',
      sortOrder: 'asc'
    };
  }

  // Mark settings as stale for next sync attempt
  private static markAsStale(userId: string): void {
    localStorage.setItem(`${this.LAST_SYNC_KEY}_${userId}`, '0');
  }

  // Queue settings for offline sync
  private static queueForSync(settings: UserVesselSettings): void {
    try {
      const queue = JSON.parse(localStorage.getItem(this.SYNC_QUEUE_KEY) || '[]');
      queue.push({
        userId: settings.userId,
        settings,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.warn('Failed to queue settings for sync:', error);
    }
  }

  // Process sync queue when back online
  static async processSyncQueue(): Promise<void> {
    try {
      const queue = JSON.parse(localStorage.getItem(this.SYNC_QUEUE_KEY) || '[]');
      if (queue.length === 0) return;

      console.log(`Processing ${queue.length} queued settings updates...`);

      for (const item of queue) {
        try {
          await this.saveUserSettings(item.settings);
        } catch (error) {
          console.warn(`Failed to sync settings for user ${item.userId}:`, error);
        }
      }

      // Clear the queue after processing
      localStorage.removeItem(this.SYNC_QUEUE_KEY);
      console.log('Sync queue processed successfully');
    } catch (error) {
      console.warn('Failed to process sync queue:', error);
    }
  }

  // Check if settings are stale and need sync
  static isStale(userId: string): boolean {
    const lastSync = localStorage.getItem(`${this.LAST_SYNC_KEY}_${userId}`);
    if (!lastSync || lastSync === '0') return true;
    
    const lastSyncTime = new Date(lastSync).getTime();
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    
    return (now - lastSyncTime) > staleThreshold;
  }

  // Auto-sync if stale
  static async autoSyncIfStale(userId: string): Promise<void> {
    if (this.isStale(userId)) {
      try {
        await this.getUserSettings(userId);
        console.log('Auto-sync completed for user:', userId);
      } catch (error) {
        console.warn('Auto-sync failed for user:', userId, error);
      }
    }
  }
}
