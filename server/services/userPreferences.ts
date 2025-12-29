import { db } from '../db';
import { storage } from '../storage';
import { 
  userPreferences, 
  type UserPreferences as DbUserPreferences,
  type UserPreferencesData
} from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface UserPreferencesCache {
  data: UserPreferencesData;
  lastSynced: Date;
  isStale: boolean;
}

export class UserPreferencesService {
  private static cache = new Map<string, UserPreferencesCache>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get user preferences from database with caching
   */
  static async getUserPreferences(userId: string): Promise<UserPreferencesData> {
    // Check cache first
    const cached = this.cache.get(userId);
    if (cached && !cached.isStale) {
      return cached.data;
    }

    // For memory storage fallback, return default preferences
    if (!db) {
      console.log('Database unavailable, returning default preferences for user:', userId);
      return this.getDefaultPreferences(userId);
    }

    // Fetch from database
    const result = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    let preferences: UserPreferencesData;

    if (result.length > 0) {
      preferences = result[0].preferencesJson as UserPreferencesData;
    } else {
      // Create default preferences if none exist
      preferences = this.getDefaultPreferences(userId);
      await this.saveUserPreferences(userId, preferences);
    }

    // Update cache
    this.cache.set(userId, {
      data: preferences,
      lastSynced: new Date(),
      isStale: false,
    });

    return preferences;
  }

  /**
   * Save user preferences to database
   */
  static async saveUserPreferences(userId: string, preferences: UserPreferencesData): Promise<void> {
    // Validate preferences
    this.validatePreferences(preferences);

    // Update database
    const existing = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userPreferences)
        .set({
          preferencesJson: preferences,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, userId));
    } else {
      await db
        .insert(userPreferences)
        .values({
          userId,
          preferencesJson: preferences,
          lastSyncedAt: new Date(),
        });
    }

    // Update cache
    this.cache.set(userId, {
      data: preferences,
      lastSynced: new Date(),
      isStale: false,
    });
  }

  /**
   * Update a single preference field
   */
  static async updatePreferenceField(
    userId: string, 
    field: keyof UserPreferencesData, 
    value: any
  ): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    
    // Update the specific field
    (preferences as any)[field] = value;
    
    // Save updated preferences
    await this.saveUserPreferences(userId, preferences);
  }

  /**
   * Add vessel to favorites
   */
  static async addToFavorites(userId: string, vesselId: string): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    
    if (!preferences.favorites.includes(vesselId)) {
      preferences.favorites.push(vesselId);
      await this.saveUserPreferences(userId, preferences);
    }
  }

  /**
   * Remove vessel from favorites
   */
  static async removeFromFavorites(userId: string, vesselId: string): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    
    preferences.favorites = preferences.favorites.filter(id => id !== vesselId);
    await this.saveUserPreferences(userId, preferences);
  }

  /**
   * Add tag to vessel
   */
  static async addTag(userId: string, vesselId: string, tagName: string): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    
    if (!preferences.tags[vesselId]) {
      preferences.tags[vesselId] = [];
    }
    
    if (!preferences.tags[vesselId].includes(tagName)) {
      preferences.tags[vesselId].push(tagName);
      await this.saveUserPreferences(userId, preferences);
    }
  }

  /**
   * Remove tag from vessel
   */
  static async removeTag(userId: string, vesselId: string, tagName: string): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    
    if (preferences.tags[vesselId]) {
      preferences.tags[vesselId] = preferences.tags[vesselId].filter(tag => tag !== tagName);
      await this.saveUserPreferences(userId, preferences);
    }
  }

  /**
   * Set currency preference
   */
  static async setCurrency(userId: string, currency: 'EUR' | 'USD' | 'GBP'): Promise<void> {
    await this.updatePreferenceField(userId, 'currency', currency);
  }

  /**
   * Set language preference
   */
  static async setLanguage(userId: string, language: 'en' | 'es' | 'fr' | 'de'): Promise<void> {
    await this.updatePreferenceField(userId, 'language', language);
  }

  /**
   * Set timezone preference
   */
  static async setTimezone(userId: string, timezone: string): Promise<void> {
    await this.updatePreferenceField(userId, 'timezone', timezone);
  }

  /**
   * Set theme preference
   */
  static async setTheme(userId: string, theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.updatePreferenceField(userId, 'theme', theme);
  }

  /**
   * Set view mode preference
   */
  static async setViewMode(userId: string, viewMode: 'tiles' | 'list'): Promise<void> {
    await this.updatePreferenceField(userId, 'viewMode', viewMode);
  }

  /**
   * Add to search history
   */
  static async addToSearchHistory(userId: string, searchTerm: string): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    
    // Remove if already exists
    preferences.searchHistory = preferences.searchHistory.filter(term => term !== searchTerm);
    // Add to beginning
    preferences.searchHistory.unshift(searchTerm);
    // Keep only last 10 searches
    preferences.searchHistory = preferences.searchHistory.slice(0, 10);
    
    await this.saveUserPreferences(userId, preferences);
  }

  /**
   * Set filters
   */
  static async setFilters(userId: string, filters: Partial<UserPreferencesData['filters']>): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    preferences.filters = { ...preferences.filters, ...filters };
    await this.saveUserPreferences(userId, preferences);
  }

  /**
   * Set sort options
   */
  static async setSortOptions(
    userId: string, 
    sortBy: UserPreferencesData['sortBy'], 
    sortOrder: UserPreferencesData['sortOrder']
  ): Promise<void> {
    const preferences = await this.getUserPreferences(userId);
    preferences.sortBy = sortBy;
    preferences.sortOrder = sortOrder;
    await this.saveUserPreferences(userId, preferences);
  }

  /**
   * Migrate preferences from localStorage format
   */
  static async migrateFromLocalStorage(userId: string, localData: any): Promise<void> {
    try {
      const preferences: UserPreferencesData = {
        userId,
        favorites: localData.favorites || [],
        tags: localData.tags || {},
        viewMode: localData.viewMode || 'tiles',
        searchHistory: localData.searchHistory || [],
        currency: localData.currency || 'EUR',
        language: localData.language || 'en',
        timezone: localData.timezone || 'UTC',
        theme: localData.theme || 'system',
        filters: {
          vesselType: localData.filters?.vesselType || [],
          flag: localData.filters?.flag || [],
          complianceStatus: localData.filters?.complianceStatus || [],
          iceClass: localData.filters?.iceClass || [],
          engineType: localData.filters?.engineType || [],
        },
        sortBy: localData.sortBy || 'name',
        sortOrder: localData.sortOrder || 'asc',
      };

      await this.saveUserPreferences(userId, preferences);
    } catch (error) {
      console.error('Failed to migrate preferences from localStorage:', error);
      throw new Error('Invalid localStorage preferences format');
    }
  }

  /**
   * Reset preferences to defaults
   */
  static async resetPreferences(userId: string): Promise<void> {
    const defaultPreferences = this.getDefaultPreferences(userId);
    await this.saveUserPreferences(userId, defaultPreferences);
  }

  /**
   * Get default preferences for a user
   */
  private static getDefaultPreferences(userId: string): UserPreferencesData {
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
        engineType: [],
      },
      sortBy: 'name',
      sortOrder: 'asc',
    };
  }

  /**
   * Validate preferences data
   */
  private static validatePreferences(preferences: UserPreferencesData): void {
    if (!preferences.userId) {
      throw new Error('User ID is required');
    }

    if (!Array.isArray(preferences.favorites)) {
      throw new Error('Favorites must be an array');
    }

    if (typeof preferences.tags !== 'object' || preferences.tags === null) {
      throw new Error('Tags must be an object');
    }

    if (!['tiles', 'list'].includes(preferences.viewMode)) {
      throw new Error('View mode must be "tiles" or "list"');
    }

    if (!['EUR', 'USD', 'GBP'].includes(preferences.currency)) {
      throw new Error('Currency must be EUR, USD, or GBP');
    }

    if (!['en', 'es', 'fr', 'de'].includes(preferences.language)) {
      throw new Error('Language must be en, es, fr, or de');
    }

    if (!['light', 'dark', 'system'].includes(preferences.theme)) {
      throw new Error('Theme must be light, dark, or system');
    }

    if (!['name', 'imo', 'type', 'flag', 'compliance', 'ghgIntensity'].includes(preferences.sortBy)) {
      throw new Error('Invalid sort by field');
    }

    if (!['asc', 'desc'].includes(preferences.sortOrder)) {
      throw new Error('Sort order must be asc or desc');
    }
  }

  /**
   * Invalidate cache for a user
   */
  static invalidateCache(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Check if cache is stale
   */
  private static isCacheStale(cached: UserPreferencesCache): boolean {
    return Date.now() - cached.lastSynced.getTime() > this.CACHE_TTL;
  }

  /**
   * Get all users with preferences (for admin purposes)
   */
  static async getAllUserPreferences(): Promise<DbUserPreferences[]> {
    return await db.select().from(userPreferences);
  }

  /**
   * Delete user preferences (when user is deleted)
   */
  static async deleteUserPreferences(userId: string): Promise<void> {
    await db
      .delete(userPreferences)
      .where(eq(userPreferences.userId, userId));
    
    // Remove from cache
    this.cache.delete(userId);
  }
}
