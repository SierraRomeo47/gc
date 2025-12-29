import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { dataImportService } from "./dataImportService";
import multer from "multer";
import { registerAuthRoutes } from "./routes/auth";
import { registerTenantRoutes } from "./routes/tenants";
import { registerVesselRoutes } from "./routes/vessels";
import { registerAuditRoutes } from "./routes/audit";
import { authenticateToken, enforceTenantIsolation, rateLimit } from "./auth/middleware";
import { requirePermission, Permission } from "./auth/rbac";
import { toVesselViewModel, toVesselViewModels } from "./adapters/vesselAdapter";
import { toUserViewModel, toUserViewModels } from "./adapters/userAdapter";
import { toFleetViewModel, toFleetViewModels } from "./adapters/fleetAdapter";
import { 
  successResponse, 
  createdResponse, 
  notFoundError, 
  badRequestError, 
  conflictError,
  internalServerError 
} from "./utils/response";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Register authentication routes (public)
  registerAuthRoutes(app);

  // Register protected routes
  registerTenantRoutes(app);
  registerVesselRoutes(app);
  registerAuditRoutes(app);

  // Data import routes (authentication disabled for prototype)
  app.post(
    '/api/data-imports/upload',
    // authenticateToken, // Disabled for prototype
    // enforceTenantIsolation, // Disabled for prototype
    // requirePermission(Permission.IMPORT_DATA), // Disabled for prototype
    upload.single('file'),
    async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { originalname, buffer, mimetype } = req.file;
      let result;

      if (mimetype === 'text/csv' || originalname.endsWith('.csv')) {
        result = await dataImportService.processCSVFile(buffer, originalname);
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || originalname.endsWith('.xlsx')) {
        result = await dataImportService.processXLSXFile(buffer, originalname);
      } else if (originalname.endsWith('.sql')) {
        result = await dataImportService.processSQLFile(buffer, originalname);
      } else {
        return res.status(400).json({ error: 'Unsupported file type' });
      }

      res.json(result);
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'Failed to process file' });
    }
  });

  app.get(
    '/api/data-imports',
    // authenticateToken, // Temporarily disabled for development
    // enforceTenantIsolation, // Temporarily disabled for development
    // requirePermission(Permission.VIEW_VOYAGES), // Temporarily disabled for development
    (req, res) => {
    try {
      const files = dataImportService.getImportedFiles();
      res.json(files);
    } catch (error) {
      console.error('Error fetching imported files:', error);
      res.status(500).json({ error: 'Failed to fetch imported files' });
    }
  });

  app.get(
    '/api/calculation-formulas',
    // authenticateToken, // Temporarily disabled for development
    // enforceTenantIsolation, // Temporarily disabled for development
    // requirePermission(Permission.VIEW_CONSTANTS), // Temporarily disabled for development
    (req, res) => {
    try {
      const formulas = dataImportService.getCalculationFormulas();
      res.json(formulas);
    } catch (error) {
      console.error('Error fetching formulas:', error);
      res.status(500).json({ error: 'Failed to fetch formulas' });
    }
  });

  app.put(
    '/api/calculation-formulas/:id',
    // authenticateToken, // Disabled for prototype
    // enforceTenantIsolation, // Disabled for prototype
    // requirePermission(Permission.MANAGE_CONSTANTS), // Disabled for prototype
    async (req, res) => {
    try {
      const { id } = req.params;
      const formula = req.body;
      const updated = dataImportService.updateCalculationFormula(id, formula);
      res.json(updated);
    } catch (error) {
      console.error('Error updating formula:', error);
      res.status(500).json({ error: 'Failed to update formula' });
    }
  });

  app.get(
    '/api/data-exports/:format',
    // authenticateToken, // Disabled for prototype
    // enforceTenantIsolation, // Disabled for prototype
    // requirePermission(Permission.EXPORT_DATA), // Disabled for prototype
    async (req, res) => {
    try {
      const { format } = req.params;
      const { type } = req.query;
      
      if (!['csv', 'xlsx', 'sql'].includes(format)) {
        return res.status(400).json({ error: 'Invalid export format' });
      }

      const data = await dataImportService.exportData(format as 'csv' | 'xlsx' | 'sql', type as string);
      
      // Set appropriate headers
      const contentTypes = {
        csv: 'text/csv',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        sql: 'application/sql'
      };

      res.setHeader('Content-Type', contentTypes[format as keyof typeof contentTypes]);
      res.setHeader('Content-Disposition', `attachment; filename="maritime-${type}.${format}"`);
      res.send(data);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  });

  // Database-backed vessels endpoint (legacy - redirects to v1)
  app.get('/api/vessels/all', async (req, res) => {
    try {
      // Fetch actual vessels from database with compliance calculations
      const tenantId = (req as any).user?.tenantId || 'dfa5de92-6ab2-47d4-b19c-87c01b692c94'; // Use seeded tenant ID
      const userRole = (req as any).user?.role || 'admin'; // Get user role
      
      // Try to get vessels from database
      let vessels = [];
      try {
        // For system administrators, get all vessels regardless of tenant
        if (userRole === 'admin' || userRole === 'SYSTEM_ADMIN' || userRole === 'OWNER' || userRole === 'ADMIN') {
          vessels = await storage.getAllVessels();
        } else {
          vessels = await storage.getVesselsByTenant(tenantId);
        }
      } catch (error) {
        console.log('Database query failed, using demo data');
      }
      
      // If no vessels in database or error, return demo data
      if (vessels.length === 0) {
        return res.redirect('/api/vessels/demo');
      }
      
      // Use adapter to transform vessels to view models
      const vesselViewModels = toVesselViewModels(vessels);
      successResponse(res, vesselViewModels);
    } catch (error) {
      console.error('Error fetching vessels from database:', error);
      res.redirect('/api/vessels/demo');
    }
  });

  // Update vessel endpoint (legacy - for frontend compatibility)
  app.put('/api/vessels/:id', async (req, res) => {
    try {
      const vesselId = req.params.id;
      const updateData = req.body;
      
      console.log(`Updating vessel ${vesselId} with data:`, updateData);
      
      // Force database storage to be used if available
      const tenantId = (req as any).user?.tenantId || 'dfa5de92-6ab2-47d4-b19c-87c01b692c94';
      
      // Try to update directly with database storage
      try {
        // Import the database storage directly
        const { DatabaseStorage } = await import('./dbStorage');
        const dbStorage = new DatabaseStorage();
        
        // Check if database is available
        const isDbAvailable = await dbStorage.isAvailable();
        if (isDbAvailable) {
          console.log('Using database storage directly for vessel update');
          
          // Update vessel in database
          const updatedVessel = await dbStorage.updateVessel(vesselId, tenantId, updateData);
          
          if (updatedVessel) {
            // Transform to view model
            const vesselViewModel = toVesselViewModel(updatedVessel);
            return successResponse(res, vesselViewModel);
          }
        }
      } catch (dbError) {
        console.log('Database storage failed, falling back to hybrid storage:', dbError.message);
      }
      
      // Fallback to hybrid storage
      const updatedVessel = await storage.updateVessel(vesselId, tenantId, updateData);
      
      if (!updatedVessel) {
        return notFoundError(res, 'Vessel not found');
      }
      
      // Transform to view model
      const vesselViewModel = toVesselViewModel(updatedVessel);
      successResponse(res, vesselViewModel);
    } catch (error) {
      console.error('Error updating vessel:', error);
      internalServerError(res, 'Failed to update vessel');
    }
  });

  // Fleets endpoint for demo/development
  app.get('/api/fleets/demo', async (req, res) => {
    try {
      const mockFleets = [
        {
          id: "fleet-1",
          orgId: "org-1",
          name: "European Coastal Fleet",
          description: "Fleet operating in European coastal waters with focus on short-haul routes",
          createdAt: new Date().toISOString()
        },
        {
          id: "fleet-2", 
          orgId: "org-1",
          name: "Transatlantic Fleet",
          description: "Long-distance fleet operating transatlantic routes between Europe and Americas",
          createdAt: new Date().toISOString()
        },
        {
          id: "fleet-3",
          orgId: "org-1", 
          name: "Mediterranean Fleet",
          description: "Fleet specializing in Mediterranean and Black Sea operations",
          createdAt: new Date().toISOString()
        },
        {
          id: "fleet-4",
          orgId: "org-1",
          name: "Arctic Fleet", 
          description: "Specialized fleet for Arctic and Northern European operations",
          createdAt: new Date().toISOString()
        }
      ];
      
      res.json(mockFleets);
    } catch (error) {
      console.error('Error fetching demo fleets:', error);
      res.status(500).json({ error: 'Failed to fetch fleets' });
    }
  });

  // Public vessels endpoint for demo/development
  app.get('/api/vessels/demo', async (req, res) => {
    try {
      // Return comprehensive vessel data with realistic compliance metrics
      const targetIntensity = 89.3; // 2025 FuelEU target
      
      const mockVessels = [
        // Original fleet
        {
          id: "1",
          name: "Atlantic Pioneer",
          imoNumber: "IMO9876543",
          type: "Container Ship",
          flag: "Netherlands",
          grossTonnage: 50000,
          iceClass: null,
          mainEngineType: "Diesel",
          complianceStatus: "compliant",
          ghgIntensity: 82.4,
          targetIntensity: targetIntensity,
          fuelConsumption: 1250.5,
          creditBalance: 125.3,
          voyageType: "intra-eu",
          fleetId: "fleet-2" // Transatlantic Fleet
        },
        {
          id: "2",
          name: "Nordic Explorer",
          imoNumber: "IMO9876544",
          type: "Bulk Carrier",
          flag: "Norway",
          grossTonnage: 45000,
          iceClass: null,
          mainEngineType: "Diesel",
          complianceStatus: "warning",
          ghgIntensity: 91.2,
          targetIntensity: targetIntensity,
          fuelConsumption: 980.2,
          creditBalance: -45.7,
          voyageType: "intra-eu"
        },
        {
          id: "3",
          name: "Baltic Star",
          imoNumber: "IMO9876545",
          type: "Tanker",
          flag: "Denmark",
          grossTonnage: 55000,
          iceClass: null,
          mainEngineType: "Diesel",
          complianceStatus: "non-compliant",
          ghgIntensity: 98.6,
          targetIntensity: targetIntensity,
          fuelConsumption: 1850.8,
          creditBalance: -298.4,
          voyageType: "intra-eu"
        },
        {
          id: "4",
          name: "Mediterranean Express",
          imoNumber: "IMO9876546",
          type: "Container Ship",
          flag: "Italy",
          grossTonnage: 48000,
          iceClass: null,
          mainEngineType: "LNG Dual-Fuel",
          complianceStatus: "compliant",
          ghgIntensity: 68.2,
          targetIntensity: targetIntensity,
          fuelConsumption: 1420.3,
          creditBalance: 385.7,
          voyageType: "intra-eu"
        },
        {
          id: "5",
          name: "Thames Voyager",
          imoNumber: "IMO9876547",
          type: "Ro-Ro Cargo",
          flag: "United Kingdom",
          grossTonnage: 35000,
          iceClass: null,
          mainEngineType: "Diesel",
          complianceStatus: "warning",
          ghgIntensity: 90.8,
          targetIntensity: targetIntensity,
          fuelConsumption: 750.1,
          creditBalance: -28.5,
          voyageType: "intra-eu"
        },
        
        // Ice Class Tankers
        {
          id: "6",
          name: "Arctic Guardian",
          imoNumber: "IMO9876548",
          type: "Tanker",
          flag: "Finland",
          grossTonnage: 68000,
          iceClass: "1A Super",
          mainEngineType: "Diesel",
          complianceStatus: "compliant",
          ghgIntensity: 85.7,
          targetIntensity: targetIntensity,
          fuelConsumption: 1680.4,
          creditBalance: 92.3,
          voyageType: "intra-eu"
        },
        {
          id: "7",
          name: "Polar Navigator",
          imoNumber: "IMO9876549",
          type: "Tanker",
          flag: "Norway",
          grossTonnage: 72000,
          iceClass: "1A",
          mainEngineType: "Diesel",
          complianceStatus: "warning",
          ghgIntensity: 92.3,
          targetIntensity: targetIntensity,
          fuelConsumption: 1920.7,
          creditBalance: -87.4,
          voyageType: "intra-eu"
        },
        {
          id: "8",
          name: "Baltic Ice",
          imoNumber: "IMO9876550",
          type: "Tanker",
          flag: "Sweden",
          grossTonnage: 65000,
          iceClass: "1A Super",
          mainEngineType: "Diesel",
          complianceStatus: "compliant",
          ghgIntensity: 87.1,
          targetIntensity: targetIntensity,
          fuelConsumption: 1580.2,
          creditBalance: 65.8,
          voyageType: "intra-eu"
        },
        {
          id: "9",
          name: "Northern Frost",
          imoNumber: "IMO9876551",
          type: "Tanker",
          flag: "Denmark",
          grossTonnage: 70000,
          iceClass: "1A",
          mainEngineType: "LNG Dual-Fuel",
          complianceStatus: "compliant",
          ghgIntensity: 71.5,
          targetIntensity: targetIntensity,
          fuelConsumption: 1750.9,
          creditBalance: 425.6,
          voyageType: "intra-eu"
        },
        
        // Intra-EU Specialized Vessels
        {
          id: "10",
          name: "Europa Link",
          imoNumber: "IMO9876552",
          type: "Ro-Ro Passenger",
          flag: "Germany",
          grossTonnage: 42000,
          iceClass: null,
          mainEngineType: "Diesel",
          complianceStatus: "warning",
          ghgIntensity: 90.2,
          targetIntensity: targetIntensity,
          fuelConsumption: 980.5,
          creditBalance: -18.9,
          voyageType: "intra-eu"
        },
        {
          id: "11",
          name: "Coastal Trader",
          imoNumber: "IMO9876553",
          type: "General Cargo",
          flag: "Netherlands",
          grossTonnage: 28000,
          iceClass: null,
          mainEngineType: "Diesel",
          complianceStatus: "compliant",
          ghgIntensity: 84.6,
          targetIntensity: targetIntensity,
          fuelConsumption: 620.3,
          creditBalance: 78.4,
          voyageType: "intra-eu"
        },
        {
          id: "12",
          name: "Baltic Express",
          imoNumber: "IMO9876554",
          type: "Container Ship",
          flag: "Poland",
          grossTonnage: 38000,
          iceClass: "1C",
          mainEngineType: "Diesel",
          complianceStatus: "compliant",
          ghgIntensity: 83.9,
          targetIntensity: targetIntensity,
          fuelConsumption: 890.7,
          creditBalance: 112.5,
          voyageType: "intra-eu"
        },
        {
          id: "13",
          name: "Adriatic Star",
          imoNumber: "IMO9876555",
          type: "Ro-Ro Cargo",
          flag: "Italy",
          grossTonnage: 32000,
          iceClass: null,
          mainEngineType: "LNG Dual-Fuel",
          complianceStatus: "compliant",
          ghgIntensity: 69.8,
          targetIntensity: targetIntensity,
          fuelConsumption: 750.2,
          creditBalance: 334.7,
          voyageType: "intra-eu"
        },
        {
          id: "14",
          name: "Celtic Pride",
          imoNumber: "IMO9876556",
          type: "Ro-Ro Passenger",
          flag: "United Kingdom",
          grossTonnage: 46000,
          iceClass: null,
          mainEngineType: "Diesel",
          complianceStatus: "warning",
          ghgIntensity: 91.5,
          targetIntensity: targetIntensity,
          fuelConsumption: 1120.8,
          creditBalance: -52.3,
          voyageType: "intra-eu"
        },
        
        // OMR (Outermost Regions) Vessels
        {
          id: "15",
          name: "Canary Islander",
          imoNumber: "IMO9876557",
          type: "Container Ship",
          flag: "Spain",
          grossTonnage: 35000,
          iceClass: null,
          mainEngineType: "Diesel",
          complianceStatus: "compliant",
          ghgIntensity: 81.3,
          targetIntensity: targetIntensity,
          fuelConsumption: 820.4,
          creditBalance: 145.6,
          voyageType: "omr"
        },
        {
          id: "16",
          name: "Azores Connector",
          imoNumber: "IMO9876558",
          type: "General Cargo",
          flag: "Portugal",
          grossTonnage: 29000,
          iceClass: null,
          mainEngineType: "Diesel",
          complianceStatus: "compliant",
          ghgIntensity: 86.2,
          targetIntensity: targetIntensity,
          fuelConsumption: 680.5,
          creditBalance: 68.9,
          voyageType: "omr"
        },
        {
          id: "17",
          name: "Madeira Express",
          imoNumber: "IMO9876559",
          type: "Container Ship",
          flag: "Portugal",
          grossTonnage: 33000,
          iceClass: null,
          mainEngineType: "Diesel",
          complianceStatus: "warning",
          ghgIntensity: 90.1,
          targetIntensity: targetIntensity,
          fuelConsumption: 770.8,
          creditBalance: -15.7,
          voyageType: "omr"
        },
        {
          id: "18",
          name: "Martinique Trader",
          imoNumber: "IMO9876560",
          type: "Container Ship",
          flag: "France",
          grossTonnage: 31000,
          iceClass: null,
          mainEngineType: "Diesel",
          complianceStatus: "compliant",
          ghgIntensity: 84.8,
          targetIntensity: targetIntensity,
          fuelConsumption: 725.3,
          creditBalance: 95.2,
          voyageType: "omr"
        },
        {
          id: "19",
          name: "Reunion Link",
          imoNumber: "IMO9876561",
          type: "General Cargo",
          flag: "France",
          grossTonnage: 27000,
          iceClass: null,
          mainEngineType: "Diesel",
          complianceStatus: "compliant",
          ghgIntensity: 88.5,
          targetIntensity: targetIntensity,
          fuelConsumption: 630.7,
          creditBalance: 28.4,
          voyageType: "omr"
        },
        
        // Advanced Technology Vessels
        {
          id: "20",
          name: "Green Pioneer",
          imoNumber: "IMO9876562",
          type: "Container Ship",
          flag: "Denmark",
          grossTonnage: 52000,
          iceClass: null,
          mainEngineType: "Methanol Dual-Fuel",
          complianceStatus: "compliant",
          ghgIntensity: 52.4,
          targetIntensity: targetIntensity,
          fuelConsumption: 1280.5,
          creditBalance: 678.9,
          voyageType: "intra-eu"
        },
        {
          id: "21",
          name: "Hydrogen Explorer",
          imoNumber: "IMO9876563",
          type: "Tanker",
          flag: "Norway",
          grossTonnage: 48000,
          iceClass: null,
          mainEngineType: "Hydrogen",
          complianceStatus: "compliant",
          ghgIntensity: 9.4,
          targetIntensity: targetIntensity,
          fuelConsumption: 1180.2,
          creditBalance: 1245.8,
          voyageType: "intra-eu"
        },
        {
          id: "22",
          name: "Electric Horizon",
          imoNumber: "IMO9876564",
          type: "Ro-Ro Cargo",
          flag: "Sweden",
          grossTonnage: 25000,
          iceClass: null,
          mainEngineType: "Battery-Electric",
          complianceStatus: "compliant",
          ghgIntensity: 0.0,
          targetIntensity: targetIntensity,
          fuelConsumption: 0.0,
          creditBalance: 895.4,
          voyageType: "intra-eu"
        },
        
        // Large International Vessels
        {
          id: "23",
          name: "Global Titan",
          imoNumber: "IMO9876565",
          type: "Container Ship",
          flag: "Malta",
          grossTonnage: 98000,
          iceClass: null,
          mainEngineType: "Diesel",
          complianceStatus: "non-compliant",
          ghgIntensity: 95.8,
          targetIntensity: targetIntensity,
          fuelConsumption: 2850.6,
          creditBalance: -445.8,
          voyageType: "extra-eu"
        },
        {
          id: "24",
          name: "Ocean Voyager",
          imoNumber: "IMO9876566",
          type: "Bulk Carrier",
          flag: "Cyprus",
          grossTonnage: 85000,
          iceClass: null,
          mainEngineType: "Diesel",
          complianceStatus: "warning",
          ghgIntensity: 92.7,
          targetIntensity: targetIntensity,
          fuelConsumption: 2340.9,
          creditBalance: -124.7,
          voyageType: "extra-eu"
        },
        {
          id: "25",
          name: "Mediterranean Pride",
          imoNumber: "IMO9876567",
          type: "Tanker",
          flag: "Greece",
          grossTonnage: 92000,
          iceClass: null,
          mainEngineType: "Diesel",
          complianceStatus: "compliant",
          ghgIntensity: 87.9,
          targetIntensity: targetIntensity,
          fuelConsumption: 2520.4,
          creditBalance: 56.8,
          voyageType: "intra-eu"
        },
        {
          id: "26",
          name: "North Sea Trader",
          imoNumber: "IMO9876568",
          type: "General Cargo",
          flag: "Belgium",
          grossTonnage: 38000,
          iceClass: null,
          mainEngineType: "LNG Dual-Fuel",
          complianceStatus: "compliant",
          ghgIntensity: 70.5,
          targetIntensity: targetIntensity,
          fuelConsumption: 890.3,
          creditBalance: 312.4,
          voyageType: "intra-eu"
        }
      ];
      
      res.json(mockVessels);
    } catch (error) {
      console.error('Error fetching demo vessels:', error);
      res.status(500).json({ error: 'Failed to fetch vessels' });
    }
  });

  // Ports endpoints
  app.get('/api/ports', async (req, res) => {
    try {
      const ports = await storage.getAllPorts();
      res.json(ports);
    } catch (error) {
      console.error('Error fetching ports:', error);
      res.status(500).json({ error: 'Failed to fetch ports' });
    }
  });

  app.get('/api/ports/:id', async (req, res) => {
    try {
      const port = await storage.getPort(req.params.id);
      if (!port) {
        return res.status(404).json({ error: 'Port not found' });
      }
      res.json(port);
    } catch (error) {
      console.error('Error fetching port:', error);
      res.status(500).json({ error: 'Failed to fetch port' });
    }
  });

  // Fuels endpoints
  app.get('/api/fuels', async (req, res) => {
    try {
      const fuels = await storage.getAllFuels();
      res.json(fuels);
    } catch (error) {
      console.error('Error fetching fuels:', error);
      res.status(500).json({ error: 'Failed to fetch fuels' });
    }
  });

  app.get('/api/fuels/:id', async (req, res) => {
    try {
      const fuel = await storage.getFuel(req.params.id);
      if (!fuel) {
        return res.status(404).json({ error: 'Fuel not found' });
      }
      res.json(fuel);
    } catch (error) {
      console.error('Error fetching fuel:', error);
      res.status(500).json({ error: 'Failed to fetch fuel' });
    }
  });

  // Voyages endpoints (authentication disabled for prototype)
  app.get(
    '/api/voyages',
    // authenticateToken, // Disabled for prototype
    // enforceTenantIsolation, // Disabled for prototype
    // requirePermission(Permission.VIEW_VOYAGES), // Disabled for prototype
    rateLimit(),
    async (req, res) => {
    try {
      // Use default tenant ID for prototype
      const tenantId = (req as any).user?.tenantId || 'dfa5de92-6ab2-47d4-b19c-87c01b692c94';
      const voyages = await storage.getVoyagesByTenant(tenantId);
      res.json(voyages);
    } catch (error) {
      console.error('Error fetching voyages:', error);
      res.status(500).json({ error: 'Failed to fetch voyages' });
    }
  });

  app.get(
    '/api/voyages/:id',
    // authenticateToken, // Disabled for prototype
    // enforceTenantIsolation, // Disabled for prototype
    // requirePermission(Permission.VIEW_VOYAGES), // Disabled for prototype
    rateLimit(),
    async (req, res) => {
    try {
      // Use default tenant ID for prototype
      const tenantId = (req as any).user?.tenantId || 'dfa5de92-6ab2-47d4-b19c-87c01b692c94';
      const voyage = await storage.getVoyage(req.params.id, tenantId);
      if (!voyage) {
        return res.status(404).json({ error: 'Voyage not found' });
      }
      res.json(voyage);
    } catch (error) {
      console.error('Error fetching voyage:', error);
      res.status(500).json({ error: 'Failed to fetch voyage' });
    }
  });

  // Consumptions endpoints (authentication disabled for prototype)
  app.get(
    '/api/voyages/:voyageId/consumptions',
    // authenticateToken, // Disabled for prototype
    // enforceTenantIsolation, // Disabled for prototype
    // requirePermission(Permission.VIEW_VOYAGES), // Disabled for prototype
    rateLimit(),
    async (req, res) => {
    try {
      const consumptions = await storage.getConsumptionsByVoyage(req.params.voyageId);
      res.json(consumptions);
    } catch (error) {
      console.error('Error fetching consumptions:', error);
      res.status(500).json({ error: 'Failed to fetch consumptions' });
    }
  });

  // Public endpoint for demo/testing (no auth required)
  app.get('/api/public/stats', async (req, res) => {
    try {
      const ports = await storage.getAllPorts();
      const fuels = await storage.getAllFuels();
      res.json({
        portsCount: ports.length,
        fuelsCount: fuels.length,
        status: 'healthy'
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // User management endpoints
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Get roles and subscription tiers for all users
      const rolesMap = new Map<string, string>();
      const subscriptionMap = new Map<string, string>();
      
      for (const user of users) {
        if (user.tenantId) {
          // Get user role
          const userRoles = await storage.getUserRoles(user.id, user.tenantId);
          if (userRoles.length > 0) {
            rolesMap.set(user.id, userRoles[0].role);
          }
          
          // Get user preferences (including subscription tier)
          try {
            const preferences = await storage.getUserPreferences(user.id);
            if (preferences && preferences.subscriptionTier) {
              subscriptionMap.set(user.id, preferences.subscriptionTier);
            }
          } catch (error) {
            console.log(`No preferences found for user ${user.id}`);
          }
        }
      }
      
      // Transform to view models with subscription tiers
      const userViewModels = users.map(user => {
        const role = rolesMap.get(user.id);
        const subscriptionTier = subscriptionMap.get(user.id) || 'professional';
        return toUserViewModel(user, role, [], [], subscriptionTier as any);
      });
      successResponse(res, userViewModels);
    } catch (error) {
      console.error('Error fetching users:', error);
      internalServerError(res, 'Failed to fetch users');
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const userData = req.body;
      console.log('🔍 User creation request body:', userData);
      console.log('🔍 Username:', userData.username);
      console.log('🔍 Email:', userData.email);
      console.log('🔍 Password:', userData.password ? '[PROVIDED]' : '[MISSING]');
      
      // Validate required fields
      if (!userData.username || !userData.email || !userData.password) {
        console.log('❌ Missing required fields - Username:', !!userData.username, 'Email:', !!userData.email, 'Password:', !!userData.password);
        return badRequestError(res, 'Missing required fields: username, email, password');
      }
      
      // Use the existing demo tenant ID
      let tenantId = 'dfa5de92-6ab2-47d4-b19c-87c01b692c94';
      try {
        const existingTenant = await storage.getTenant(tenantId);
        if (!existingTenant) {
          // Fallback: get first available tenant
          const tenants = await storage.getAllTenants();
          if (tenants.length > 0) {
            tenantId = tenants[0].id;
            console.log('Using first available tenant:', tenantId);
          } else {
            return internalServerError(res, 'No tenants available');
          }
        } else {
          console.log('Using existing tenant:', tenantId);
        }
      } catch (error) {
        console.warn('Failed to get tenant, using first available tenant:', error);
        // Fallback: get first available tenant
        const tenants = await storage.getAllTenants();
        if (tenants.length > 0) {
          tenantId = tenants[0].id;
        } else {
          return internalServerError(res, 'No tenants available');
        }
      }
      
      // Hash the password before storing
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        tenantId: tenantId,
        firstName: userData.firstName || userData.username,
        lastName: userData.lastName || 'User'
      });
      
      // Create user role - keep frontend role names consistent
      const userRole = userData.role || 'emission_analyst';
      console.log('🔍 Role received:', userRole);
      
      // Use the same role name in backend as frontend for consistency
      await storage.createUserRole({
        userId: user.id,
        role: userRole as any
      });
      
      // Handle subscription tier - store in user preferences
      if (userData.subscriptionTier) {
        console.log('✅ User subscription tier requested:', userData.subscriptionTier);
        
        // Store subscription tier in user preferences
        try {
          const preferences = {
            subscriptionTier: userData.subscriptionTier,
            currency: 'USD',
            theme: 'light',
            language: 'en',
            timezone: 'UTC'
          };
          
          await storage.createUserPreferences(user.id, preferences);
          console.log('✅ Subscription tier stored in user preferences:', userData.subscriptionTier);
        } catch (error) {
          console.error('❌ Failed to store subscription tier:', error);
          // Continue without failing the user creation
        }
      }
      
      // Transform to view model with subscription tier
      const subscriptionTier = userData.subscriptionTier || 'professional';
      const userViewModel = toUserViewModel(user, userRole, [], [], subscriptionTier);
      createdResponse(res, userViewModel);
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Handle specific database constraint violations
      if (error.code === '23505') { // Unique constraint violation
        if (error.constraint === 'users_email_key') {
          return badRequestError(res, 'Email already exists', { field: 'email' });
        } else if (error.constraint === 'users_username_key') {
          return badRequestError(res, 'Username already exists', { field: 'username' });
        }
      }
      
      internalServerError(res, 'Failed to create user', { details: error.message });
    }
  });

  // User Access Control Routes (MUST come before /api/users/:id routes)
  app.get('/api/users/:userId/fleets', async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('GET /api/users/:userId/fleets called with userId:', userId);
      
      // Get actual fleet access from database
      const fleetAccess = await storage.getUserFleetAccess(userId);
      console.log('Retrieved fleet access:', fleetAccess);
      
      // For now, return the access records (we can enhance this to return full fleet objects later)
      res.json(fleetAccess);
      
      // TODO: Re-enable AccessControlService once SQL issues are resolved
      /*
      const userRole = req.user?.role || 'COMPLIANCE'; // Default role if not authenticated
      
      const { AccessControlService } = await import('./services/accessControl');
      const accessibleFleets = await AccessControlService.getUserAccessibleFleets(userId, userRole);
      
      res.json(accessibleFleets);
      */
    } catch (error) {
      console.error('Error fetching user fleets:', error);
      res.status(500).json({ error: 'Failed to fetch user fleets' });
    }
  });

  app.post('/api/users/:userId/fleets/:fleetId', async (req, res) => {
    try {
      const { userId, fleetId } = req.params;
      const grantedBy = userId; // Simplified - use userId as grantedBy

      console.log('Granting fleet access:', { userId, fleetId, grantedBy });
      
      try {
        // Create actual database record
        const access = await storage.createUserFleetAccess(userId, fleetId, grantedBy || userId);
        console.log('✅ Fleet access created successfully:', access);
        res.json(access);
      } catch (dbError: any) {
        console.error('❌ Database error creating fleet access:', dbError);
        
        // Handle specific database constraint violations
        if (dbError.code === '23503') { // Foreign key constraint violation
          if (dbError.constraint === 'user_fleet_access_fleet_id_fkey') {
            return res.status(400).json({ error: 'Fleet not found', details: `Fleet ID ${fleetId} does not exist` });
          } else if (dbError.constraint === 'user_fleet_access_user_id_fkey') {
            return res.status(400).json({ error: 'User not found', details: `User ID ${userId} does not exist` });
          }
        }
        
        res.status(500).json({ error: 'Failed to create fleet access', details: dbError.message });
      }
      
      // TODO: Re-enable AccessControlService once SQL issues are resolved
      /*
      const { AccessControlService } = await import('./services/accessControl');
      const { expiresAt } = req.body;
      
      const access = await AccessControlService.grantFleetAccess(
        userId, 
        fleetId, 
        grantedBy,
        expiresAt ? new Date(expiresAt) : undefined
      );
      
      res.json(access);
      */
    } catch (error) {
      console.error('Error granting fleet access:', error);
      res.status(500).json({ error: 'Failed to grant fleet access' });
    }
  });

  app.delete('/api/users/:userId/fleets/:fleetId', async (req, res) => {
    try {
      const { userId, fleetId } = req.params;
      
      // Simplified - no permission checks for prototype

      const { AccessControlService } = await import('./services/accessControl');
      const success = await AccessControlService.revokeFleetAccess(userId, fleetId);
      
      res.json({ success });
    } catch (error) {
      console.error('Error revoking fleet access:', error);
      res.status(500).json({ error: 'Failed to revoke fleet access' });
    }
  });

  app.get('/api/users/:userId/vessels', async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('GET /api/users/:userId/vessels called with userId:', userId);
      
      // Get actual vessel access from database
      const vesselAccess = await storage.getUserVesselAccess(userId);
      console.log('Retrieved vessel access:', vesselAccess);
      
      // For now, return the access records (we can enhance this to return full vessel objects later)
      res.json(vesselAccess);
      
      // TODO: Re-enable AccessControlService once SQL issues are resolved
      /*
      const userRole = req.user?.role || 'COMPLIANCE'; // Default role if not authenticated
      
      const { AccessControlService } = await import('./services/accessControl');
      const accessibleVessels = await AccessControlService.getUserAccessibleVessels(userId, userRole);
      
      res.json(accessibleVessels);
      */
    } catch (error) {
      console.error('Error fetching user vessels:', error);
      res.status(500).json({ error: 'Failed to fetch user vessels' });
    }
  });

  app.post('/api/users/:userId/vessels/:vesselId', async (req, res) => {
    try {
      const { userId, vesselId } = req.params;
      const grantedBy = userId; // Simplified - use userId as grantedBy

      console.log('Granting vessel access:', { userId, vesselId, grantedBy });
      
      try {
        // Create actual database record
        const access = await storage.createUserVesselAccess(userId, vesselId, grantedBy || userId);
        console.log('✅ Vessel access created successfully:', access);
        res.json(access);
      } catch (dbError: any) {
        console.error('❌ Database error creating vessel access:', dbError);
        
        // Handle specific database constraint violations
        if (dbError.code === '23503') { // Foreign key constraint violation
          if (dbError.constraint === 'user_vessel_access_vessel_id_fkey') {
            return res.status(400).json({ error: 'Vessel not found', details: `Vessel ID ${vesselId} does not exist` });
          } else if (dbError.constraint === 'user_vessel_access_user_id_fkey') {
            return res.status(400).json({ error: 'User not found', details: `User ID ${userId} does not exist` });
          }
        }
        
        res.status(500).json({ error: 'Failed to create vessel access', details: dbError.message });
      }
      
      // TODO: Re-enable AccessControlService once SQL issues are resolved
      /*
      const { AccessControlService } = await import('./services/accessControl');
      const { expiresAt } = req.body;
      
      const access = await AccessControlService.grantVesselAccess(
        userId, 
        vesselId, 
        grantedBy,
        expiresAt ? new Date(expiresAt) : undefined
      );
      
      res.json(access);
      */
    } catch (error) {
      console.error('Error granting vessel access:', error);
      res.status(500).json({ error: 'Failed to grant vessel access' });
    }
  });

  app.delete('/api/users/:userId/vessels/:vesselId', async (req, res) => {
    try {
      const { userId, vesselId } = req.params;
      
      // Simplified - no permission checks for prototype

      const { AccessControlService } = await import('./services/accessControl');
      const success = await AccessControlService.revokeVesselAccess(userId, vesselId);
      
      res.json({ success });
    } catch (error) {
      console.error('Error revoking vessel access:', error);
      res.status(500).json({ error: 'Failed to revoke vessel access' });
    }
  });

  // Get user access information (comprehensive)
  app.get('/api/users/:userId/access', async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('GET /api/users/:userId/access called with userId:', userId);
      
      // Temporarily return empty access info to avoid AccessControlService errors
      console.log('Returning empty access info for user:', userId);
      res.json({
        fleets: [],
        vessels: [],
        explicitFleetAccess: [],
        explicitVesselAccess: []
      });
      
      // TODO: Re-enable AccessControlService once SQL issues are resolved
      /*
      const userRole = req.user?.role || 'COMPLIANCE';
      
      const { AccessControlService } = await import('./services/accessControl');
      const accessInfo = await AccessControlService.getUserAccessInfo(userId, userRole);
      
      res.json(accessInfo);
      */
    } catch (error) {
      console.error('Error fetching user access info:', error);
      res.status(500).json({ error: 'Failed to fetch user access info' });
    }
  });

  // Test route to verify route registration
  app.put('/api/test-route', async (req, res) => {
    console.log('TEST ROUTE HIT - PUT /api/test-route');
    res.json({ success: true, message: 'Test route working' });
  });

  app.put('/api/users/:id', async (req, res) => {
    console.log('PUT /api/users/:id - ROUTE HIT!', req.params.id);
    try {
      const { id } = req.params;
      const updates = req.body;
      
      console.log('PUT /api/users/:id - Received request:', {
        id,
        bodyKeys: Object.keys(updates),
        bodyTypes: Object.keys(updates).reduce((acc, key) => {
          acc[key] = typeof updates[key];
          return acc;
        }, {} as Record<string, string>)
      });

      // Only allow safe, persistable fields to avoid DB type errors (e.g., timestamps as strings)
      const safeUpdates: any = {};
      if (typeof updates.username === 'string') safeUpdates.username = updates.username;
      if (typeof updates.email === 'string') safeUpdates.email = updates.email;
      if (typeof updates.password === 'string' && updates.password.length > 0) {
        safeUpdates.password = updates.password;
      }
      if (typeof updates.firstName === 'string') safeUpdates.firstName = updates.firstName;
      if (typeof updates.lastName === 'string') safeUpdates.lastName = updates.lastName;
      if (typeof updates.mfaEnabled === 'boolean') safeUpdates.mfaEnabled = updates.mfaEnabled;

      console.log('PUT /api/users/:id - Safe updates:', safeUpdates);
      console.log('PUT /api/users/:id - Role update:', updates.role);
      console.log('PUT /api/users/:id - Subscription update:', updates.subscriptionTier);

        // Handle role update separately (stored in user_roles table)
        if (updates.role && typeof updates.role === 'string') {
          try {
            // Use the same role name consistently - no conversion needed
            const userRole = updates.role;
            
            // Get user's tenant ID
            const user = await storage.getUser(id);
            if (user && user.tenantId) {
              // Delete existing user roles and create new one
              await storage.deleteUserRole(id);
              await storage.createUserRole({
                userId: id,
                role: userRole as any
              });
              console.log('✅ User role updated successfully:', userRole);
            } else {
              console.warn('⚠️ User not found or no tenant ID for role update');
            }
          } catch (error) {
            console.error('❌ Failed to update user role:', error);
          }
        }

      // Handle subscription tier update (stored in user preferences or user table)
      if (updates.subscriptionTier && typeof updates.subscriptionTier === 'string') {
        try {
          // For now, we'll store subscription tier in user preferences
          // This could be moved to a dedicated subscription table later
          console.log('✅ Subscription tier update requested:', updates.subscriptionTier);
          // TODO: Implement subscription tier storage
        } catch (error) {
          console.error('❌ Failed to update subscription tier:', error);
        }
      }

      // Explicitly drop problematic fields that shouldn't be written directly
      // (createdAt, updatedAt, lastLogin, fleetIds, vesselIds, etc.)

      const user = await storage.updateUser(id, safeUpdates);
      if (user) {
        // Get user role
        let role = 'DATA_ENGINEER';
        if (user.tenantId) {
          const userRoles = await storage.getUserRoles(user.id, user.tenantId);
          if (userRoles.length > 0) {
            role = userRoles[0].role;
          }
        }
        
        // Transform to view model
        const userViewModel = toUserViewModel(user, role);
        successResponse(res, userViewModel);
      } else {
        notFoundError(res, 'User not found');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      internalServerError(res, 'Failed to update user');
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteUser(id);
      if (success) {
        successResponse(res, { success: true, id });
      } else {
        notFoundError(res, 'User not found');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      internalServerError(res, 'Failed to delete user');
    }
  });

  // User preferences endpoints - Updated to use database storage (NO AUTH for dev prototype)
  app.get('/api/user-preferences/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { UserPreferencesService } = await import('./services/userPreferences');
      const preferences = await UserPreferencesService.getUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({ error: 'Failed to fetch user preferences' });
    }
  });

  app.post('/api/user-preferences/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const preferences = req.body;
      
      const { UserPreferencesService } = await import('./services/userPreferences');
      await UserPreferencesService.saveUserPreferences(userId, preferences);
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving user preferences:', error);
      res.status(500).json({ error: 'Failed to save user preferences' });
    }
  });

  app.put('/api/user-preferences/:userId/favorites', async (req, res) => {
    try {
      const { userId } = req.params;
      const { vesselId, action } = req.body; // action: 'add' or 'remove'
      
      const { UserPreferencesService } = await import('./services/userPreferences');
      
      if (action === 'add') {
        await UserPreferencesService.addToFavorites(userId, vesselId);
      } else if (action === 'remove') {
        await UserPreferencesService.removeFromFavorites(userId, vesselId);
      } else {
        return res.status(400).json({ error: 'Invalid action. Must be "add" or "remove"' });
      }
      
      const preferences = await UserPreferencesService.getUserPreferences(userId);
      res.json({ success: true, favorites: preferences.favorites });
    } catch (error) {
      console.error('Error updating favorites:', error);
      res.status(500).json({ error: 'Failed to update favorites' });
    }
  });

  app.put('/api/user-preferences/:userId/tags', async (req, res) => {
    try {
      const { userId } = req.params;
      const { vesselId, tagName, action } = req.body; // action: 'add' or 'remove'
      
      const { UserPreferencesService } = await import('./services/userPreferences');
      
      if (action === 'add') {
        await UserPreferencesService.addTag(userId, vesselId, tagName);
      } else if (action === 'remove') {
        await UserPreferencesService.removeTag(userId, vesselId, tagName);
      } else {
        return res.status(400).json({ error: 'Invalid action. Must be "add" or "remove"' });
      }
      
      const preferences = await UserPreferencesService.getUserPreferences(userId);
      res.json({ success: true, tags: preferences.tags[vesselId] || [] });
    } catch (error) {
      console.error('Error updating tags:', error);
      res.status(500).json({ error: 'Failed to update tags' });
    }
  });

  // Additional preference endpoints for specific fields (NO AUTH for dev prototype)
  app.put('/api/user-preferences/:userId/currency', async (req, res) => {
    try {
      const { userId } = req.params;
      const { currency } = req.body;
      
      const { UserPreferencesService } = await import('./services/userPreferences');
      await UserPreferencesService.setCurrency(userId, currency);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating currency:', error);
      res.status(500).json({ error: 'Failed to update currency' });
    }
  });

  app.put('/api/user-preferences/:userId/theme', async (req, res) => {
    try {
      const { userId } = req.params;
      const { theme } = req.body;
      
      const { UserPreferencesService } = await import('./services/userPreferences');
      await UserPreferencesService.setTheme(userId, theme);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating theme:', error);
      res.status(500).json({ error: 'Failed to update theme' });
    }
  });

  app.put('/api/user-preferences/:userId/language', async (req, res) => {
    try {
      const { userId } = req.params;
      const { language } = req.body;
      
      const { UserPreferencesService } = await import('./services/userPreferences');
      await UserPreferencesService.setLanguage(userId, language);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating language:', error);
      res.status(500).json({ error: 'Failed to update language' });
    }
  });

  app.put('/api/user-preferences/:userId/timezone', async (req, res) => {
    try {
      const { userId } = req.params;
      const { timezone } = req.body;
      
      const { UserPreferencesService } = await import('./services/userPreferences');
      await UserPreferencesService.setTimezone(userId, timezone);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating timezone:', error);
      res.status(500).json({ error: 'Failed to update timezone' });
    }
  });

  // Health check endpoints
  app.get('/api/health', async (req, res) => {
    try {
      const { checkDatabaseHealth } = await import('./db');
      const dbHealth = await checkDatabaseHealth();
      
      // Determine overall status - healthy if database is connected OR if running in memory-only mode
      const overallStatus = dbHealth.healthy ? 'healthy' : 'degraded';
      
      const health = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbHealth,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        environment: process.env.NODE_ENV || 'development',
        mode: dbHealth.details.connected ? 'database' : 'memory-only'
      };

      res.status(200).json(health); // Always return 200 for memory-only mode
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed'
      });
    }
  });

  // Environment information endpoint
  app.get('/api/environment', (req, res) => {
    try {
      const env = {
        mode: process.env.NODE_ENV || 'development',
        database: process.env.POSTGRES_DB || 'ghgconnect_db',
        isProduction: process.env.NODE_ENV === 'production',
        isTest: process.env.NODE_ENV === 'test',
        isDevelopment: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV
      };
      res.json(env);
    } catch (error) {
      console.error('Error fetching environment info:', error);
      res.status(500).json({ error: 'Failed to fetch environment info' });
    }
  });

  // Test route to verify server is using updated code
  app.get('/api/test-updated-code', (req, res) => {
    res.json({ 
      message: 'Server is using updated code!',
      timestamp: new Date().toISOString(),
      auditLoggingDisabled: true
    });
  });

  app.get('/api/health/db', async (req, res) => {
    try {
      const { checkDatabaseHealth } = await import('./db');
      const dbHealth = await checkDatabaseHealth();
      res.status(200).json(dbHealth); // Always return 200 since memory-only mode is acceptable
    } catch (error) {
      console.error('Database health check error:', error);
      res.status(503).json({
        healthy: false,
        details: {
          connected: false,
          error: 'Health check failed'
        }
      });
    }
  });

  const httpServer = createServer(app);

  // Organizations API Routes
  app.get('/api/organizations', async (req, res) => {
    try {
      const tenantId = req.query.tenantId as string || (req as any).user?.tenantId || 'dfa5de92-6ab2-47d4-b19c-87c01b692c94';
      const organizations = await storage.getOrganizationsByTenant(tenantId);
      res.json(organizations);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      res.status(500).json({ error: 'Failed to fetch organizations' });
    }
  });

  app.post('/api/organizations', async (req, res) => {
    try {
      const { name, description, tenantId } = req.body;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Organization name is required' });
      }
      
      const actualTenantId = tenantId || (req as any).user?.tenantId || 'dfa5de92-6ab2-47d4-b19c-87c01b692c94';
      
      const orgData = {
        name: name.trim(),
        description: description?.trim() || null,
        tenantId: actualTenantId
      };
      
      const organization = await storage.createOrganization(orgData);
      res.status(201).json(organization);
    } catch (error) {
      console.error('Error creating organization:', error);
      res.status(500).json({ error: 'Failed to create organization' });
    }
  });

  // Fleets API Routes
  app.get('/api/fleets', async (req, res) => {
    try {
      const fleets = await storage.getAllFleets();
      
      // Get vessel counts for all fleets
      const vesselCountMap = new Map<string, number>();
      const vesselIdsMap = new Map<string, string[]>();
      
      for (const fleet of fleets) {
        try {
          const vessels = await storage.getVesselsByFleet(fleet.id, fleet.tenantId);
          vesselCountMap.set(fleet.id, vessels.length);
          vesselIdsMap.set(fleet.id, vessels.map(v => v.id));
        } catch (error) {
          console.error(`Error fetching vessels for fleet ${fleet.id}:`, error);
          vesselCountMap.set(fleet.id, 0);
          vesselIdsMap.set(fleet.id, []);
        }
      }
      
      // Transform to view models
      const fleetViewModels = toFleetViewModels(fleets, vesselCountMap, vesselIdsMap);
      successResponse(res, fleetViewModels);
    } catch (error) {
      console.error('Error fetching fleets:', error);
      internalServerError(res, 'Failed to fetch fleets');
    }
  });

  app.post('/api/fleets', async (req, res) => {
    try {
      const { name, description, orgId, tenantId } = req.body;
      
      // Validation
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Fleet name is required' });
      }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' });
      }
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }
      
      // Check if organization exists
      const org = await storage.getOrganization(orgId, tenantId);
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      // Check if fleet name already exists in the organization
      const existingFleets = await storage.getFleetsByOrg(orgId, tenantId);
      const nameExists = existingFleets.some(fleet => 
        fleet.name.toLowerCase() === name.toLowerCase().trim()
      );
      
      if (nameExists) {
        return res.status(409).json({ error: 'Fleet name already exists in this organization' });
      }
      
      // Create fleet
      const fleetData = {
        name: name.trim(),
        description: description?.trim() || null,
        orgId,
        tenantId
      };
      
      const fleet = await storage.createFleet(fleetData);
      
      // Log the creation
      // await storage.createAuditLog({
      //   userId: (req as any).user?.id || null,
      //   tenantId,
      //   action: 'CREATE_FLEET',
      //   entityType: 'FLEET',
      //   entityId: fleet.id,
      //   newValueJson: fleet,
      //   timestamp: new Date(),
      // });
      
      res.status(201).json(fleet);
    } catch (error) {
      console.error('Error creating fleet:', error);
      res.status(500).json({ error: 'Failed to create fleet' });
    }
  });

  app.put('/api/fleets/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const fleetData = req.body;
      const fleet = await storage.updateFleet(id, fleetData);
      res.json(fleet);
    } catch (error) {
      console.error('Error updating fleet:', error);
      res.status(500).json({ error: 'Failed to update fleet' });
    }
  });

  app.delete('/api/fleets/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const tenantId = req.body.tenantId || (req as any).user?.tenantId || 'dfa5de92-6ab2-47d4-b19c-87c01b692c94';
      
      // Check if fleet exists
      const fleet = await storage.getFleet(id, tenantId);
      if (!fleet) {
        return res.status(404).json({ error: 'Fleet not found' });
      }
      
      // Check if fleet has vessels assigned
      const vesselsInFleet = await storage.getVesselsByFleet(id, tenantId);
      if (vesselsInFleet.length > 0) {
        return res.status(409).json({ 
          error: 'Cannot delete fleet with assigned vessels',
          details: {
            vesselCount: vesselsInFleet.length,
            vessels: vesselsInFleet.map(v => ({ id: v.id, name: v.name }))
          }
        });
      }
      
      // Delete fleet
      const success = await storage.deleteFleet(id);
      if (!success) {
        return res.status(500).json({ error: 'Failed to delete fleet' });
      }
      
      // Log the deletion
      // await storage.createAuditLog({
      //   userId: (req as any).user?.id || null,
      //   tenantId,
      //   action: 'DELETE_FLEET',
      //   resourceType: 'FLEET',
      //   resourceId: id,
      //   details: { fleetName: fleet.name, orgId: fleet.orgId },
      //   ipAddress: req.ip,
      //   userAgent: req.get('User-Agent')
      // });
      
      res.json({ 
        success: true, 
        message: `Fleet "${fleet.name}" deleted successfully`,
        deletedFleet: { id: fleet.id, name: fleet.name }
      });
    } catch (error) {
      console.error('Error deleting fleet:', error);
      res.status(500).json({ error: 'Failed to delete fleet' });
    }
  });

  // Vessel Assignment to Fleet
  app.post('/api/fleets/:fleetId/vessels/:vesselId', async (req, res) => {
    try {
      const { fleetId, vesselId } = req.params;
      const tenantId = req.body.tenantId || (req as any).user?.tenantId || 'dfa5de92-6ab2-47d4-b19c-87c01b692c94';
      
      // Check if fleet exists
      const fleet = await storage.getFleet(fleetId, tenantId);
      if (!fleet) {
        return res.status(404).json({ error: 'Fleet not found' });
      }
      
      // Check if vessel exists
      const vessel = await storage.getVessel(vesselId, tenantId);
      if (!vessel) {
        return res.status(404).json({ error: 'Vessel not found' });
      }
      
      // Check if vessel is already in this fleet
      if (vessel.fleetId === fleetId) {
        return res.status(409).json({ error: 'Vessel is already assigned to this fleet' });
      }
      
      // Update vessel's fleet assignment
      const updatedVessel = await storage.updateVessel(vesselId, tenantId, { fleetId });
      if (!updatedVessel) {
        return res.status(500).json({ error: 'Failed to assign vessel to fleet' });
      }
      
      // Log the assignment
      // await storage.createAuditLog({
      //   userId: (req as any).user?.id || null,
      //   tenantId,
      //   action: 'ASSIGN_VESSEL_TO_FLEET',
      //   resourceId: vesselId,
      //   details: { 
      //     vesselName: vessel.name, 
      //     fleetName: fleet.name, 
      //     previousFleetId: vessel.fleetId 
      //   },
      //   ipAddress: req.ip,
      //   userAgent: req.get('User-Agent')
      // });
      
      res.json({ 
        success: true, 
        message: `Vessel "${vessel.name}" assigned to fleet "${fleet.name}"`,
        vessel: updatedVessel,
        fleet: fleet
      });
    } catch (error) {
      console.error('Error assigning vessel to fleet:', error);
      res.status(500).json({ error: 'Failed to assign vessel to fleet' });
    }
  });

  // Remove Vessel from Fleet
  app.delete('/api/fleets/:fleetId/vessels/:vesselId', async (req, res) => {
    try {
      const { fleetId, vesselId } = req.params;
      const tenantId = req.body.tenantId || (req as any).user?.tenantId || 'dfa5de92-6ab2-47d4-b19c-87c01b692c94';
      
      // Check if vessel exists and is in the specified fleet
      const vessel = await storage.getVessel(vesselId, tenantId);
      if (!vessel) {
        return res.status(404).json({ error: 'Vessel not found' });
      }
      
      if (vessel.fleetId !== fleetId) {
        return res.status(409).json({ error: 'Vessel is not assigned to this fleet' });
      }
      
      // Get fleet info for logging
      const fleet = await storage.getFleet(fleetId, tenantId);
      
      // Remove vessel from fleet (set fleetId to null)
      const updatedVessel = await storage.updateVessel(vesselId, tenantId, { fleetId: null });
      if (!updatedVessel) {
        return res.status(500).json({ error: 'Failed to remove vessel from fleet' });
      }
      
      // Log the removal
      // await storage.createAuditLog({
      //   userId: (req as any).user?.id || null,
      //   tenantId,
      //   action: 'REMOVE_VESSEL_FROM_FLEET',
      //   resourceType: 'VESSEL',
      //   resourceId: vesselId,
      //   details: { 
      //     vesselName: vessel.name, 
      //     fleetName: fleet?.name || 'Unknown Fleet'
      //   },
      //   ipAddress: req.ip,
      //   userAgent: req.get('User-Agent')
      // });
      
      res.json({ 
        success: true, 
        message: `Vessel "${vessel.name}" removed from fleet`,
        vessel: updatedVessel
      });
    } catch (error) {
      console.error('Error removing vessel from fleet:', error);
      res.status(500).json({ error: 'Failed to remove vessel from fleet' });
    }
  });

  // Bulk Vessel Assignment to Fleet
  app.post('/api/fleets/:fleetId/vessels/bulk', async (req, res) => {
    try {
      const { fleetId } = req.params;
      const { vesselIds, tenantId } = req.body;
      const actualTenantId = tenantId || (req as any).user?.tenantId || 'dfa5de92-6ab2-47d4-b19c-87c01b692c94';
      
      if (!Array.isArray(vesselIds) || vesselIds.length === 0) {
        return res.status(400).json({ error: 'Vessel IDs array is required' });
      }
      
      // Check if fleet exists
      const fleet = await storage.getFleet(fleetId, actualTenantId);
      if (!fleet) {
        return res.status(404).json({ error: 'Fleet not found' });
      }
      
      const results = {
        successful: [],
        failed: [],
        alreadyAssigned: []
      };
      
      // Process each vessel
      for (const vesselId of vesselIds) {
        try {
          const vessel = await storage.getVessel(vesselId, actualTenantId);
          if (!vessel) {
            results.failed.push({ vesselId, error: 'Vessel not found' });
            continue;
          }
          
          if (vessel.fleetId === fleetId) {
            results.alreadyAssigned.push({ vesselId, vesselName: vessel.name });
            continue;
          }
          
          const updatedVessel = await storage.updateVessel(vesselId, actualTenantId, { fleetId });
          if (updatedVessel) {
            results.successful.push({ vesselId, vesselName: vessel.name });
          } else {
            results.failed.push({ vesselId, error: 'Failed to update vessel' });
          }
        } catch (error) {
          results.failed.push({ vesselId, error: error.message });
        }
      }
      
      // Log the bulk assignment
      // await storage.createAuditLog({
      //   userId: (req as any).user?.id || null,
      //   tenantId: actualTenantId,
      //   action: 'BULK_ASSIGN_VESSELS_TO_FLEET',
      //   resourceType: 'FLEET',
      //   resourceId: fleetId,
      //   details: { 
      //     fleetName: fleet.name, 
      //     totalVessels: vesselIds.length,
      //     successful: results.successful.length,
      //     failed: results.failed.length,
      //     alreadyAssigned: results.alreadyAssigned.length
      //   },
      //   ipAddress: req.ip,
      //   userAgent: req.get('User-Agent')
      // });
      
      res.json({ 
        success: true, 
        message: `Bulk assignment completed for fleet "${fleet.name}"`,
        fleet: fleet,
        results
      });
    } catch (error) {
      console.error('Error in bulk vessel assignment:', error);
      res.status(500).json({ error: 'Failed to perform bulk vessel assignment' });
    }
  });

  return httpServer;
}
