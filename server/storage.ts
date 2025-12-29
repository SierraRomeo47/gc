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
} from "@shared/schema";
import { randomUUID } from "crypto";
import { DatabaseStorage } from "./dbStorage";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Tenant methods
  getTenant(id: string): Promise<Tenant | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  getTenantsByUser(userId: string): Promise<Tenant[]>;
  createTenant(tenant: Partial<Tenant>): Promise<Tenant>;
  updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | undefined>;

  // Organization methods
  getOrganization(id: string, tenantId: string): Promise<Organization | undefined>;
  getOrganizationsByTenant(tenantId: string): Promise<Organization[]>;
  createOrganization(org: Partial<Organization>): Promise<Organization>;

  // Fleet methods
  getAllFleets(): Promise<Fleet[]>;
  getFleet(id: string, tenantId: string): Promise<Fleet | undefined>;
  getFleetsByOrg(orgId: string, tenantId: string): Promise<Fleet[]>;
  createFleet(fleet: Partial<Fleet>): Promise<Fleet>;
  updateFleet(id: string, fleet: Partial<Fleet>): Promise<Fleet | undefined>;
  deleteFleet(id: string): Promise<boolean>;

  // User Role methods
  getUserRoles(userId: string, tenantId: string): Promise<UserRole[]>;
  createUserRole(userRole: Partial<UserRole>): Promise<UserRole>;
  deleteUserRole(userId: string, tenantId?: string): Promise<boolean>;

  // Audit Log methods
  createAuditLog(log: Partial<AuditLog>): Promise<AuditLog>;
  getAuditLogs(tenantId: string, filters?: AuditLogFilters): Promise<AuditLog[]>;

  // Vessel methods
  getVessel(id: string, tenantId: string): Promise<Vessel | undefined>;
  getVesselsByTenant(tenantId: string): Promise<Vessel[]>;
  getAllVessels(): Promise<Vessel[]>;
  getVesselsByFleet(fleetId: string, tenantId: string): Promise<Vessel[]>;
  createVessel(vessel: Partial<Vessel>): Promise<Vessel>;
  updateVessel(id: string, tenantId: string, updates: Partial<Vessel>): Promise<Vessel | undefined>;

  // Voyage methods
  getVoyage(id: string, tenantId: string): Promise<Voyage | undefined>;
  getVoyagesByVessel(vesselId: string, tenantId: string): Promise<Voyage[]>;
  getVoyagesByTenant(tenantId: string): Promise<Voyage[]>;
  createVoyage(voyage: Partial<Voyage>): Promise<Voyage>;

  // Port methods
  getPort(id: string): Promise<Port | undefined>;
  getPortByUnlocode(unlocode: string): Promise<Port | undefined>;
  getAllPorts(): Promise<Port[]>;
  createPort(port: Partial<Port>): Promise<Port>;

  // Fuel methods
  getFuel(id: string): Promise<Fuel | undefined>;
  getFuelByCode(code: string): Promise<Fuel | undefined>;
  getAllFuels(): Promise<Fuel[]>;
  createFuel(fuel: Partial<Fuel>): Promise<Fuel>;

  // Consumption methods
  getConsumption(id: string): Promise<Consumption | undefined>;
  getConsumptionsByVoyage(voyageId: string): Promise<Consumption[]>;
  createConsumption(consumption: Partial<Consumption>): Promise<Consumption>;

  // User preferences methods
  getUserPreferences(userId: string): Promise<any>;
  saveUserPreferences(userId: string, preferences: any): Promise<void>;
}

export interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * In-memory storage implementation
 * Used as fallback when database is not available
 */
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tenants: Map<string, Tenant>;
  private organizations: Map<string, Organization>;
  private fleets: Map<string, Fleet>;
  private userRoles: Map<string, UserRole>;
  private auditLogs: Map<string, AuditLog>;
  private vessels: Map<string, Vessel>;
  private voyages: Map<string, Voyage>;
  private ports: Map<string, Port>;
  private fuels: Map<string, Fuel>;
  private consumptions: Map<string, Consumption>;
  private userPreferences: Map<string, any>;

  constructor() {
    this.users = new Map();
    this.tenants = new Map();
    this.organizations = new Map();
    this.fleets = new Map();
    this.userRoles = new Map();
    this.auditLogs = new Map();
    this.vessels = new Map();
    this.voyages = new Map();
    this.ports = new Map();
    this.fuels = new Map();
    this.consumptions = new Map();
    this.userPreferences = new Map();
    
    // Initialize with demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo organization
    const demoOrg: Organization = {
      id: 'org-1',
      tenantId: 'demo',
      name: 'Demo Maritime Company',
      parentOrgId: null,
      createdAt: new Date(),
    };
    this.organizations.set('org-1', demoOrg);

    // Create demo fleets
    const demoFleets: Fleet[] = [
      {
        id: 'fleet-1',
        orgId: 'org-1',
        tenantId: 'demo',
        name: 'European Coastal Fleet',
        description: 'Fleet operating in European coastal waters with focus on short-haul routes',
        createdAt: new Date(),
      },
      {
        id: 'fleet-2',
        orgId: 'org-1',
        tenantId: 'demo',
        name: 'Transatlantic Fleet',
        description: 'Long-distance fleet operating transatlantic routes between Europe and Americas',
        createdAt: new Date(),
      },
      {
        id: 'fleet-3',
        orgId: 'org-1',
        tenantId: 'demo',
        name: 'Mediterranean Fleet',
        description: 'Fleet specializing in Mediterranean and Black Sea operations',
        createdAt: new Date(),
      },
      {
        id: 'fleet-4',
        orgId: 'org-1',
        tenantId: 'demo',
        name: 'Arctic Fleet',
        description: 'Specialized fleet for Arctic and Northern European operations',
        createdAt: new Date(),
      },
    ];

    demoFleets.forEach(fleet => {
      this.fleets.set(fleet.id, fleet);
    });

    // Create demo vessels with fleet assignments
    const demoVessels = [
      {
        id: '1',
        tenantId: 'demo',
        fleetId: 'fleet-2', // Transatlantic Fleet
        imoNumber: 'IMO9876543',
        name: 'Atlantic Pioneer',
        vesselType: 'Container Ship',
        flagState: 'NL',
        grossTonnage: 50000,
        deadweightTonnage: 45000,
        mainEngineType: 'Diesel',
        iceClass: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        tenantId: 'demo',
        fleetId: 'fleet-4', // Arctic Fleet
        imoNumber: 'IMO9876544',
        name: 'Nordic Explorer',
        vesselType: 'Bulk Carrier',
        flagState: 'NO',
        grossTonnage: 45000,
        deadweightTonnage: 40000,
        mainEngineType: 'LNG',
        iceClass: '1A',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        tenantId: 'demo',
        fleetId: 'fleet-1', // European Coastal Fleet
        imoNumber: 'IMO9876545',
        name: 'Adriatic Star',
        vesselType: 'Ro-Ro Cargo',
        flagState: 'IT',
        grossTonnage: 32000,
        deadweightTonnage: 28000,
        mainEngineType: 'LNG Dual-Fuel',
        iceClass: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '4',
        tenantId: 'demo',
        fleetId: 'fleet-3', // Mediterranean Fleet
        imoNumber: 'IMO9876546',
        name: 'Mediterranean Star',
        vesselType: 'Container Ship',
        flagState: 'GR',
        grossTonnage: 38000,
        deadweightTonnage: 35000,
        mainEngineType: 'Diesel',
        iceClass: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '5',
        tenantId: 'demo',
        fleetId: 'fleet-4', // Arctic Fleet
        imoNumber: 'IMO9876547',
        name: 'Arctic Guardian',
        vesselType: 'Icebreaker',
        flagState: 'FI',
        grossTonnage: 25000,
        deadweightTonnage: 20000,
        mainEngineType: 'Diesel',
        iceClass: '1A Super',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    demoVessels.forEach(vessel => {
      this.vessels.set(vessel.id, vessel);
    });

    console.log('✅ Memory storage initialized with demo data:');
    console.log(`   - ${demoFleets.length} fleets`);
    console.log(`   - ${demoVessels.length} vessels`);
    console.log(`   - 1 organization`);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      mfaEnabled: false,
      mfaSecret: null,
      lastLogin: null,
      createdAt: new Date(),
    } as User;
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Tenant methods
  async getTenant(id: string): Promise<Tenant | undefined> {
    return this.tenants.get(id);
  }

  async getTenantsByUser(userId: string): Promise<Tenant[]> {
    const user = await this.getUser(userId);
    if (!user || !user.tenantId) return [];
    
    const tenant = await this.getTenant(user.tenantId);
    return tenant ? [tenant] : [];
  }

  async createTenant(tenant: Partial<Tenant>): Promise<Tenant> {
    const id = randomUUID();
    const newTenant: Tenant = {
      id,
      name: tenant.name || "Unnamed Tenant",
      createdAt: new Date(),
      settingsJson: tenant.settingsJson || null,
    };
    this.tenants.set(id, newTenant);
    return newTenant;
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | undefined> {
    const tenant = this.tenants.get(id);
    if (!tenant) return undefined;
    
    const updated = { ...tenant, ...updates };
    this.tenants.set(id, updated);
    return updated;
  }

  // Organization methods
  async getOrganization(id: string, tenantId: string): Promise<Organization | undefined> {
    const org = this.organizations.get(id);
    return org?.tenantId === tenantId ? org : undefined;
  }

  async getOrganizationsByTenant(tenantId: string): Promise<Organization[]> {
    return Array.from(this.organizations.values()).filter(
      (org) => org.tenantId === tenantId
    );
  }

  async createOrganization(org: Partial<Organization>): Promise<Organization> {
    const id = randomUUID();
    const newOrg: Organization = {
      id,
      tenantId: org.tenantId!,
      name: org.name || "Unnamed Organization",
      parentOrgId: org.parentOrgId || null,
      createdAt: new Date(),
    };
    this.organizations.set(id, newOrg);
    return newOrg;
  }

  // Fleet methods
  async getAllFleets(): Promise<Fleet[]> {
    return Array.from(this.fleets.values());
  }

  async getFleet(id: string, tenantId: string): Promise<Fleet | undefined> {
    const fleet = this.fleets.get(id);
    if (!fleet) return undefined;
    
    const org = await this.getOrganization(fleet.orgId, tenantId);
    return org ? fleet : undefined;
  }

  async getFleetsByOrg(orgId: string, tenantId: string): Promise<Fleet[]> {
    const org = await this.getOrganization(orgId, tenantId);
    if (!org) return [];
    
    return Array.from(this.fleets.values()).filter(
      (fleet) => fleet.orgId === orgId
    );
  }

  async createFleet(fleet: Partial<Fleet>): Promise<Fleet> {
    const id = randomUUID();
    const newFleet: Fleet = {
      id,
      orgId: fleet.orgId!,
      tenantId: fleet.tenantId!,
      name: fleet.name || "Unnamed Fleet",
      description: fleet.description || null,
      createdAt: new Date(),
    };
    this.fleets.set(id, newFleet);
    return newFleet;
  }

  async updateFleet(id: string, fleet: Partial<Fleet>): Promise<Fleet | undefined> {
    const existingFleet = this.fleets.get(id);
    if (!existingFleet) return undefined;

    const updatedFleet: Fleet = {
      ...existingFleet,
      ...fleet,
      id, // Ensure ID doesn't change
    };
    this.fleets.set(id, updatedFleet);
    return updatedFleet;
  }

  async deleteFleet(id: string): Promise<boolean> {
    return this.fleets.delete(id);
  }

  // User Role methods
  async getUserRoles(userId: string, tenantId: string): Promise<UserRole[]> {
    return Array.from(this.userRoles.values()).filter(
      (role) => role.userId === userId && role.tenantId === tenantId
    );
  }

  async createUserRole(userRole: Partial<UserRole>): Promise<UserRole> {
    const id = randomUUID();
    const newRole: UserRole = {
      id,
      userId: userRole.userId!,
      tenantId: userRole.tenantId!,
      role: userRole.role!,
      createdAt: new Date(),
    };
    this.userRoles.set(id, newRole);
    return newRole;
  }

  async deleteUserRole(id: string, tenantId: string): Promise<boolean> {
    const role = this.userRoles.get(id);
    if (!role || role.tenantId !== tenantId) return false;
    return this.userRoles.delete(id);
  }

  // Audit Log methods
  async createAuditLog(log: Partial<AuditLog>): Promise<AuditLog> {
    const id = randomUUID();
    const newLog: AuditLog = {
      id,
      tenantId: log.tenantId!,
      userId: log.userId || null,
      entityType: log.entityType!,
      entityId: log.entityId || null,
      action: log.action!,
      oldValueJson: log.oldValueJson || null,
      newValueJson: log.newValueJson || null,
      timestamp: new Date(),
      requestId: log.requestId || null,
    };
    this.auditLogs.set(id, newLog);
    return newLog;
  }

  async getAuditLogs(tenantId: string, filters?: AuditLogFilters): Promise<AuditLog[]> {
    let logs = Array.from(this.auditLogs.values()).filter(
      (log) => log.tenantId === tenantId
    );

    if (filters) {
      if (filters.entityType) {
        logs = logs.filter((log) => log.entityType === filters.entityType);
      }
      if (filters.entityId) {
        logs = logs.filter((log) => log.entityId === filters.entityId);
      }
      if (filters.userId) {
        logs = logs.filter((log) => log.userId === filters.userId);
      }
      if (filters.action) {
        logs = logs.filter((log) => log.action === filters.action);
      }
      if (filters.startDate) {
        logs = logs.filter((log) => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter((log) => log.timestamp <= filters.endDate!);
      }
    }

    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filters?.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  }

  // Vessel methods
  async getVessel(id: string, tenantId: string): Promise<Vessel | undefined> {
    const vessel = this.vessels.get(id);
    return vessel?.tenantId === tenantId ? vessel : undefined;
  }

  async getVesselsByTenant(tenantId: string): Promise<Vessel[]> {
    return Array.from(this.vessels.values()).filter(
      (vessel) => vessel.tenantId === tenantId
    );
  }

  async getAllVessels(): Promise<Vessel[]> {
    return Array.from(this.vessels.values());
  }

  async getVesselsByFleet(fleetId: string, tenantId: string): Promise<Vessel[]> {
    return Array.from(this.vessels.values()).filter(
      (vessel) => vessel.fleetId === fleetId && vessel.tenantId === tenantId
    );
  }

  async createVessel(vessel: Partial<Vessel>): Promise<Vessel> {
    const id = randomUUID();
    const now = new Date();
    const newVessel: Vessel = {
      id,
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
      createdAt: now,
      updatedAt: now,
    };
    this.vessels.set(id, newVessel);
    return newVessel;
  }

  async updateVessel(id: string, tenantId: string, updates: Partial<Vessel>): Promise<Vessel | undefined> {
    const vessel = await this.getVessel(id, tenantId);
    if (!vessel) return undefined;
    
    const updated = { ...vessel, ...updates, updatedAt: new Date() };
    this.vessels.set(id, updated);
    return updated;
  }

  // Voyage methods
  async getVoyage(id: string, tenantId: string): Promise<Voyage | undefined> {
    const voyage = this.voyages.get(id);
    return voyage?.tenantId === tenantId ? voyage : undefined;
  }

  async getVoyagesByVessel(vesselId: string, tenantId: string): Promise<Voyage[]> {
    return Array.from(this.voyages.values()).filter(
      (voyage) => voyage.vesselId === vesselId && voyage.tenantId === tenantId
    );
  }

  async getVoyagesByTenant(tenantId: string): Promise<Voyage[]> {
    return Array.from(this.voyages.values()).filter(
      (voyage) => voyage.tenantId === tenantId
    );
  }

  async createVoyage(voyage: Partial<Voyage>): Promise<Voyage> {
    const id = randomUUID();
    const newVoyage: Voyage = {
      id,
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
      createdAt: new Date(),
    };
    this.voyages.set(id, newVoyage);
    return newVoyage;
  }

  // Port methods
  async getPort(id: string): Promise<Port | undefined> {
    return this.ports.get(id);
  }

  async getPortByUnlocode(unlocode: string): Promise<Port | undefined> {
    return Array.from(this.ports.values()).find(
      (port) => port.unlocode === unlocode
    );
  }

  async getAllPorts(): Promise<Port[]> {
    return Array.from(this.ports.values());
  }

  async createPort(port: Partial<Port>): Promise<Port> {
    const id = randomUUID();
    const newPort: Port = {
      id,
      tenantId: port.tenantId || null,
      unlocode: port.unlocode!,
      name: port.name!,
      countryIso: port.countryIso!,
      isEu: port.isEu || false,
      isUk: port.isUk || false,
      isOmr: port.isOmr || false,
      latitude: port.latitude || null,
      longitude: port.longitude || null,
      createdAt: new Date(),
    };
    this.ports.set(id, newPort);
    return newPort;
  }

  // Fuel methods
  async getFuel(id: string): Promise<Fuel | undefined> {
    return this.fuels.get(id);
  }

  async getFuelByCode(code: string): Promise<Fuel | undefined> {
    return Array.from(this.fuels.values()).find(
      (fuel) => fuel.code === code
    );
  }

  async getAllFuels(): Promise<Fuel[]> {
    return Array.from(this.fuels.values());
  }

  async createFuel(fuel: Partial<Fuel>): Promise<Fuel> {
    const id = randomUUID();
    const newFuel: Fuel = {
      id,
      code: fuel.code!,
      name: fuel.name!,
      lcvMjKg: fuel.lcvMjKg!,
      defaultTtwGco2eMj: fuel.defaultTtwGco2eMj!,
      defaultWttGco2eMj: fuel.defaultWttGco2eMj!,
      defaultCo2FactorT: fuel.defaultCo2FactorT!,
    };
    this.fuels.set(id, newFuel);
    return newFuel;
  }

  // Consumption methods
  async getConsumption(id: string): Promise<Consumption | undefined> {
    return this.consumptions.get(id);
  }

  async getConsumptionsByVoyage(voyageId: string): Promise<Consumption[]> {
    return Array.from(this.consumptions.values()).filter(
      (consumption) => consumption.voyageId === voyageId
    );
  }

  async createConsumption(consumption: Partial<Consumption>): Promise<Consumption> {
    const id = randomUUID();
    const newConsumption: Consumption = {
      id,
      voyageId: consumption.voyageId!,
      fuelId: consumption.fuelId!,
      massTonnes: consumption.massTonnes!,
      engineType: consumption.engineType || null,
      methaneSlipPct: consumption.methaneSlipPct || null,
      location: consumption.location!,
    };
    this.consumptions.set(id, newConsumption);
    return newConsumption;
  }

  // User preferences methods
  async getUserPreferences(userId: string): Promise<any> {
    return this.userPreferences.get(userId) || {
      userId,
      favorites: [],
      tags: {},
      viewMode: 'tiles',
      searchHistory: [],
      currency: 'EUR',
      language: 'en',
      timezone: 'UTC',
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

  async saveUserPreferences(userId: string, preferences: any): Promise<void> {
    this.userPreferences.set(userId, preferences);
  }
}

/**
 * Hybrid storage implementation that intelligently routes between
 * database and memory storage based on availability and data type
 */
class HybridStorage implements IStorage {
  private dbStorage: DatabaseStorage;
  private memStorage: MemStorage;
  private useDatabase: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds

  constructor() {
    this.dbStorage = new DatabaseStorage();
    this.memStorage = new MemStorage();
    // Don't check database availability immediately - let it be checked on first use
  }

  private async checkDatabaseAvailability(): Promise<void> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return;
    }

    this.lastHealthCheck = now;
    this.useDatabase = await this.dbStorage.isAvailable();
    
    if (this.useDatabase) {
      console.log('✅ Hybrid Storage: Using PostgreSQL database');
    } else {
      console.log('⚠️  Hybrid Storage: Database unavailable, using memory storage');
    }
  }

  // Determine which storage to use for persistent data
  private async getPersistentStorage(): Promise<IStorage> {
    await this.checkDatabaseAvailability();
    return this.useDatabase ? this.dbStorage : this.memStorage;
  }

  // Reference data (ports, fuels) - always try database first
  private async getReferenceStorage(): Promise<IStorage> {
    await this.checkDatabaseAvailability();
    return this.useDatabase ? this.dbStorage : this.memStorage;
  }

  // User methods - persistent data
  async getUser(id: string): Promise<User | undefined> {
    const storage = await this.getPersistentStorage();
    return storage.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const storage = await this.getPersistentStorage();
    return storage.getUserByUsername(username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const storage = await this.getPersistentStorage();
    return storage.getUserByEmail(email);
  }

  async createUser(userData: any): Promise<any> {
    const storage = await this.getPersistentStorage();
    
    // Map frontend user data to database schema
    const dbUser = {
      username: userData.username || userData.name,
      email: userData.email,
      password: userData.password,
      tenantId: userData.tenantId || 'demo'
    };
    
    const createdUser = await storage.createUser(dbUser);
    
    // Map back to frontend interface
    return {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.username,
      role: userData.role || 'emission_analyst',
      subscriptionTier: userData.subscriptionTier || 'professional',
      tenantId: createdUser.tenantId || 'demo',
      fleetIds: userData.fleetIds || [],
      vesselIds: userData.vesselIds || [],
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      createdAt: createdUser.createdAt instanceof Date ? createdUser.createdAt.toISOString() : new Date(createdUser.createdAt).toISOString(),
      updatedAt: createdUser.createdAt instanceof Date ? createdUser.createdAt.toISOString() : new Date(createdUser.createdAt).toISOString(),
      lastLoginAt: createdUser.lastLogin?.toISOString()
    };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const storage = await this.getPersistentStorage();
    return storage.updateUser(id, updates);
  }

  async deleteUser(id: string): Promise<boolean> {
    const storage = await this.getPersistentStorage();
    return storage.deleteUser(id);
  }

  async getAllUsers(): Promise<User[]> {
    const storage = await this.getPersistentStorage();
    return storage.getAllUsers();
  }

  // Tenant methods - persistent data
  async getTenant(id: string): Promise<Tenant | undefined> {
    const storage = await this.getPersistentStorage();
    return storage.getTenant(id);
  }

  async getAllTenants(): Promise<Tenant[]> {
    const storage = await this.getPersistentStorage();
    return storage.getAllTenants();
  }

  async getTenantsByUser(userId: string): Promise<Tenant[]> {
    const storage = await this.getPersistentStorage();
    return storage.getTenantsByUser(userId);
  }

  async createTenant(tenant: Partial<Tenant>): Promise<Tenant> {
    const storage = await this.getPersistentStorage();
    return storage.createTenant(tenant);
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | undefined> {
    const storage = await this.getPersistentStorage();
    return storage.updateTenant(id, updates);
  }

  // Organization methods - persistent data
  async getOrganization(id: string, tenantId: string): Promise<Organization | undefined> {
    const storage = await this.getPersistentStorage();
    return storage.getOrganization(id, tenantId);
  }

  async getOrganizationsByTenant(tenantId: string): Promise<Organization[]> {
    const storage = await this.getPersistentStorage();
    return storage.getOrganizationsByTenant(tenantId);
  }

  async createOrganization(org: Partial<Organization>): Promise<Organization> {
    const storage = await this.getPersistentStorage();
    return storage.createOrganization(org);
  }

  // Fleet methods - persistent data
  async getAllFleets(): Promise<Fleet[]> {
    const storage = await this.getPersistentStorage();
    return storage.getAllFleets();
  }

  async getFleet(id: string, tenantId: string): Promise<Fleet | undefined> {
    const storage = await this.getPersistentStorage();
    return storage.getFleet(id, tenantId);
  }

  async getFleetsByOrg(orgId: string, tenantId: string): Promise<Fleet[]> {
    const storage = await this.getPersistentStorage();
    return storage.getFleetsByOrg(orgId, tenantId);
  }

  async createFleet(fleet: Partial<Fleet>): Promise<Fleet> {
    const storage = await this.getPersistentStorage();
    return storage.createFleet(fleet);
  }

  async updateFleet(id: string, fleet: Partial<Fleet>): Promise<Fleet | undefined> {
    const storage = await this.getPersistentStorage();
    return storage.updateFleet(id, fleet);
  }

  async deleteFleet(id: string): Promise<boolean> {
    const storage = await this.getPersistentStorage();
    return storage.deleteFleet(id);
  }

  // User Role methods - persistent data
  async getUserRoles(userId: string, tenantId: string): Promise<UserRole[]> {
    const storage = await this.getPersistentStorage();
    return storage.getUserRoles(userId, tenantId);
  }

  async createUserRole(userRole: Partial<UserRole>): Promise<UserRole> {
    const storage = await this.getPersistentStorage();
    return storage.createUserRole(userRole);
  }

  async deleteUserRole(id: string, tenantId: string): Promise<boolean> {
    const storage = await this.getPersistentStorage();
    return storage.deleteUserRole(id, tenantId);
  }

  // Audit Log methods - persistent data
  async createAuditLog(log: Partial<AuditLog>): Promise<AuditLog> {
    const storage = await this.getPersistentStorage();
    return storage.createAuditLog(log);
  }

  async getAuditLogs(tenantId: string, filters?: AuditLogFilters): Promise<AuditLog[]> {
    const storage = await this.getPersistentStorage();
    return storage.getAuditLogs(tenantId, filters);
  }

  // Vessel methods - persistent data
  async getVessel(id: string, tenantId: string): Promise<Vessel | undefined> {
    const storage = await this.getPersistentStorage();
    return storage.getVessel(id, tenantId);
  }

  async getVesselsByTenant(tenantId: string): Promise<Vessel[]> {
    const storage = await this.getPersistentStorage();
    return storage.getVesselsByTenant(tenantId);
  }

  async getAllVessels(): Promise<Vessel[]> {
    const storage = await this.getPersistentStorage();
    return storage.getAllVessels();
  }

  async getVesselsByFleet(fleetId: string, tenantId: string): Promise<Vessel[]> {
    const storage = await this.getPersistentStorage();
    return storage.getVesselsByFleet(fleetId, tenantId);
  }

  async createVessel(vessel: Partial<Vessel>): Promise<Vessel> {
    const storage = await this.getPersistentStorage();
    return storage.createVessel(vessel);
  }

  async updateVessel(id: string, tenantId: string, updates: Partial<Vessel>): Promise<Vessel | undefined> {
    const storage = await this.getPersistentStorage();
    return storage.updateVessel(id, tenantId, updates);
  }

  // Voyage methods - persistent data
  async getVoyage(id: string, tenantId: string): Promise<Voyage | undefined> {
    const storage = await this.getPersistentStorage();
    return storage.getVoyage(id, tenantId);
  }

  async getVoyagesByVessel(vesselId: string, tenantId: string): Promise<Voyage[]> {
    const storage = await this.getPersistentStorage();
    return storage.getVoyagesByVessel(vesselId, tenantId);
  }

  async getVoyagesByTenant(tenantId: string): Promise<Voyage[]> {
    const storage = await this.getPersistentStorage();
    return storage.getVoyagesByTenant(tenantId);
  }

  async createVoyage(voyage: Partial<Voyage>): Promise<Voyage> {
    const storage = await this.getPersistentStorage();
    return storage.createVoyage(voyage);
  }

  // Port methods - reference data
  async getPort(id: string): Promise<Port | undefined> {
    const storage = await this.getReferenceStorage();
    return storage.getPort(id);
  }

  async getPortByUnlocode(unlocode: string): Promise<Port | undefined> {
    const storage = await this.getReferenceStorage();
    return storage.getPortByUnlocode(unlocode);
  }

  async getAllPorts(): Promise<Port[]> {
    const storage = await this.getReferenceStorage();
    return storage.getAllPorts();
  }

  async createPort(port: Partial<Port>): Promise<Port> {
    const storage = await this.getReferenceStorage();
    return storage.createPort(port);
  }

  // Fuel methods - reference data
  async getFuel(id: string): Promise<Fuel | undefined> {
    const storage = await this.getReferenceStorage();
    return storage.getFuel(id);
  }

  async getFuelByCode(code: string): Promise<Fuel | undefined> {
    const storage = await this.getReferenceStorage();
    return storage.getFuelByCode(code);
  }

  async getAllFuels(): Promise<Fuel[]> {
    const storage = await this.getReferenceStorage();
    return storage.getAllFuels();
  }

  async createFuel(fuel: Partial<Fuel>): Promise<Fuel> {
    const storage = await this.getReferenceStorage();
    return storage.createFuel(fuel);
  }

  // Consumption methods - persistent data
  async getConsumption(id: string): Promise<Consumption | undefined> {
    const storage = await this.getPersistentStorage();
    return storage.getConsumption(id);
  }

  async getConsumptionsByVoyage(voyageId: string): Promise<Consumption[]> {
    const storage = await this.getPersistentStorage();
    return storage.getConsumptionsByVoyage(voyageId);
  }

  async createConsumption(consumption: Partial<Consumption>): Promise<Consumption> {
    const storage = await this.getPersistentStorage();
    return storage.createConsumption(consumption);
  }

  // User preferences methods - persistent data
  async getUserPreferences(userId: string): Promise<any> {
    const storage = await this.getPersistentStorage();
    return storage.getUserPreferences(userId);
  }

  async saveUserPreferences(userId: string, preferences: any): Promise<void> {
    const storage = await this.getPersistentStorage();
    return storage.saveUserPreferences(userId, preferences);
  }
}

// Import DatabaseStorage directly to eliminate hybrid/memory fallback issues
import { DatabaseStorage } from './dbStorage';

export const storage = new DatabaseStorage();
