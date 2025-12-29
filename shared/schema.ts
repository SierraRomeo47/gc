import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, decimal, integer, boolean, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", [
  "admin",
  "fleet_manager",
  "commercial_manager",
  "emission_analyst",
  "tech_superintendent",
  "operations_manager",
  "compliance_officer"
]);

export const frameworkEnum = pgEnum("framework", [
  "FUELEU",
  "EU_ETS",
  "IMO",
  "UK_ETS"
]);

export const voyageTypeEnum = pgEnum("voyage_type", [
  "INTRA_EU",
  "EXTRA_EU",
  "UK_DOMESTIC",
  "OTHER"
]);

export const locationEnum = pgEnum("location", [
  "AT_SEA",
  "AT_BERTH",
  "MANEUVERING"
]);

export const runTypeEnum = pgEnum("run_type", [
  "STANDARD",
  "SCENARIO"
]);

export const statusEnum = pgEnum("status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "ERROR"
]);

// Multi-tenant core tables
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  settingsJson: jsonb("settings_json"),
});

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  parentOrgId: varchar("parent_org_id").references((): any => organizations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fleets = pgTable("fleets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenantid").references(() => tenants.id),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  mfaEnabled: boolean("mfa_enabled").default(false).notNull(),
  mfaSecret: text("mfa_secret"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("createdat").defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: roleEnum("role").notNull(),
  orgId: varchar("org_id").references(() => organizations.id),
  fleetId: varchar("fleet_id").references(() => fleets.id),
  grantedBy: varchar("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  status: statusEnum("status").default("ACTIVE").notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id").references(() => users.id),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id"),
  action: text("action").notNull(),
  oldValueJson: jsonb("old_value_json"),
  newValueJson: jsonb("new_value_json"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  requestId: varchar("request_id"),
});

// Maritime entities
export const ports = pgTable("ports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  unlocode: varchar("unlocode", { length: 10 }).notNull().unique(),
  name: text("name").notNull(),
  countryIso: varchar("country_iso", { length: 2 }).notNull(),
  isEu: boolean("is_eu").default(false).notNull(),
  isUk: boolean("is_uk").default(false).notNull(),
  isOmr: boolean("is_omr").default(false).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vessels = pgTable("vessels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  fleetId: varchar("fleet_id").references(() => fleets.id),
  imoNumber: varchar("imo_number", { length: 20 }).notNull(),
  name: text("name").notNull(),
  vesselType: text("vessel_type").notNull(),
  flagState: varchar("flag_state", { length: 2 }).notNull(),
  grossTonnage: integer("gross_tonnage").notNull(),
  deadweightTonnage: integer("deadweight_tonnage"),
  mainEngineType: text("main_engine_type"),
  iceClass: text("ice_class"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fuels = pgTable("fuels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  lcvMjKg: decimal("lcv_mj_kg", { precision: 10, scale: 4 }).notNull(),
  defaultTtwGco2eMj: decimal("default_ttw_gco2e_mj", { precision: 10, scale: 4 }).notNull(),
  defaultWttGco2eMj: decimal("default_wtt_gco2e_mj", { precision: 10, scale: 4 }).notNull(),
  defaultCo2FactorT: decimal("default_co2_factor_t", { precision: 10, scale: 4 }).notNull(),
});

export const voyages = pgTable("voyages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  vesselId: varchar("vessel_id").notNull().references(() => vessels.id),
  voyageNumber: text("voyage_number").notNull(),
  departurePortId: varchar("departure_port_id").notNull().references(() => ports.id),
  arrivalPortId: varchar("arrival_port_id").notNull().references(() => ports.id),
  departureAt: timestamp("departure_at").notNull(),
  arrivalAt: timestamp("arrival_at").notNull(),
  distanceNm: decimal("distance_nm", { precision: 10, scale: 2 }).notNull(),
  voyageType: voyageTypeEnum("voyage_type").notNull(),
  coverageEuPct: decimal("coverage_eu_pct", { precision: 3, scale: 2 }).notNull(),
  coverageUkPct: decimal("coverage_uk_pct", { precision: 3, scale: 2 }).notNull(),
  status: statusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const consumptions = pgTable("consumptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  voyageId: varchar("voyage_id").notNull().references(() => voyages.id),
  fuelId: varchar("fuel_id").notNull().references(() => fuels.id),
  massTonnes: decimal("mass_tonnes", { precision: 10, scale: 4 }).notNull(),
  engineType: text("engine_type"),
  methaneSlipPct: decimal("methane_slip_pct", { precision: 5, scale: 2 }),
  location: locationEnum("location").notNull(),
});

export const bdns = pgTable("bdns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  vesselId: varchar("vessel_id").notNull().references(() => vessels.id),
  fuelId: varchar("fuel_id").notNull().references(() => fuels.id),
  supplierName: text("supplier_name").notNull(),
  batchNumber: text("batch_number").notNull(),
  deliveryDate: timestamp("delivery_date").notNull(),
  deliveredMassTonnes: decimal("delivered_mass_tonnes", { precision: 10, scale: 4 }).notNull(),
  lcvMjKgActual: decimal("lcv_mj_kg_actual", { precision: 10, scale: 4 }),
  wttSource: text("wtt_source"),
  wttGco2eMjActual: decimal("wtt_gco2e_mj_actual", { precision: 10, scale: 4 }),
  documentUrl: text("document_url"),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const opsSessions = pgTable("ops_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  vesselId: varchar("vessel_id").notNull().references(() => vessels.id),
  portId: varchar("port_id").notNull().references(() => ports.id),
  sessionDate: timestamp("session_date").notNull(),
  kwhSupplied: decimal("kwh_supplied", { precision: 10, scale: 2 }).notNull(),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  isMandatoryPort: boolean("is_mandatory_port").default(false).notNull(),
  verified: boolean("verified").default(false).notNull(),
});

export const voyageSegments = pgTable("voyage_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  voyageId: varchar("voyage_id").notNull().references(() => voyages.id),
  segmentOrder: integer("segment_order").notNull(),
  startPortId: varchar("start_port_id").notNull().references(() => ports.id),
  endPortId: varchar("end_port_id").notNull().references(() => ports.id),
  isEuWaters: boolean("is_eu_waters").default(false).notNull(),
  coverageCoefficient: decimal("coverage_coefficient", { precision: 3, scale: 2 }).notNull(),
  distanceNm: decimal("distance_nm", { precision: 10, scale: 2 }).notNull(),
});

// Regulatory constants and formulas
export const regulatoryConstants = pgTable("regulatory_constants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  constantKey: text("constant_key").notNull(),
  framework: frameworkEnum("framework").notNull(),
  valueJson: jsonb("value_json").notNull(),
  effectiveFrom: timestamp("effective_from").notNull(),
  effectiveTo: timestamp("effective_to"),
  version: text("version").notNull(),
  sourceRegulation: text("source_regulation"),
  sourceUrl: text("source_url"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calculationFormulas = pgTable("calculation_formulas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formulaKey: text("formula_key").notNull(),
  framework: frameworkEnum("framework").notNull(),
  formulaExpression: text("formula_expression").notNull(),
  description: text("description"),
  variablesSchemaJson: jsonb("variables_schema_json"),
  locked: boolean("locked").default(false).notNull(),
  version: text("version").notNull(),
  effectiveFrom: timestamp("effective_from").notNull(),
  effectiveTo: timestamp("effective_to"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calcRuns = pgTable("calc_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  runType: runTypeEnum("run_type").notNull(),
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at"),
  constantsVersionId: varchar("constants_version_id"),
  formulasVersionId: varchar("formulas_version_id"),
  inputHash: text("input_hash").notNull(),
  outputSummaryJson: jsonb("output_summary_json"),
  status: statusEnum("status").default("PENDING").notNull(),
  errorMessage: text("error_message"),
});

// Scenario planning
export const scenarios = pgTable("scenarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  baselineCalcRunId: varchar("baseline_calc_run_id").references(() => calcRuns.id),
  paramsJson: jsonb("params_json").notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scenarioResults = pgTable("scenario_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scenarioId: varchar("scenario_id").notNull().references(() => scenarios.id),
  framework: frameworkEnum("framework").notNull(),
  year: integer("year").notNull(),
  allowancesRequired: decimal("allowances_required", { precision: 15, scale: 4 }),
  penalties: decimal("penalties", { precision: 15, scale: 2 }),
  costEstimate: decimal("cost_estimate", { precision: 15, scale: 2 }),
  deltaVsBaseline: decimal("delta_vs_baseline", { precision: 15, scale: 2 }),
});

// User Access Control Tables
export const userFleetAccess = pgTable("user_fleet_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fleetId: varchar("fleet_id").notNull().references(() => fleets.id, { onDelete: "cascade" }),
  grantedBy: varchar("granted_by").notNull().references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint on user-fleet combination
  userFleetUnique: unique("user_fleet_access_user_fleet_unique").on(table.userId, table.fleetId),
}));

export const userVesselAccess = pgTable("user_vessel_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vesselId: varchar("vessel_id").notNull().references(() => vessels.id, { onDelete: "cascade" }),
  grantedBy: varchar("granted_by").notNull().references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint on user-vessel combination
  userVesselUnique: unique("user_vessel_access_user_vessel_unique").on(table.userId, table.vesselId),
}));

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  preferencesJson: jsonb("preferences_json").notNull().default({}),
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  tenantId: true,
  firstName: true,
  lastName: true,
});

export const insertTenantSchema = createInsertSchema(tenants).pick({
  name: true,
  settingsJson: true,
});

export const insertVesselSchema = createInsertSchema(vessels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVoyageSchema = createInsertSchema(voyages).omit({
  id: true,
  createdAt: true,
});

// Zod schemas for user access control validation
export const insertUserFleetAccessSchema = createInsertSchema(userFleetAccess).pick({
  userId: true,
  fleetId: true,
  grantedBy: true,
  expiresAt: true,
});

export const insertUserVesselAccessSchema = createInsertSchema(userVesselAccess).pick({
  userId: true,
  vesselId: true,
  grantedBy: true,
  expiresAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  preferencesJson: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Fleet = typeof fleets.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Port = typeof ports.$inferSelect;
export type Vessel = typeof vessels.$inferSelect;
export type Fuel = typeof fuels.$inferSelect;
export type Voyage = typeof voyages.$inferSelect;
export type Consumption = typeof consumptions.$inferSelect;
export type BDN = typeof bdns.$inferSelect;
export type OPSSession = typeof opsSessions.$inferSelect;
export type VoyageSegment = typeof voyageSegments.$inferSelect;
export type RegulatoryConstant = typeof regulatoryConstants.$inferSelect;
export type CalculationFormula = typeof calculationFormulas.$inferSelect;
export type CalcRun = typeof calcRuns.$inferSelect;
export type Scenario = typeof scenarios.$inferSelect;
export type ScenarioResult = typeof scenarioResults.$inferSelect;

// User Access Control Types
export type UserFleetAccess = typeof userFleetAccess.$inferSelect;
export type UserVesselAccess = typeof userVesselAccess.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserFleetAccess = z.infer<typeof insertUserFleetAccessSchema>;
export type InsertUserVesselAccess = z.infer<typeof insertUserVesselAccessSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

// User Preferences Interface
export interface UserPreferencesData {
  userId: string;
  favorites: string[]; // Array of vessel IDs
  tags: Record<string, string[]>; // vesselId -> array of tag names
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

// Re-export types from viewModels for convenience
export type {
  UserViewModel,
  VesselViewModel,
  FleetViewModel,
  OrganizationViewModel,
  TenantViewModel,
  PortViewModel,
  FuelViewModel,
  VoyageViewModel,
  UserAccessInfo,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
  PaginatedResponse,
} from './viewModels';

export { SubscriptionTier, SUBSCRIPTION_FEATURES, SUBSCRIPTION_DISPLAY_NAMES } from './viewModels';
