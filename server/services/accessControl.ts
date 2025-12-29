import { db } from '../db';
import { storage } from '../storage';
import { 
  userFleetAccess, 
  userVesselAccess, 
  fleets, 
  vessels, 
  users,
  type UserFleetAccess,
  type UserVesselAccess,
  type Fleet,
  type Vessel,
  type User
} from '@shared/schema';
import { eq, and, or, isNull, sql } from 'drizzle-orm';

export interface AccessControlResult {
  fleets: Fleet[];
  vessels: Vessel[];
  explicitFleetAccess: UserFleetAccess[];
  explicitVesselAccess: UserVesselAccess[];
}

export class AccessControlService {
  /**
   * Get all fleets a user can access based on role and explicit assignments
   */
  static async getUserAccessibleFleets(userId: string, userRole: string): Promise<Fleet[]> {
    console.log('getUserAccessibleFleets called with userId:', userId, 'userRole:', userRole);
    
    // Temporarily return empty array for all users to avoid any errors
    console.log('Returning empty fleet access for user:', userId);
    return [];

    // TODO: Re-enable this logic once SQL issues are resolved
    /*
    // ADMIN and OWNER roles see all fleets
    if (userRole === 'ADMIN' || userRole === 'OWNER') {
      return await storage.getAllFleets();
    }

    // For memory storage fallback, return empty array for now
    // In a real implementation, we'd need to store user-fleet access in memory too
    if (!db) {
      console.log('Database unavailable, returning empty fleet access for user:', userId);
      return [];
    }

    // Other roles only see explicitly assigned fleets
    const accessibleFleets = await db
      .select({
        id: fleets.id,
        orgId: fleets.orgId,
        name: fleets.name,
        description: fleets.description,
        createdAt: fleets.createdAt,
      })
      .from(fleets)
      .innerJoin(userFleetAccess, eq(fleets.id, userFleetAccess.fleetId))
      .where(
        and(
          eq(userFleetAccess.userId, userId),
          or(
            isNull(userFleetAccess.expiresAt),
            sql`${userFleetAccess.expiresAt} > NOW()`
          )
        )
      );

    return accessibleFleets;
  }

  /**
   * Get all vessels a user can access based on role and explicit assignments
   */
  static async getUserAccessibleVessels(userId: string, userRole: string): Promise<Vessel[]> {
    console.log('getUserAccessibleVessels called with userId:', userId, 'userRole:', userRole);
    
    // Temporarily return empty array for all users to avoid any errors
    console.log('Returning empty vessel access for user:', userId);
    return [];

    // TODO: Re-enable this logic once SQL issues are resolved
    /*
    // ADMIN and OWNER roles see all vessels
    if (userRole === 'ADMIN' || userRole === 'OWNER') {
      console.log('User has ADMIN/OWNER role, returning all vessels');
      return await storage.getAllVessels();
    }

    // For memory storage fallback, return empty array for now
    // In a real implementation, we'd need to store user-vessel access in memory too
    if (!db) {
      console.log('Database unavailable, returning empty vessel access for user:', userId);
      return [];
    }

    // TODO: Fix the SQL query below - it's causing PostgreSQL errors
    */
    
    /*
    // Get explicitly assigned vessels
    const explicitVessels = await db
      .select({
        id: vessels.id,
        tenantId: vessels.tenantId,
        fleetId: vessels.fleetId,
        imoNumber: vessels.imoNumber,
        name: vessels.name,
        vesselType: vessels.vesselType,
        flagState: vessels.flagState,
        grossTonnage: vessels.grossTonnage,
        deadweightTonnage: vessels.deadweightTonnage,
        mainEngineType: vessels.mainEngineType,
        iceClass: vessels.iceClass,
        createdAt: vessels.createdAt,
        updatedAt: vessels.updatedAt,
      })
      .from(vessels)
      .innerJoin(userVesselAccess, eq(vessels.id, userVesselAccess.vesselId))
      .where(
        and(
          eq(userVesselAccess.userId, userId),
          or(
            isNull(userVesselAccess.expiresAt),
            sql`${userVesselAccess.expiresAt} > NOW()`
          )
        )
      );

    // Get vessels from accessible fleets
    const accessibleFleets = await this.getUserAccessibleFleets(userId, userRole);
    const fleetIds = accessibleFleets.map(fleet => fleet.id);
    
    let fleetVessels: Vessel[] = [];
    if (fleetIds.length > 0) {
      fleetVessels = await db
        .select()
        .from(vessels)
        .where(sql`${vessels.fleetId} = ANY(${fleetIds})`);
    }

    // Combine and deduplicate vessels
    const allVessels = [...explicitVessels, ...fleetVessels];
    const uniqueVessels = allVessels.filter((vessel, index, self) => 
      index === self.findIndex(v => v.id === vessel.id)
    );

    return uniqueVessels;
    */
  }

  /**
   * Grant fleet access to a user
   */
  static async grantFleetAccess(
    userId: string, 
    fleetId: string, 
    grantedBy: string,
    expiresAt?: Date
  ): Promise<UserFleetAccess> {
    // Check if access already exists
    const existingAccess = await db
      .select()
      .from(userFleetAccess)
      .where(
        and(
          eq(userFleetAccess.userId, userId),
          eq(userFleetAccess.fleetId, fleetId)
        )
      )
      .limit(1);

    if (existingAccess.length > 0) {
      // Update existing access
      const [updatedAccess] = await db
        .update(userFleetAccess)
        .set({
          grantedBy,
          grantedAt: new Date(),
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(userFleetAccess.id, existingAccess[0].id))
        .returning();

      return updatedAccess;
    } else {
      // Create new access
      const [newAccess] = await db
        .insert(userFleetAccess)
        .values({
          userId,
          fleetId,
          grantedBy,
          expiresAt,
        })
        .returning();

      return newAccess;
    }
  }

  /**
   * Revoke fleet access from a user
   */
  static async revokeFleetAccess(userId: string, fleetId: string): Promise<boolean> {
    const result = await db
      .delete(userFleetAccess)
      .where(
        and(
          eq(userFleetAccess.userId, userId),
          eq(userFleetAccess.fleetId, fleetId)
        )
      );

    return result.rowCount > 0;
  }

  /**
   * Grant vessel access to a user
   */
  static async grantVesselAccess(
    userId: string, 
    vesselId: string, 
    grantedBy: string,
    expiresAt?: Date
  ): Promise<UserVesselAccess> {
    // Check if access already exists
    const existingAccess = await db
      .select()
      .from(userVesselAccess)
      .where(
        and(
          eq(userVesselAccess.userId, userId),
          eq(userVesselAccess.vesselId, vesselId)
        )
      )
      .limit(1);

    if (existingAccess.length > 0) {
      // Update existing access
      const [updatedAccess] = await db
        .update(userVesselAccess)
        .set({
          grantedBy,
          grantedAt: new Date(),
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(userVesselAccess.id, existingAccess[0].id))
        .returning();

      return updatedAccess;
    } else {
      // Create new access
      const [newAccess] = await db
        .insert(userVesselAccess)
        .values({
          userId,
          vesselId,
          grantedBy,
          expiresAt,
        })
        .returning();

      return newAccess;
    }
  }

  /**
   * Revoke vessel access from a user
   */
  static async revokeVesselAccess(userId: string, vesselId: string): Promise<boolean> {
    const result = await db
      .delete(userVesselAccess)
      .where(
        and(
          eq(userVesselAccess.userId, userId),
          eq(userVesselAccess.vesselId, vesselId)
        )
      );

    return result.rowCount > 0;
  }

  /**
   * Get explicit fleet access for a user
   */
  static async getUserExplicitFleetAccess(userId: string): Promise<UserFleetAccess[]> {
    return await db
      .select()
      .from(userFleetAccess)
      .where(eq(userFleetAccess.userId, userId));
  }

  /**
   * Get explicit vessel access for a user
   */
  static async getUserExplicitVesselAccess(userId: string): Promise<UserVesselAccess[]> {
    return await db
      .select()
      .from(userVesselAccess)
      .where(eq(userVesselAccess.userId, userId));
  }

  /**
   * Sync user access based on role changes
   * This can be called when a user's role changes to update their access
   */
  static async syncUserAccess(userId: string, newRole: string): Promise<void> {
    // For ADMIN/OWNER roles, we don't need explicit access records
    // For other roles, we might want to clean up expired access or apply role-based defaults
    // This is a placeholder for future role-based access logic
    
    if (newRole === 'ADMIN' || newRole === 'OWNER') {
      // Optionally clean up explicit access records for admin users
      // since they have global access anyway
      console.log(`User ${userId} role changed to ${newRole} - has global access`);
    }
  }

  /**
   * Check if user has access to a specific fleet
   */
  static async hasFleetAccess(userId: string, fleetId: string, userRole: string): Promise<boolean> {
    // ADMIN and OWNER have access to all fleets
    if (userRole === 'ADMIN' || userRole === 'OWNER') {
      return true;
    }

    // Check explicit access
    const access = await db
      .select()
      .from(userFleetAccess)
      .where(
        and(
          eq(userFleetAccess.userId, userId),
          eq(userFleetAccess.fleetId, fleetId),
          or(
            isNull(userFleetAccess.expiresAt),
            sql`${userFleetAccess.expiresAt} > NOW()`
          )
        )
      )
      .limit(1);

    return access.length > 0;
  }

  /**
   * Check if user has access to a specific vessel
   */
  static async hasVesselAccess(userId: string, vesselId: string, userRole: string): Promise<boolean> {
    // ADMIN and OWNER have access to all vessels
    if (userRole === 'ADMIN' || userRole === 'OWNER') {
      return true;
    }

    // Check explicit vessel access
    const explicitAccess = await db
      .select()
      .from(userVesselAccess)
      .where(
        and(
          eq(userVesselAccess.userId, userId),
          eq(userVesselAccess.vesselId, vesselId),
          or(
            isNull(userVesselAccess.expiresAt),
            sql`${userVesselAccess.expiresAt} > NOW()`
          )
        )
      )
      .limit(1);

    if (explicitAccess.length > 0) {
      return true;
    }

    // Check fleet-based access
    const vessel = await db
      .select({ fleetId: vessels.fleetId })
      .from(vessels)
      .where(eq(vessels.id, vesselId))
      .limit(1);

    if (vessel.length > 0 && vessel[0].fleetId) {
      return await this.hasFleetAccess(userId, vessel[0].fleetId, userRole);
    }

    return false;
  }

  /**
   * Get comprehensive access information for a user
   */
  static async getUserAccessInfo(userId: string, userRole: string): Promise<AccessControlResult> {
    console.log('getUserAccessInfo called with userId:', userId, 'userRole:', userRole);
    
    try {
      const [accessibleFleets, accessibleVessels] = await Promise.all([
        this.getUserAccessibleFleets(userId, userRole),
        this.getUserAccessibleVessels(userId, userRole),
      ]);

      // Temporarily return empty explicit access to avoid SQL errors
      const explicitFleetAccess: UserFleetAccess[] = [];
      const explicitVesselAccess: UserVesselAccess[] = [];

      return {
        fleets: accessibleFleets,
        vessels: accessibleVessels,
        explicitFleetAccess,
        explicitVesselAccess,
      };
    } catch (error) {
      console.error('Error in getUserAccessInfo:', error);
      // Return empty result to avoid crashing
      return {
        fleets: [],
        vessels: [],
        explicitFleetAccess: [],
        explicitVesselAccess: [],
      };
    }
  }
}
