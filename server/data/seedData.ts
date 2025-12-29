import { storage } from "../storage";
import bcrypt from "bcrypt";

/**
 * Comprehensive seed data for the GHGConnect application
 * Including: ports, fuels, tenants, users, organizations, fleets, vessels, voyages, and consumptions
 */

// Major EU and UK ports with UN/LOCODE
const PORTS_DATA = [
  // Netherlands
  { unlocode: "NLRTM", name: "Rotterdam", countryIso: "NL", isEu: true, isUk: false, isOmr: false, latitude: "51.9225", longitude: "4.4792" },
  { unlocode: "NLAMS", name: "Amsterdam", countryIso: "NL", isEu: true, isUk: false, isOmr: false, latitude: "52.3676", longitude: "4.9041" },
  
  // Belgium
  { unlocode: "BEANR", name: "Antwerp", countryIso: "BE", isEu: true, isUk: false, isOmr: false, latitude: "51.2194", longitude: "4.4025" },
  { unlocode: "BEZEE", name: "Zeebrugge", countryIso: "BE", isEu: true, isUk: false, isOmr: false, latitude: "51.3333", longitude: "3.2000" },
  
  // Germany
  { unlocode: "DEHAM", name: "Hamburg", countryIso: "DE", isEu: true, isUk: false, isOmr: false, latitude: "53.5511", longitude: "9.9937" },
  { unlocode: "DEBRV", name: "Bremerhaven", countryIso: "DE", isEu: true, isUk: false, isOmr: false, latitude: "53.5396", longitude: "8.5809" },
  
  // France
  { unlocode: "FRLEH", name: "Le Havre", countryIso: "FR", isEu: true, isUk: false, isOmr: false, latitude: "49.4944", longitude: "0.1079" },
  { unlocode: "FRMRS", name: "Marseille", countryIso: "FR", isEu: true, isUk: false, isOmr: false, latitude: "43.2965", longitude: "5.3698" },
  
  // Spain
  { unlocode: "ESVLC", name: "Valencia", countryIso: "ES", isEu: true, isUk: false, isOmr: false, latitude: "39.4699", longitude: "-0.3763" },
  { unlocode: "ESALG", name: "Algeciras", countryIso: "ES", isEu: true, isUk: false, isOmr: false, latitude: "36.1408", longitude: "-5.4500" },
  { unlocode: "ESBCN", name: "Barcelona", countryIso: "ES", isEu: true, isUk: false, isOmr: false, latitude: "41.3851", longitude: "2.1734" },
  
  // Italy
  { unlocode: "ITGOA", name: "Genoa", countryIso: "IT", isEu: true, isUk: false, isOmr: false, latitude: "44.4056", longitude: "8.9463" },
  { unlocode: "ITNAP", name: "Naples", countryIso: "IT", isEu: true, isUk: false, isOmr: false, latitude: "40.8518", longitude: "14.2681" },
  
  // Greece
  { unlocode: "GRPIR", name: "Piraeus", countryIso: "GR", isEu: true, isUk: false, isOmr: false, latitude: "37.9483", longitude: "23.6451" },
  
  // United Kingdom
  { unlocode: "GBLGP", name: "London Gateway", countryIso: "GB", isEu: false, isUk: true, isOmr: false, latitude: "51.5074", longitude: "-0.1278" },
  { unlocode: "GBFXT", name: "Felixstowe", countryIso: "GB", isEu: false, isUk: true, isOmr: false, latitude: "51.9540", longitude: "1.3483" },
  { unlocode: "GBSOU", name: "Southampton", countryIso: "GB", isEu: false, isUk: true, isOmr: false, latitude: "50.9097", longitude: "-1.4044" },
  { unlocode: "GBLIV", name: "Liverpool", countryIso: "GB", isEu: false, isUk: true, isOmr: false, latitude: "53.4084", longitude: "-2.9916" },
  
  // Poland
  { unlocode: "PLGDY", name: "Gdynia", countryIso: "PL", isEu: true, isUk: false, isOmr: false, latitude: "54.5189", longitude: "18.5305" },
  { unlocode: "PLGDN", name: "Gdansk", countryIso: "PL", isEu: true, isUk: false, isOmr: false, latitude: "54.3520", longitude: "18.6466" },
  
  // Sweden
  { unlocode: "SEGOT", name: "Gothenburg", countryIso: "SE", isEu: true, isUk: false, isOmr: false, latitude: "57.7089", longitude: "11.9746" },
  
  // Denmark
  { unlocode: "DKAAR", name: "Aarhus", countryIso: "DK", isEu: true, isUk: false, isOmr: false, latitude: "56.1629", longitude: "10.2039" },
  
  // Finland
  { unlocode: "FIHEL", name: "Helsinki", countryIso: "FI", isEu: true, isUk: false, isOmr: false, latitude: "60.1695", longitude: "24.9354" },
  
  // Portugal
  { unlocode: "PTLIS", name: "Lisbon", countryIso: "PT", isEu: true, isUk: false, isOmr: false, latitude: "38.7223", longitude: "-9.1393" },
  { unlocode: "PTSIE", name: "Sines", countryIso: "PT", isEu: true, isUk: false, isOmr: false, latitude: "37.9556", longitude: "-8.8686" },
  
  // EU Outermost Regions (OMR) ports
  { unlocode: "ESLPA", name: "Las Palmas (Canary Islands)", countryIso: "ES", isEu: true, isUk: false, isOmr: true, latitude: "28.1235", longitude: "-15.4363" },
  { unlocode: "ESTCI", name: "Santa Cruz de Tenerife", countryIso: "ES", isEu: true, isUk: false, isOmr: true, latitude: "28.4636", longitude: "-16.2518" },
  { unlocode: "PTFNC", name: "Funchal (Madeira)", countryIso: "PT", isEu: true, isUk: false, isOmr: true, latitude: "32.6669", longitude: "-16.9241" },
  { unlocode: "PTPDL", name: "Ponta Delgada (Azores)", countryIso: "PT", isEu: true, isUk: false, isOmr: true, latitude: "37.7412", longitude: "-25.6756" },
  { unlocode: "FRMTQ", name: "Fort-de-France (Martinique)", countryIso: "FR", isEu: true, isUk: false, isOmr: true, latitude: "14.6037", longitude: "-61.0666" },
  { unlocode: "FRGPE", name: "Pointe-à-Pitre (Guadeloupe)", countryIso: "FR", isEu: true, isUk: false, isOmr: true, latitude: "16.2414", longitude: "-61.5331" },
  { unlocode: "FRREU", name: "Port de la Pointe des Galets (Reunion)", countryIso: "FR", isEu: true, isUk: false, isOmr: true, latitude: "-20.9241", longitude: "55.2919" },
  { unlocode: "FRCAY", name: "Cayenne (French Guiana)", countryIso: "FR", isEu: true, isUk: false, isOmr: true, latitude: "4.9222", longitude: "-52.3131" },
  
  // Non-EU major ports
  { unlocode: "USNYC", name: "New York", countryIso: "US", isEu: false, isUk: false, isOmr: false, latitude: "40.7128", longitude: "-74.0060" },
  { unlocode: "USLAX", name: "Los Angeles", countryIso: "US", isEu: false, isUk: false, isOmr: false, latitude: "33.7701", longitude: "-118.1937" },
  { unlocode: "SGSIN", name: "Singapore", countryIso: "SG", isEu: false, isUk: false, isOmr: false, latitude: "1.2904", longitude: "103.8520" },
  { unlocode: "CNSHA", name: "Shanghai", countryIso: "CN", isEu: false, isUk: false, isOmr: false, latitude: "31.2304", longitude: "121.4737" },
  { unlocode: "HKHKG", name: "Hong Kong", countryIso: "HK", isEu: false, isUk: false, isOmr: false, latitude: "22.3193", longitude: "114.1694" },
  { unlocode: "AEJEA", name: "Jebel Ali", countryIso: "AE", isEu: false, isUk: false, isOmr: false, latitude: "25.0121", longitude: "55.1387" },
];

// Standard fuel types with emission factors
const FUELS_DATA = [
  {
    code: "HFO",
    name: "Heavy Fuel Oil",
    lcvMjKg: "40.2",
    defaultTtwGco2eMj: "77.4",
    defaultWttGco2eMj: "13.76",
    defaultCo2FactorT: "3.114",
  },
  {
    code: "VLSFO",
    name: "Very Low Sulphur Fuel Oil",
    lcvMjKg: "40.5",
    defaultTtwGco2eMj: "77.4",
    defaultWttGco2eMj: "13.76",
    defaultCo2FactorT: "3.151",
  },
  {
    code: "MGO",
    name: "Marine Gas Oil",
    lcvMjKg: "42.7",
    defaultTtwGco2eMj: "74.1",
    defaultWttGco2eMj: "13.4",
    defaultCo2FactorT: "3.206",
  },
  {
    code: "MDO",
    name: "Marine Diesel Oil",
    lcvMjKg: "42.7",
    defaultTtwGco2eMj: "74.1",
    defaultWttGco2eMj: "13.4",
    defaultCo2FactorT: "3.206",
  },
  {
    code: "LNG",
    name: "Liquefied Natural Gas",
    lcvMjKg: "48.0",
    defaultTtwGco2eMj: "56.9",
    defaultWttGco2eMj: "11.5",
    defaultCo2FactorT: "2.750",
  },
  {
    code: "LPG_PROP",
    name: "LPG Propane",
    lcvMjKg: "46.3",
    defaultTtwGco2eMj: "64.9",
    defaultWttGco2eMj: "8.9",
    defaultCo2FactorT: "3.000",
  },
  {
    code: "LPG_BUT",
    name: "LPG Butane",
    lcvMjKg: "45.7",
    defaultTtwGco2eMj: "66.7",
    defaultWttGco2eMj: "10.0",
    defaultCo2FactorT: "3.030",
  },
  {
    code: "METHANOL",
    name: "Methanol",
    lcvMjKg: "19.9",
    defaultTtwGco2eMj: "68.9",
    defaultWttGco2eMj: "14.5",
    defaultCo2FactorT: "1.375",
  },
  {
    code: "E_METHANOL",
    name: "e-Methanol (RFNBO)",
    lcvMjKg: "19.9",
    defaultTtwGco2eMj: "31.5",
    defaultWttGco2eMj: "3.9",
    defaultCo2FactorT: "1.375",
  },
  {
    code: "ETHANOL",
    name: "Ethanol",
    lcvMjKg: "26.8",
    defaultTtwGco2eMj: "68.9",
    defaultWttGco2eMj: "15.9",
    defaultCo2FactorT: "1.913",
  },
  {
    code: "BIO_LNG",
    name: "Bio-LNG",
    lcvMjKg: "48.0",
    defaultTtwGco2eMj: "29.0",
    defaultWttGco2eMj: "16.3",
    defaultCo2FactorT: "2.750",
  },
  {
    code: "BIO_METHANOL",
    name: "Bio-Methanol",
    lcvMjKg: "19.9",
    defaultTtwGco2eMj: "36.4",
    defaultWttGco2eMj: "14.5",
    defaultCo2FactorT: "1.375",
  },
  {
    code: "AMMONIA",
    name: "Ammonia",
    lcvMjKg: "18.6",
    defaultTtwGco2eMj: "0.0",
    defaultWttGco2eMj: "91.0",
    defaultCo2FactorT: "0.000",
  },
  {
    code: "E_AMMONIA",
    name: "e-Ammonia (RFNBO)",
    lcvMjKg: "18.6",
    defaultTtwGco2eMj: "0.0",
    defaultWttGco2eMj: "28.7",
    defaultCo2FactorT: "0.000",
  },
  {
    code: "HYDROGEN",
    name: "Hydrogen",
    lcvMjKg: "120.0",
    defaultTtwGco2eMj: "0.0",
    defaultWttGco2eMj: "113.8",
    defaultCo2FactorT: "0.000",
  },
  {
    code: "E_HYDROGEN",
    name: "e-Hydrogen (RFNBO)",
    lcvMjKg: "120.0",
    defaultTtwGco2eMj: "0.0",
    defaultWttGco2eMj: "9.4",
    defaultCo2FactorT: "0.000",
  },
];

/**
 * Seed all reference data
 */
export async function seedReferenceData(): Promise<void> {
  console.log("Starting comprehensive data seeding...");

  // Seed ports
  console.log(`\nSeeding ${PORTS_DATA.length} ports...`);
  const portMap: Record<string, any> = {};
  for (const portData of PORTS_DATA) {
    try {
      const existing = await storage.getPortByUnlocode(portData.unlocode);
      if (!existing) {
        const port = await storage.createPort(portData);
        portMap[portData.unlocode] = port;
        console.log(`✓ Created port: ${portData.name} (${portData.unlocode})`);
      } else {
        portMap[portData.unlocode] = existing;
        console.log(`- Port already exists: ${portData.name} (${portData.unlocode})`);
      }
    } catch (error) {
      console.error(`✗ Failed to create port ${portData.unlocode}:`, error);
    }
  }

  // Seed fuels
  console.log(`\nSeeding ${FUELS_DATA.length} fuel types...`);
  const fuelMap: Record<string, any> = {};
  for (const fuelData of FUELS_DATA) {
    try {
      const existing = await storage.getFuelByCode(fuelData.code);
      if (!existing) {
        const fuel = await storage.createFuel(fuelData);
        fuelMap[fuelData.code] = fuel;
        console.log(`✓ Created fuel: ${fuelData.name} (${fuelData.code})`);
      } else {
        fuelMap[fuelData.code] = existing;
        console.log(`- Fuel already exists: ${fuelData.name} (${fuelData.code})`);
      }
    } catch (error) {
      console.error(`✗ Failed to create fuel ${fuelData.code}:`, error);
    }
  }

  // Seed tenants
  console.log(`\nSeeding tenants...`);
  const tenant = await storage.createTenant({
    name: "Global Shipping Corporation",
    settingsJson: {
      currency: "EUR",
      timezone: "Europe/London",
      frameworks: ["FUELEU", "EU_ETS", "IMO", "UK_ETS"]
    }
  });
  console.log(`✓ Created tenant: ${tenant.name}`);

  // Seed users
  console.log(`\nSeeding users...`);
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const users = [];
  
  const adminUser = await storage.createUser({
    username: "admin",
    email: "admin@ghgconnect.com",
    password: hashedPassword,
    tenantId: tenant.id,
  });
  users.push(adminUser);
  console.log(`✓ Created user: ${adminUser.username} (admin@ghgconnect.com)`);

  const complianceUser = await storage.createUser({
    username: "compliance",
    email: "compliance@ghgconnect.com",
    password: hashedPassword,
    tenantId: tenant.id,
  });
  users.push(complianceUser);
  console.log(`✓ Created user: ${complianceUser.username} (compliance@ghgconnect.com)`);

  // Add more sample users for testing
  const fleetManagerUser = await storage.createUser({
    username: "fleetmanager",
    email: "fleetmanager@ghgconnect.com",
    password: hashedPassword,
    tenantId: tenant.id,
  });
  users.push(fleetManagerUser);
  console.log(`✓ Created user: ${fleetManagerUser.username} (fleetmanager@ghgconnect.com)`);

  const emissionAnalystUser = await storage.createUser({
    username: "analyst",
    email: "analyst@ghgconnect.com",
    password: hashedPassword,
    tenantId: tenant.id,
  });
  users.push(emissionAnalystUser);
  console.log(`✓ Created user: ${emissionAnalystUser.username} (analyst@ghgconnect.com)`);

  const commercialManagerUser = await storage.createUser({
    username: "commercial",
    email: "commercial@ghgconnect.com",
    password: hashedPassword,
    tenantId: tenant.id,
  });
  users.push(commercialManagerUser);
  console.log(`✓ Created user: ${commercialManagerUser.username} (commercial@ghgconnect.com)`);

  const techSuperintendentUser = await storage.createUser({
    username: "techsuper",
    email: "techsuper@ghgconnect.com",
    password: hashedPassword,
    tenantId: tenant.id,
  });
  users.push(techSuperintendentUser);
  console.log(`✓ Created user: ${techSuperintendentUser.username} (techsuper@ghgconnect.com)`);

  // Seed user roles
  console.log(`\nSeeding user roles...`);
  await storage.createUserRole({
    userId: adminUser.id,
    tenantId: tenant.id,
    role: "admin",
  });
  console.log(`✓ Assigned ADMIN role to ${adminUser.username}`);

  await storage.createUserRole({
    userId: complianceUser.id,
    tenantId: tenant.id,
    role: "compliance_officer",
  });
  console.log(`✓ Assigned COMPLIANCE_OFFICER role to ${complianceUser.username}`);

  await storage.createUserRole({
    userId: fleetManagerUser.id,
    tenantId: tenant.id,
    role: "fleet_manager",
  });
  console.log(`✓ Assigned FLEET_MANAGER role to ${fleetManagerUser.username}`);

  await storage.createUserRole({
    userId: emissionAnalystUser.id,
    tenantId: tenant.id,
    role: "emission_analyst",
  });
  console.log(`✓ Assigned EMISSION_ANALYST role to ${emissionAnalystUser.username}`);

  await storage.createUserRole({
    userId: commercialManagerUser.id,
    tenantId: tenant.id,
    role: "commercial_manager",
  });
  console.log(`✓ Assigned COMMERCIAL_MANAGER role to ${commercialManagerUser.username}`);

  await storage.createUserRole({
    userId: techSuperintendentUser.id,
    tenantId: tenant.id,
    role: "tech_superintendent",
  });
  console.log(`✓ Assigned TECH_SUPERINTENDENT role to ${techSuperintendentUser.username}`);

  // Seed organization
  console.log(`\nSeeding organization...`);
  const org = await storage.createOrganization({
    tenantId: tenant.id,
    name: "Fleet Operations Division",
  });
  console.log(`✓ Created organization: ${org.name}`);

  // Seed fleet
  console.log(`\nSeeding fleet...`);
  const fleet = await storage.createFleet({
    orgId: org.id,
    name: "European Trade Fleet",
    description: "Container and bulk carrier fleet operating in European waters"
  });
  console.log(`✓ Created fleet: ${fleet.name}`);

  // Seed vessels
  console.log(`\nSeeding vessels...`);
  const vessels = [];
  const vesselData = [
    // Original vessels
    {
      name: "MV Atlantic Pioneer",
      imoNumber: "IMO9876543",
      vesselType: "Container Ship",
      flagState: "NL",
      grossTonnage: 50000,
      deadweightTonnage: 65000,
      mainEngineType: "Diesel",
      iceClass: null
    },
    {
      name: "MV Nordic Explorer",
      imoNumber: "IMO9876544",
      vesselType: "Bulk Carrier",
      flagState: "NO",
      grossTonnage: 45000,
      deadweightTonnage: 58000,
      mainEngineType: "Diesel",
      iceClass: null
    },
    {
      name: "MV Baltic Star",
      imoNumber: "IMO9876545",
      vesselType: "Tanker",
      flagState: "DK",
      grossTonnage: 55000,
      deadweightTonnage: 72000,
      mainEngineType: "Diesel",
      iceClass: null
    },
    {
      name: "MV Mediterranean Express",
      imoNumber: "IMO9876546",
      vesselType: "Container Ship",
      flagState: "IT",
      grossTonnage: 48000,
      deadweightTonnage: 62000,
      mainEngineType: "LNG Dual-Fuel",
      iceClass: null
    },
    {
      name: "MV Thames Voyager",
      imoNumber: "IMO9876547",
      vesselType: "Ro-Ro Cargo",
      flagState: "GB",
      grossTonnage: 35000,
      deadweightTonnage: 42000,
      mainEngineType: "Diesel",
      iceClass: null
    },
    
    // Ice Class Tankers (Arctic/Baltic operations)
    {
      name: "MT Arctic Guardian",
      imoNumber: "IMO9876548",
      vesselType: "Tanker",
      flagState: "FI",
      grossTonnage: 68000,
      deadweightTonnage: 85000,
      mainEngineType: "Diesel",
      iceClass: "1A Super"
    },
    {
      name: "MT Polar Navigator",
      imoNumber: "IMO9876549",
      vesselType: "Tanker",
      flagState: "NO",
      grossTonnage: 72000,
      deadweightTonnage: 92000,
      mainEngineType: "Diesel",
      iceClass: "1A"
    },
    {
      name: "MT Baltic Ice",
      imoNumber: "IMO9876550",
      vesselType: "Tanker",
      flagState: "SE",
      grossTonnage: 65000,
      deadweightTonnage: 81000,
      mainEngineType: "Diesel",
      iceClass: "1A Super"
    },
    {
      name: "MT Northern Frost",
      imoNumber: "IMO9876551",
      vesselType: "Tanker",
      flagState: "DK",
      grossTonnage: 70000,
      deadweightTonnage: 88000,
      mainEngineType: "LNG Dual-Fuel",
      iceClass: "1A"
    },
    
    // Intra-EU Specialized Vessels
    {
      name: "MV Europa Link",
      imoNumber: "IMO9876552",
      vesselType: "Ro-Ro Passenger",
      flagState: "DE",
      grossTonnage: 42000,
      deadweightTonnage: 12000,
      mainEngineType: "Diesel",
      iceClass: null
    },
    {
      name: "MV Coastal Trader",
      imoNumber: "IMO9876553",
      vesselType: "General Cargo",
      flagState: "NL",
      grossTonnage: 28000,
      deadweightTonnage: 35000,
      mainEngineType: "Diesel",
      iceClass: null
    },
    {
      name: "MV Baltic Express",
      imoNumber: "IMO9876554",
      vesselType: "Container Ship",
      flagState: "PL",
      grossTonnage: 38000,
      deadweightTonnage: 48000,
      mainEngineType: "Diesel",
      iceClass: "1C"
    },
    {
      name: "MV Adriatic Star",
      imoNumber: "IMO9876555",
      vesselType: "Ro-Ro Cargo",
      flagState: "IT",
      grossTonnage: 32000,
      deadweightTonnage: 38000,
      mainEngineType: "LNG Dual-Fuel",
      iceClass: null
    },
    {
      name: "MV Celtic Pride",
      imoNumber: "IMO9876556",
      vesselType: "Ro-Ro Passenger",
      flagState: "GB",
      grossTonnage: 46000,
      deadweightTonnage: 14000,
      mainEngineType: "Diesel",
      iceClass: null
    },
    
    // OMR (Outermost Regions) Specialized Vessels
    {
      name: "MV Canary Islander",
      imoNumber: "IMO9876557",
      vesselType: "Container Ship",
      flagState: "ES",
      grossTonnage: 35000,
      deadweightTonnage: 44000,
      mainEngineType: "Diesel",
      iceClass: null
    },
    {
      name: "MV Azores Connector",
      imoNumber: "IMO9876558",
      vesselType: "General Cargo",
      flagState: "PT",
      grossTonnage: 29000,
      deadweightTonnage: 36000,
      mainEngineType: "Diesel",
      iceClass: null
    },
    {
      name: "MV Madeira Express",
      imoNumber: "IMO9876559",
      vesselType: "Container Ship",
      flagState: "PT",
      grossTonnage: 33000,
      deadweightTonnage: 41000,
      mainEngineType: "Diesel",
      iceClass: null
    },
    {
      name: "MV Martinique Trader",
      imoNumber: "IMO9876560",
      vesselType: "Container Ship",
      flagState: "FR",
      grossTonnage: 31000,
      deadweightTonnage: 39000,
      mainEngineType: "Diesel",
      iceClass: null
    },
    {
      name: "MV Reunion Link",
      imoNumber: "IMO9876561",
      vesselType: "General Cargo",
      flagState: "FR",
      grossTonnage: 27000,
      deadweightTonnage: 34000,
      mainEngineType: "Diesel",
      iceClass: null
    },
    
    // Advanced Technology Vessels
    {
      name: "MV Green Pioneer",
      imoNumber: "IMO9876562",
      vesselType: "Container Ship",
      flagState: "DK",
      grossTonnage: 52000,
      deadweightTonnage: 68000,
      mainEngineType: "Methanol Dual-Fuel",
      iceClass: null
    },
    {
      name: "MV Hydrogen Explorer",
      imoNumber: "IMO9876563",
      vesselType: "Tanker",
      flagState: "NO",
      grossTonnage: 48000,
      deadweightTonnage: 62000,
      mainEngineType: "Hydrogen",
      iceClass: null
    },
    {
      name: "MV Electric Horizon",
      imoNumber: "IMO9876564",
      vesselType: "Ro-Ro Cargo",
      flagState: "SE",
      grossTonnage: 25000,
      deadweightTonnage: 8000,
      mainEngineType: "Battery-Electric",
      iceClass: null
    },
    
    // Large International Vessels
    {
      name: "MV Global Titan",
      imoNumber: "IMO9876565",
      vesselType: "Container Ship",
      flagState: "MT",
      grossTonnage: 98000,
      deadweightTonnage: 125000,
      mainEngineType: "Diesel",
      iceClass: null
    },
    {
      name: "MV Ocean Voyager",
      imoNumber: "IMO9876566",
      vesselType: "Bulk Carrier",
      flagState: "CY",
      grossTonnage: 85000,
      deadweightTonnage: 110000,
      mainEngineType: "Diesel",
      iceClass: null
    },
    {
      name: "MT Mediterranean Pride",
      imoNumber: "IMO9876567",
      vesselType: "Tanker",
      flagState: "GR",
      grossTonnage: 92000,
      deadweightTonnage: 118000,
      mainEngineType: "Diesel",
      iceClass: null
    },
    {
      name: "MV North Sea Trader",
      imoNumber: "IMO9876568",
      vesselType: "General Cargo",
      flagState: "BE",
      grossTonnage: 38000,
      deadweightTonnage: 47000,
      mainEngineType: "LNG Dual-Fuel",
      iceClass: null
    }
  ];

  for (const vesselInfo of vesselData) {
    const vessel = await storage.createVessel({
      tenantId: tenant.id,
      fleetId: fleet.id,
      ...vesselInfo
    });
    vessels.push(vessel);
    console.log(`✓ Created vessel: ${vessel.name} (${vessel.imoNumber})`);
  }

  // Seed voyages and consumptions
  console.log(`\nSeeding voyages and consumptions...`);
  let voyageCount = 0;
  let consumptionCount = 0;

  // Define voyage routes (diverse scenarios)
  const routes = [
    // Intra-EU Core routes
    { from: "NLRTM", to: "DEHAM", type: "INTRA_EU", distance: 250, description: "Short sea shipping" },
    { from: "DEHAM", to: "GBLGP", type: "INTRA_EU", distance: 400, description: "North Sea crossing" },
    { from: "GBLGP", to: "FRLEH", type: "INTRA_EU", distance: 180, description: "Channel trade" },
    { from: "FRLEH", to: "ESVLC", type: "INTRA_EU", distance: 900, description: "Atlantic to Mediterranean" },
    { from: "ESVLC", to: "ITGOA", type: "INTRA_EU", distance: 650, description: "Mediterranean trade" },
    { from: "ITGOA", to: "GRPIR", type: "INTRA_EU", distance: 850, description: "East Mediterranean" },
    { from: "GRPIR", to: "NLRTM", type: "INTRA_EU", distance: 1400, description: "Return to hub" },
    { from: "BEANR", to: "NLRTM", type: "INTRA_EU", distance: 120, description: "Benelux corridor" },
    { from: "DEBRV", to: "GBSOU", type: "INTRA_EU", distance: 420, description: "German-UK trade" },
    { from: "SEGOT", to: "PLGDN", type: "INTRA_EU", distance: 350, description: "Baltic Sea route" },
    { from: "DKAAR", to: "FIHEL", type: "INTRA_EU", distance: 580, description: "Nordic connection" },
    
    // OMR to OMR routes (Outermost Regions)
    { from: "ESLPA", to: "ESTCI", type: "INTRA_EU", distance: 150, description: "Canary Islands inter-island" },
    { from: "PTFNC", to: "PTPDL", type: "INTRA_EU", distance: 550, description: "Portuguese Atlantic islands" },
    { from: "FRMTQ", to: "FRGPE", type: "INTRA_EU", distance: 120, description: "Caribbean OMR link" },
    { from: "ESLPA", to: "FRMTQ", type: "INTRA_EU", distance: 2200, description: "Atlantic OMR crossing" },
    
    // EU to OMR routes
    { from: "ESVLC", to: "ESLPA", type: "INTRA_EU", distance: 850, description: "Mainland to Canaries" },
    { from: "PTLIS", to: "PTFNC", type: "INTRA_EU", distance: 520, description: "Portugal to Madeira" },
    { from: "FRLEH", to: "FRMTQ", type: "INTRA_EU", distance: 4200, description: "France to Caribbean OMR" },
    { from: "FRMRS", to: "FRREU", type: "INTRA_EU", distance: 5800, description: "France to Indian Ocean OMR" },
    
    // Extra-EU routes
    { from: "NLRTM", to: "USNYC", type: "EXTRA_EU", distance: 3400, description: "Transatlantic" },
    { from: "USNYC", to: "NLRTM", type: "EXTRA_EU", distance: 3400, description: "Return transatlantic" },
    { from: "NLAMS", to: "SGSIN", type: "EXTRA_EU", distance: 8200, description: "Asia trade" },
    { from: "DEHAM", to: "CNSHA", type: "EXTRA_EU", distance: 11200, description: "Europe-China" },
    { from: "GRPIR", to: "AEJEA", type: "EXTRA_EU", distance: 1800, description: "Mediterranean-Gulf" },
  ];

  // Generate voyages for each vessel over the last 3 months
  const now = new Date();
  for (const vessel of vessels) {
    for (let i = 0; i < 5; i++) {
      const route = routes[i % routes.length];
      const departureDate = new Date(now);
      departureDate.setDate(departureDate.getDate() - (90 - i * 15));
      
      const arrivalDate = new Date(departureDate);
      const daysAtSea = Math.ceil(route.distance / 300); // ~300 nm per day
      arrivalDate.setDate(arrivalDate.getDate() + daysAtSea);

      const voyage = await storage.createVoyage({
        tenantId: tenant.id,
        vesselId: vessel.id,
        voyageNumber: `${vessel.name.substring(3, 6).toUpperCase()}-${2024}-${String(voyageCount + 1).padStart(4, '0')}`,
        departurePortId: portMap[route.from].id,
        arrivalPortId: portMap[route.to].id,
        departureAt: departureDate,
        arrivalAt: arrivalDate,
        distanceNm: String(route.distance),
        voyageType: route.type as any,
        coverageEuPct: route.type === "INTRA_EU" ? "1.00" : "0.50",
        coverageUkPct: route.from === "GBLGP" || route.to === "GBLGP" ? "0.50" : "0.00",
        status: "COMPLETED",
      });
      voyageCount++;
      console.log(`✓ Created voyage: ${voyage.voyageNumber} (${route.from} → ${route.to})`);

      // Create consumption records for this voyage
      // Main engine consumption at sea
      const fuelType = vessel.mainEngineType === "LNG Dual-Fuel" ? fuelMap["LNG"] : fuelMap["VLSFO"];
      const consumption1 = await storage.createConsumption({
        voyageId: voyage.id,
        fuelId: fuelType.id,
        massTonnes: String((route.distance * 0.15 * (Math.random() * 0.2 + 0.9)).toFixed(2)), // ~0.15 tonnes per nm
        engineType: "Main Engine",
        methaneSlipPct: vessel.mainEngineType === "LNG Dual-Fuel" ? "3.5" : null,
        location: "AT_SEA",
      });
      consumptionCount++;

      // Auxiliary engine consumption at sea (MGO)
      const consumption2 = await storage.createConsumption({
        voyageId: voyage.id,
        fuelId: fuelMap["MGO"].id,
        massTonnes: String((daysAtSea * 2.5 * (Math.random() * 0.2 + 0.9)).toFixed(2)), // ~2.5 tonnes per day
        engineType: "Auxiliary Engine",
        location: "AT_SEA",
      });
      consumptionCount++;

      // Port consumption (at berth)
      const consumption3 = await storage.createConsumption({
        voyageId: voyage.id,
        fuelId: fuelMap["MGO"].id,
        massTonnes: String((1.5 * (Math.random() * 0.2 + 0.9)).toFixed(2)), // ~1.5 tonnes at berth
        engineType: "Auxiliary Engine",
        location: "AT_BERTH",
      });
      consumptionCount++;

      // Maneuvering consumption
      const consumption4 = await storage.createConsumption({
        voyageId: voyage.id,
        fuelId: fuelMap["MGO"].id,
        massTonnes: String((0.8 * (Math.random() * 0.2 + 0.9)).toFixed(2)), // ~0.8 tonnes maneuvering
        engineType: "Main Engine",
        location: "MANEUVERING",
      });
      consumptionCount++;
    }
  }

  console.log(`✓ Created ${voyageCount} voyages with ${consumptionCount} consumption records`);
  console.log("\n✅ Comprehensive data seeding complete!");
  console.log(`\nSummary:`);
  console.log(`- Ports: ${Object.keys(portMap).length}`);
  console.log(`- Fuels: ${Object.keys(fuelMap).length}`);
  console.log(`- Tenants: 1`);
  console.log(`- Users: ${users.length}`);
  console.log(`- Organizations: 1`);
  console.log(`- Fleets: 1`);
  console.log(`- Vessels: ${vessels.length}`);
  console.log(`- Voyages: ${voyageCount}`);
  console.log(`- Consumptions: ${consumptionCount}`);
  console.log(`\nLogin credentials:`);
  console.log(`- Admin: admin@ghgconnect.com / admin123`);
  console.log(`- Compliance: compliance@ghgconnect.com / admin123`);
}

/**
 * Get count of seeded data
 */
export async function getReferenceDataStats(): Promise<{
  portsCount: number;
  fuelsCount: number;
}> {
  const ports = await storage.getAllPorts();
  const fuels = await storage.getAllFuels();

  return {
    portsCount: ports.length,
    fuelsCount: fuels.length,
  };
}

/**
 * Get all seeded data for testing/display
 */
export async function getAllDataStats() {
  const ports = await storage.getAllPorts();
  const fuels = await storage.getAllFuels();
  
  return {
    portsCount: ports.length,
    fuelsCount: fuels.length,
  };
}

