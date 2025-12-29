import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { db, pool } from './db';
import { 
  type User, 
  type InsertUser,
  type Tenant,
  type Organization,
  type Fleet,
  type UserRole,
  type AuditLog,
  type Vessel,
  type Voyage,
  type Port,
  type Fuel,
  type Consumption,
  users,
  tenants,
  organizations,
  fleets,
  userRoles,
  auditLogs,
  vessels,
  voyages,
  ports,
  fuels,
  consumptions,
  userFleetAccess,
  userVesselAccess,
  userPreferences,
} from "@shared/schema";
import type { IStorage, AuditLogFilters } from "./storage";

/**
 * Database storage implementation using Drizzle ORM
 * Connects to PostgreSQL for persistent data storage
 */
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(users).values(user).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!db) return false;
    try {
      // Delete related records first to avoid foreign key constraint violations
      
      // Delete user fleet access
      await db.delete(userFleetAccess).where(eq(userFleetAccess.userId, id));
      console.log('✅ Deleted user fleet access records');
      
      // Delete user vessel access
      await db.delete(userVesselAccess).where(eq(userVesselAccess.userId, id));
      console.log('✅ Deleted user vessel access records');
      
      // Delete user roles
      await db.delete(userRoles).where(eq(userRoles.userId, id));
      console.log('✅ Deleted user roles');
      
      // Delete user preferences
      await db.delete(userPreferences).where(eq(userPreferences.userId, id));
      console.log('✅ Deleted user preferences');
      
      // Finally, delete the user
      const result = await db.delete(users).where(eq(users.id, id));
      console.log('✅ Deleted user');
      
      // Check if any rows were actually deleted
      return result.rowCount !== undefined && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    if (!db) return [];
    try {
      const result = await db.select().from(users);
      return result;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Tenant methods
  async getTenant(id: string): Promise<Tenant | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting tenant:', error);
      return undefined;
    }
  }

  async getAllTenants(): Promise<Tenant[]> {
    if (!db) return [];
    try {
      const result = await db.select().from(tenants);
      return result;
    } catch (error) {
      console.error('Error getting all tenants:', error);
      return [];
    }
  }

  async getTenantsByUser(userId: string): Promise<Tenant[]> {
    if (!db) return [];
    try {
      const user = await this.getUser(userId);
      if (!user || !user.tenantId) return [];
      
      const tenant = await this.getTenant(user.tenantId);
      return tenant ? [tenant] : [];
    } catch (error) {
      console.error('Error getting tenants by user:', error);
      return [];
    }
  }

  async createTenant(tenant: Partial<Tenant>): Promise<Tenant> {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(tenants).values({
        name: tenant.name || "Unnamed Tenant",
        settingsJson: tenant.settingsJson || null,
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.update(tenants)
        .set(updates)
        .where(eq(tenants.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating tenant:', error);
      return undefined;
    }
  }

  // Organization methods
  async getOrganization(id: string, tenantId: string): Promise<Organization | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(organizations)
        .where(and(eq(organizations.id, id), eq(organizations.tenantId, tenantId)))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting organization:', error);
      return undefined;
    }
  }

  async getOrganizationsByTenant(tenantId: string): Promise<Organization[]> {
    if (!db) return [];
    try {
      return await db.select().from(organizations)
        .where(eq(organizations.tenantId, tenantId));
    } catch (error) {
      console.error('Error getting organizations by tenant:', error);
      return [];
    }
  }

  async createOrganization(org: Partial<Organization>): Promise<Organization> {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(organizations).values({
        tenantId: org.tenantId!,
        name: org.name || "Unnamed Organization",
        parentOrgId: org.parentOrgId || null,
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  // Fleet methods
  async getAllFleets(): Promise<Fleet[]> {
    if (!db) return [];
    try {
      return await db.select().from(fleets);
    } catch (error) {
      console.error('Error getting all fleets:', error);
      return [];
    }
  }

  async getFleet(id: string, tenantId: string): Promise<Fleet | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(fleets)
        .innerJoin(organizations, eq(fleets.orgId, organizations.id))
        .where(and(eq(fleets.id, id), eq(organizations.tenantId, tenantId)))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting fleet:', error);
      return undefined;
    }
  }

  async getFleetsByOrg(orgId: string, tenantId: string): Promise<Fleet[]> {
    if (!db) return [];
    try {
      const org = await this.getOrganization(orgId, tenantId);
      if (!org) return [];
      
      return await db.select().from(fleets)
        .where(eq(fleets.orgId, orgId));
    } catch (error) {
      console.error('Error getting fleets by org:', error);
      return [];
    }
  }

  async createFleet(fleet: Partial<Fleet>): Promise<Fleet> {
    if (!db) throw new Error('Database not available');
    try {
      // Use raw SQL to ensure tenant_id is included
      const result = await db.execute(sql`
        INSERT INTO fleets (org_id, tenant_id, name, description, created_at)
        VALUES (${fleet.orgId}, ${fleet.tenantId}, ${fleet.name || "Unnamed Fleet"}, ${fleet.description || null}, NOW())
        RETURNING id, org_id, tenant_id, name, description, created_at
      `);
      return result.rows[0] as Fleet;
    } catch (error) {
      console.error('Error creating fleet:', error);
      throw error;
    }
  }

  async updateFleet(id: string, fleet: Partial<Fleet>): Promise<Fleet | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.update(fleets)
        .set({
          name: fleet.name,
          description: fleet.description,
        })
        .where(eq(fleets.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating fleet:', error);
      return undefined;
    }
  }

  async deleteFleet(id: string): Promise<boolean> {
    if (!db) return false;
    try {
      const result = await db.delete(fleets).where(eq(fleets.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting fleet:', error);
      return false;
    }
  }

  // User Role methods
  async getUserRoles(userId: string, tenantId: string): Promise<UserRole[]> {
    if (!db) return [];
    try {
      // userRoles table doesn't have tenantId column, only query by userId
      return await db.select().from(userRoles)
        .where(eq(userRoles.userId, userId));
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  }

  async createUserRole(userRole: Partial<UserRole>): Promise<UserRole> {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(userRoles).values({
        userId: userRole.userId!,
        tenantId: userRole.tenantId!,
        role: userRole.role!,
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user role:', error);
      throw error;
    }
  }

  async deleteUserRole(userId: string, tenantId?: string): Promise<boolean> {
    if (!db) return false;
    try {
      // userRoles table doesn't have tenantId column, only delete by userId
      await db.delete(userRoles)
        .where(eq(userRoles.userId, userId));
      return true;
    } catch (error) {
      console.error('Error deleting user role:', error);
      return false;
    }
  }

  // Audit Log methods
  async createAuditLog(log: Partial<AuditLog>): Promise<AuditLog> {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(auditLogs).values({
        tenantId: log.tenantId!,
        userId: log.userId || null,
        entityType: log.entityType!,
        entityId: log.entityId || null,
        action: log.action!,
        oldValueJson: log.oldValueJson || null,
        newValueJson: log.newValueJson || null,
        requestId: log.requestId || null,
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  async getAuditLogs(tenantId: string, filters?: AuditLogFilters): Promise<AuditLog[]> {
    if (!db) return [];
    try {
      let query = db.select().from(auditLogs)
        .where(eq(auditLogs.tenantId, tenantId))
        .$dynamic();

      if (filters) {
        if (filters.entityType) {
          query = query.where(eq(auditLogs.entityType, filters.entityType));
        }
        if (filters.entityId) {
          query = query.where(eq(auditLogs.entityId, filters.entityId));
        }
        if (filters.userId) {
          query = query.where(eq(auditLogs.userId, filters.userId));
        }
        if (filters.action) {
          query = query.where(eq(auditLogs.action, filters.action));
        }
        if (filters.startDate) {
          query = query.where(gte(auditLogs.timestamp, filters.startDate));
        }
        if (filters.endDate) {
          query = query.where(lte(auditLogs.timestamp, filters.endDate));
        }
      }

      query = query.orderBy(desc(auditLogs.timestamp));

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      return await query;
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  // Vessel methods
  async getVessel(id: string, tenantId: string): Promise<Vessel | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(vessels)
        .where(and(eq(vessels.id, id), eq(vessels.tenantId, tenantId)))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting vessel:', error);
      return undefined;
    }
  }

  async getVesselsByTenant(tenantId: string): Promise<Vessel[]> {
    if (!db) return [];
    try {
      // Join vessels with fleets to get fleet information
      const result = await db
        .select({
          id: vessels.id,
          tenantId: vessels.tenantId,
          name: vessels.name,
          imoNumber: vessels.imoNumber,
          vesselType: vessels.vesselType,
          flagState: vessels.flagState,
          grossTonnage: vessels.grossTonnage,
          deadweightTonnage: vessels.deadweightTonnage,
          mainEngineType: vessels.mainEngineType,
          iceClass: vessels.iceClass,
          fleetId: vessels.fleetId,
          fleetName: fleets.name,
          createdAt: vessels.createdAt,
          updatedAt: vessels.updatedAt
        })
        .from(vessels)
        .leftJoin(fleets, eq(vessels.fleetId, fleets.id))
        .where(eq(vessels.tenantId, tenantId));
      
      return result.map(row => ({
        ...row,
        fleetName: row.fleetName || null
      }));
    } catch (error) {
      console.error('Error getting vessels by tenant:', error);
      return [];
    }
  }

  async getAllVessels(): Promise<Vessel[]> {
    if (!db) return [];
    try {
      // Join vessels with fleets to get fleet information
      const result = await db
        .select({
          id: vessels.id,
          tenantId: vessels.tenantId,
          name: vessels.name,
          imoNumber: vessels.imoNumber,
          vesselType: vessels.vesselType,
          flagState: vessels.flagState,
          grossTonnage: vessels.grossTonnage,
          deadweightTonnage: vessels.deadweightTonnage,
          mainEngineType: vessels.mainEngineType,
          iceClass: vessels.iceClass,
          fleetId: vessels.fleetId,
          fleetName: fleets.name,
          createdAt: vessels.createdAt,
          updatedAt: vessels.updatedAt
        })
        .from(vessels)
        .leftJoin(fleets, eq(vessels.fleetId, fleets.id));
      
      return result.map(row => ({
        ...row,
        fleetName: row.fleetName || null
      }));
    } catch (error) {
      console.error('Error getting all vessels:', error);
      return [];
    }
  }

  async getVesselsByFleet(fleetId: string, tenantId: string): Promise<Vessel[]> {
    if (!db) return [];
    try {
      return await db.select().from(vessels)
        .where(and(eq(vessels.fleetId, fleetId), eq(vessels.tenantId, tenantId)));
    } catch (error) {
      console.error('Error getting vessels by fleet:', error);
      return [];
    }
  }

  async createVessel(vessel: Partial<Vessel>): Promise<Vessel> {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(vessels).values({
        tenantId: vessel.tenantId!,
        fleetId: vessel.fleetId || null,
        imoNumber: vessel.imoNumber!,
        name: vessel.name!,
        vesselType: vessel.vesselType!,
        flagState: vessel.flagState!,
        grossTonnage: vessel.grossTonnage!,
        deadweightTonnage: vessel.deadweightTonnage || null,
        mainEngineType: vessel.mainEngineType || null,
        iceClass: vessel.iceClass || null,
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating vessel:', error);
      throw error;
    }
  }

  async updateVessel(id: string, tenantId: string, updates: Partial<Vessel>): Promise<Vessel | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.update(vessels)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(vessels.id, id), eq(vessels.tenantId, tenantId)))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating vessel:', error);
      return undefined;
    }
  }

  // Voyage methods
  async getVoyage(id: string, tenantId: string): Promise<Voyage | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(voyages)
        .where(and(eq(voyages.id, id), eq(voyages.tenantId, tenantId)))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting voyage:', error);
      return undefined;
    }
  }

  async getVoyagesByVessel(vesselId: string, tenantId: string): Promise<Voyage[]> {
    if (!db) return [];
    try {
      return await db.select().from(voyages)
        .where(and(eq(voyages.vesselId, vesselId), eq(voyages.tenantId, tenantId)))
        .orderBy(desc(voyages.departureAt));
    } catch (error) {
      console.error('Error getting voyages by vessel:', error);
      return [];
    }
  }

  async getVoyagesByTenant(tenantId: string): Promise<Voyage[]> {
    if (!db) return [];
    try {
      return await db.select().from(voyages)
        .where(eq(voyages.tenantId, tenantId))
        .orderBy(desc(voyages.departureAt));
    } catch (error) {
      console.error('Error getting voyages by tenant:', error);
      return [];
    }
  }

  async createVoyage(voyage: Partial<Voyage>): Promise<Voyage> {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(voyages).values({
        tenantId: voyage.tenantId!,
        vesselId: voyage.vesselId!,
        voyageNumber: voyage.voyageNumber!,
        departurePortId: voyage.departurePortId!,
        arrivalPortId: voyage.arrivalPortId!,
        departureAt: voyage.departureAt!,
        arrivalAt: voyage.arrivalAt!,
        distanceNm: voyage.distanceNm!,
        voyageType: voyage.voyageType!,
        coverageEuPct: voyage.coverageEuPct!,
        coverageUkPct: voyage.coverageUkPct!,
        status: voyage.status || "PENDING",
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating voyage:', error);
      throw error;
    }
  }

  // Port methods
  async getPort(id: string): Promise<Port | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(ports)
        .where(eq(ports.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting port:', error);
      return undefined;
    }
  }

  async getPortByUnlocode(unlocode: string): Promise<Port | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(ports)
        .where(eq(ports.unlocode, unlocode))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting port by unlocode:', error);
      return undefined;
    }
  }

  async getAllPorts(): Promise<Port[]> {
    if (!db) return [];
    try {
      return await db.select().from(ports);
    } catch (error) {
      console.error('Error getting all ports:', error);
      return [];
    }
  }

  async createPort(port: Partial<Port>): Promise<Port> {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(ports).values({
        tenantId: port.tenantId || null,
        unlocode: port.unlocode!,
        name: port.name!,
        countryIso: port.countryIso!,
        isEu: port.isEu || false,
        isUk: port.isUk || false,
        isOmr: port.isOmr || false,
        latitude: port.latitude || null,
        longitude: port.longitude || null,
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating port:', error);
      throw error;
    }
  }

  // Fuel methods
  async getFuel(id: string): Promise<Fuel | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(fuels)
        .where(eq(fuels.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting fuel:', error);
      return undefined;
    }
  }

  async getFuelByCode(code: string): Promise<Fuel | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(fuels)
        .where(eq(fuels.code, code))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting fuel by code:', error);
      return undefined;
    }
  }

  async getAllFuels(): Promise<Fuel[]> {
    if (!db) return [];
    try {
      return await db.select().from(fuels);
    } catch (error) {
      console.error('Error getting all fuels:', error);
      return [];
    }
  }

  async createFuel(fuel: Partial<Fuel>): Promise<Fuel> {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(fuels).values({
        code: fuel.code!,
        name: fuel.name!,
        lcvMjKg: fuel.lcvMjKg!,
        defaultTtwGco2eMj: fuel.defaultTtwGco2eMj!,
        defaultWttGco2eMj: fuel.defaultWttGco2eMj!,
        defaultCo2FactorT: fuel.defaultCo2FactorT!,
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating fuel:', error);
      throw error;
    }
  }

  // Consumption methods
  async getConsumption(id: string): Promise<Consumption | undefined> {
    if (!db) return undefined;
    try {
      const result = await db.select().from(consumptions)
        .where(eq(consumptions.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting consumption:', error);
      return undefined;
    }
  }

  async getConsumptionsByVoyage(voyageId: string): Promise<Consumption[]> {
    if (!db) return [];
    try {
      return await db.select().from(consumptions)
        .where(eq(consumptions.voyageId, voyageId));
    } catch (error) {
      console.error('Error getting consumptions by voyage:', error);
      return [];
    }
  }

  async createConsumption(consumption: Partial<Consumption>): Promise<Consumption> {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(consumptions).values({
        voyageId: consumption.voyageId!,
        fuelId: consumption.fuelId!,
        massTonnes: consumption.massTonnes!,
        engineType: consumption.engineType || null,
        methaneSlipPct: consumption.methaneSlipPct || null,
        location: consumption.location!,
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating consumption:', error);
      throw error;
    }
  }

  // User preferences methods
  async getUserPreferences(userId: string): Promise<any> {
    if (!db) return null;
    try {
      const result = await db.execute(sql`
        SELECT preferences_json FROM user_preferences 
        WHERE user_id = ${userId}
        LIMIT 1
      `);
      
      if (result.rows.length > 0) {
        return result.rows[0].preferences_json;
      }
      
      // Return default preferences if none found
      return {
        userId,
        favorites: [],
        tags: {},
        viewMode: 'tiles',
        searchHistory: [],
        currency: 'EUR',
        language: 'en',
        timezone: 'UTC',
        subscriptionTier: 'professional',
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
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  async saveUserPreferences(userId: string, preferences: any): Promise<void> {
    // For now, this is a no-op as we don't have a user_preferences table yet
    // This can be extended with a proper table in the future
    console.log(`Saving preferences for user ${userId}:`, preferences);
  }

  async createUserPreferences(userId: string, preferences: any): Promise<void> {
    if (!db) throw new Error('Database not available');
    try {
      // Insert or update user preferences
      await db.execute(sql`
        INSERT INTO user_preferences (user_id, preferences_json)
        VALUES (${userId}, ${JSON.stringify(preferences)})
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          preferences_json = ${JSON.stringify(preferences)},
          updated_at = CURRENT_TIMESTAMP
      `);
      console.log(`✅ User preferences created/updated for user ${userId}`);
    } catch (error) {
      console.error('Error creating user preferences:', error);
      throw error;
    }
  }

  // User Access Control methods
  async createUserFleetAccess(userId: string, fleetId: string, grantedBy: string, expiresAt?: Date): Promise<any> {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(userFleetAccess).values({
        userId,
        fleetId,
        grantedBy,
        expiresAt
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user fleet access:', error);
      throw error;
    }
  }

  async createUserVesselAccess(userId: string, vesselId: string, grantedBy: string, expiresAt?: Date): Promise<any> {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(userVesselAccess).values({
        userId,
        vesselId,
        grantedBy,
        expiresAt
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user vessel access:', error);
      throw error;
    }
  }

  async getUserFleetAccess(userId: string): Promise<any[]> {
    if (!db) return [];
    try {
      return await db.select().from(userFleetAccess).where(eq(userFleetAccess.userId, userId));
    } catch (error) {
      console.error('Error getting user fleet access:', error);
      return [];
    }
  }

  async getUserVesselAccess(userId: string): Promise<any[]> {
    if (!db) return [];
    try {
      return await db.select().from(userVesselAccess).where(eq(userVesselAccess.userId, userId));
    } catch (error) {
      console.error('Error getting user vessel access:', error);
      return [];
    }
  }

  async deleteUserFleetAccess(userId: string, fleetId: string): Promise<boolean> {
    if (!db) return false;
    try {
      await db.delete(userFleetAccess).where(
        and(eq(userFleetAccess.userId, userId), eq(userFleetAccess.fleetId, fleetId))
      );
      return true;
    } catch (error) {
      console.error('Error deleting user fleet access:', error);
      return false;
    }
  }

  async deleteUserVesselAccess(userId: string, vesselId: string): Promise<boolean> {
    if (!db) return false;
    try {
      await db.delete(userVesselAccess).where(
        and(eq(userVesselAccess.userId, userId), eq(userVesselAccess.vesselId, vesselId))
      );
      return true;
    } catch (error) {
      console.error('Error deleting user vessel access:', error);
      return false;
    }
  }

  // Health check method
  async isAvailable(): Promise<boolean> {
    if (!pool || !db) return false;
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      return false;
    }
  }
}

