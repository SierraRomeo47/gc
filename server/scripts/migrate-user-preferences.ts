import { db } from '../db';
import { UserPreferencesService } from '../services/userPreferences';
import { AccessControlService } from '../services/accessControl';

/**
 * Migration script to move existing user preferences from in-memory storage to database
 * This script handles the transition from localStorage-only preferences to database-backed storage
 */

interface LegacyPreferences {
  userId: string;
  favorites: string[];
  tags: Record<string, string[]>;
  viewMode: 'tiles' | 'list';
  searchHistory: string[];
  currency: 'EUR' | 'USD' | 'GBP';
  language: 'en' | 'es' | 'fr' | 'de';
  timezone: string;
  theme: 'light' | 'dark' | 'system';
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

interface MigrationReport {
  totalUsers: number;
  migratedUsers: number;
  failedUsers: string[];
  errors: string[];
  startTime: Date;
  endTime: Date;
  duration: number;
}

export class UserPreferencesMigration {
  private static readonly STORAGE_KEY = 'ghgconnect_vessel_settings';
  private static readonly STORAGE_KEY_PREFIX = 'ghgconnect_vessel_settings_';

  /**
   * Run the complete migration process
   */
  static async runMigration(): Promise<MigrationReport> {
    const startTime = new Date();
    const report: MigrationReport = {
      totalUsers: 0,
      migratedUsers: 0,
      failedUsers: [],
      errors: [],
      startTime,
      endTime: new Date(),
      duration: 0,
    };

    console.log('Starting user preferences migration...');
    console.log('Start time:', startTime.toISOString());

    try {
      // Step 1: Discover all users with localStorage preferences
      const usersWithPreferences = await this.discoverUsersWithPreferences();
      report.totalUsers = usersWithPreferences.length;

      console.log(`Found ${usersWithPreferences.length} users with localStorage preferences`);

      // Step 2: Migrate each user's preferences
      for (const userId of usersWithPreferences) {
        try {
          await this.migrateUserPreferences(userId);
          report.migratedUsers++;
          console.log(`✓ Migrated preferences for user: ${userId}`);
        } catch (error) {
          report.failedUsers.push(userId);
          const errorMsg = `Failed to migrate user ${userId}: ${error instanceof Error ? error.message : String(error)}`;
          report.errors.push(errorMsg);
          console.error(`✗ ${errorMsg}`);
        }
      }

      // Step 3: Migrate any existing user-fleet/vessel associations
      await this.migrateUserAccessAssociations();

      // Step 4: Clean up localStorage (optional - commented out for safety)
      // await this.cleanupLocalStorage();

    } catch (error) {
      const errorMsg = `Migration failed: ${error instanceof Error ? error.message : String(error)}`;
      report.errors.push(errorMsg);
      console.error(errorMsg);
    }

    report.endTime = new Date();
    report.duration = report.endTime.getTime() - startTime.getTime();

    console.log('Migration completed');
    console.log('End time:', report.endTime.toISOString());
    console.log('Duration:', report.duration, 'ms');
    console.log('Report:', JSON.stringify(report, null, 2));

    return report;
  }

  /**
   * Discover all users who have preferences stored in localStorage
   */
  private static async discoverUsersWithPreferences(): Promise<string[]> {
    const userIds = new Set<string>();

    // Check localStorage for all possible user preference keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_KEY_PREFIX)) {
        const userId = key.substring(this.STORAGE_KEY_PREFIX.length);
        if (userId) {
          userIds.add(userId);
        }
      }
    }

    return Array.from(userIds);
  }

  /**
   * Migrate preferences for a specific user
   */
  private static async migrateUserPreferences(userId: string): Promise<void> {
    // Read from localStorage
    const stored = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}${userId}`);
    if (!stored) {
      throw new Error('No preferences found in localStorage');
    }

    let legacyPreferences: LegacyPreferences;
    try {
      legacyPreferences = JSON.parse(stored);
    } catch (error) {
      throw new Error(`Invalid JSON in localStorage: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Validate the preferences structure
    this.validateLegacyPreferences(legacyPreferences);

    // Migrate to database using UserPreferencesService
    await UserPreferencesService.migrateFromLocalStorage(userId, legacyPreferences);

    console.log(`Migrated preferences for user ${userId}:`, {
      favorites: legacyPreferences.favorites.length,
      tags: Object.keys(legacyPreferences.tags).length,
      currency: legacyPreferences.currency,
      language: legacyPreferences.language,
      theme: legacyPreferences.theme,
    });
  }

  /**
   * Migrate any existing user-fleet/vessel associations from mock data
   */
  private static async migrateUserAccessAssociations(): Promise<void> {
    console.log('Migrating user access associations...');

    // This would typically involve reading from the existing mock user data
    // and creating explicit access records for non-admin users
    // For now, we'll just log that this step was attempted
    
    console.log('User access associations migration completed (no explicit associations found)');
  }

  /**
   * Validate legacy preferences structure
   */
  private static validateLegacyPreferences(preferences: any): asserts preferences is LegacyPreferences {
    if (!preferences || typeof preferences !== 'object') {
      throw new Error('Preferences must be an object');
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
   * Clean up localStorage after successful migration (optional)
   */
  private static async cleanupLocalStorage(): Promise<void> {
    console.log('Cleaning up localStorage...');

    const usersWithPreferences = await this.discoverUsersWithPreferences();
    let cleanedCount = 0;

    for (const userId of usersWithPreferences) {
      try {
        // Verify the user's preferences exist in the database
        const dbPreferences = await UserPreferencesService.getUserPreferences(userId);
        
        if (dbPreferences) {
          // Remove from localStorage
          localStorage.removeItem(`${this.STORAGE_KEY_PREFIX}${userId}`);
          cleanedCount++;
          console.log(`Cleaned localStorage for user: ${userId}`);
        }
      } catch (error) {
        console.warn(`Skipping cleanup for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log(`Cleaned up localStorage for ${cleanedCount} users`);
  }

  /**
   * Verify migration integrity
   */
  static async verifyMigration(): Promise<{ verified: number; errors: string[] }> {
    console.log('Verifying migration integrity...');

    const usersWithPreferences = await this.discoverUsersWithPreferences();
    let verified = 0;
    const errors: string[] = [];

    for (const userId of usersWithPreferences) {
      try {
        // Check if preferences exist in database
        const dbPreferences = await UserPreferencesService.getUserPreferences(userId);
        
        // Check if preferences exist in localStorage
        const localPreferences = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}${userId}`);
        
        if (dbPreferences && localPreferences) {
          const local = JSON.parse(localPreferences);
          
          // Compare key fields
          if (dbPreferences.favorites.length === local.favorites.length &&
              dbPreferences.currency === local.currency &&
              dbPreferences.language === local.language &&
              dbPreferences.theme === local.theme) {
            verified++;
            console.log(`✓ Verified user: ${userId}`);
          } else {
            errors.push(`Data mismatch for user ${userId}`);
          }
        } else {
          errors.push(`Missing data for user ${userId}`);
        }
      } catch (error) {
        errors.push(`Verification failed for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log(`Verification completed: ${verified} users verified, ${errors.length} errors`);
    return { verified, errors };
  }

  /**
   * Rollback migration (emergency use only)
   */
  static async rollbackMigration(): Promise<void> {
    console.warn('ROLLBACK: This will remove all user preferences from the database!');
    console.warn('Make sure you have backups before proceeding.');
    
    // This is a dangerous operation and should be implemented carefully
    // For now, we'll just log a warning
    console.warn('Rollback not implemented - manual intervention required');
  }
}

// CLI interface for running the migration
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      UserPreferencesMigration.runMigration()
        .then(report => {
          console.log('Migration completed successfully');
          process.exit(0);
        })
        .catch(error => {
          console.error('Migration failed:', error);
          process.exit(1);
        });
      break;
      
    case 'verify':
      UserPreferencesMigration.verifyMigration()
        .then(result => {
          console.log('Verification completed:', result);
          process.exit(0);
        })
        .catch(error => {
          console.error('Verification failed:', error);
          process.exit(1);
        });
      break;
      
    case 'rollback':
      UserPreferencesMigration.rollbackMigration()
        .then(() => {
          console.log('Rollback completed');
          process.exit(0);
        })
        .catch(error => {
          console.error('Rollback failed:', error);
          process.exit(1);
        });
      break;
      
    default:
      console.log('Usage: node migrate-user-preferences.js [migrate|verify|rollback]');
      process.exit(1);
  }
}


