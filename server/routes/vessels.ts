import type { Express } from "express";
import { storage } from "../storage";
import { 
  authenticateToken,
  enforceTenantIsolation,
  rateLimit,
} from "../auth/middleware";
import { requirePermission, Permission } from "../auth/rbac";
import { toVesselViewModel, toVesselViewModels } from "../adapters/vesselAdapter";
import { successResponse, createdResponse, notFoundError, badRequestError, internalServerError } from "../utils/response";

export function registerVesselRoutes(app: Express) {
  /**
   * GET /api/v1/vessels
   * Get all vessels for tenant
   */
  app.get(
    "/api/v1/vessels",
    authenticateToken,
    enforceTenantIsolation,
    requirePermission(Permission.VIEW_VESSELS),
    rateLimit(),
    async (req, res) => {
      try {
        const { fleetId } = req.query;
        
        let vessels;
        if (fleetId && typeof fleetId === 'string') {
          vessels = await storage.getVesselsByFleet(fleetId, req.user!.tenantId);
        } else {
          vessels = await storage.getVesselsByTenant(req.user!.tenantId);
        }

        // Transform to view models
        const vesselViewModels = toVesselViewModels(vessels);
        successResponse(res, vesselViewModels);
      } catch (error) {
        console.error("Get vessels error:", error);
        internalServerError(res, "Failed to fetch vessels");
      }
    }
  );

  /**
   * GET /api/v1/vessels/:id
   * Get vessel by ID
   */
  app.get(
    "/api/v1/vessels/:id",
    authenticateToken,
    enforceTenantIsolation,
    requirePermission(Permission.VIEW_VESSELS),
    rateLimit(),
    async (req, res) => {
      try {
        const { id } = req.params;
        const vessel = await storage.getVessel(id, req.user!.tenantId);

        if (!vessel) {
          return notFoundError(res, "Vessel not found");
        }

        // Transform to view model
        const vesselViewModel = toVesselViewModel(vessel);
        successResponse(res, vesselViewModel);
      } catch (error) {
        console.error("Get vessel error:", error);
        internalServerError(res, "Failed to fetch vessel");
      }
    }
  );

  /**
   * POST /api/v1/vessels
   * Create new vessel
   */
  app.post(
    "/api/v1/vessels",
    authenticateToken,
    enforceTenantIsolation,
    requirePermission(Permission.MANAGE_VESSELS),
    rateLimit(),
    async (req, res) => {
      try {
        const { 
          fleetId,
          imoNumber,
          name,
          vesselType,
          flagState,
          grossTonnage,
          deadweightTonnage,
          mainEngineType,
          iceClass,
        } = req.body;

        if (!imoNumber || !name || !vesselType || !flagState || !grossTonnage) {
          return badRequestError(res, "Missing required fields");
        }

        // Validate IMO number format (IMO followed by 7 digits)
        const imoRegex = /^IMO\d{7}$/;
        if (!imoRegex.test(imoNumber)) {
          return badRequestError(res, "Invalid IMO number format. Expected format: IMO1234567");
        }

        // Verify fleet belongs to tenant if provided
        if (fleetId) {
          const fleet = await storage.getFleet(fleetId, req.user!.tenantId);
          if (!fleet) {
            return notFoundError(res, "Fleet not found");
          }
        }

        const vessel = await storage.createVessel({
          tenantId: req.user!.tenantId,
          fleetId,
          imoNumber,
          name,
          vesselType,
          flagState,
          grossTonnage,
          deadweightTonnage,
          mainEngineType,
          iceClass,
        });

        // Log audit event
        await storage.createAuditLog({
          tenantId: req.user!.tenantId,
          userId: req.user!.id,
          entityType: "vessel",
          entityId: vessel.id,
          action: "CREATE",
          newValueJson: vessel,
          requestId: req.requestId,
        });

        // Transform to view model
        const vesselViewModel = toVesselViewModel(vessel);
        createdResponse(res, vesselViewModel);
      } catch (error) {
        console.error("Create vessel error:", error);
        internalServerError(res, "Failed to create vessel");
      }
    }
  );

  /**
   * PUT /api/v1/vessels/:id
   * Update vessel
   */
  app.put(
    "/api/v1/vessels/:id",
    authenticateToken,
    enforceTenantIsolation,
    requirePermission(Permission.MANAGE_VESSELS),
    rateLimit(),
    async (req, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;

        const oldVessel = await storage.getVessel(id, req.user!.tenantId);
        if (!oldVessel) {
          return notFoundError(res, "Vessel not found");
        }

        const updated = await storage.updateVessel(id, req.user!.tenantId, updates);

        // Log audit event
        await storage.createAuditLog({
          tenantId: req.user!.tenantId,
          userId: req.user!.id,
          entityType: "vessel",
          entityId: id,
          action: "UPDATE",
          oldValueJson: oldVessel,
          newValueJson: updated,
          requestId: req.requestId,
        });

        // Transform to view model
        const vesselViewModel = updated ? toVesselViewModel(updated) : null;
        successResponse(res, vesselViewModel);
      } catch (error) {
        console.error("Update vessel error:", error);
        internalServerError(res, "Failed to update vessel");
      }
    }
  );

  /**
   * GET /api/v1/vessels/:id/voyages
   * Get voyages for vessel
   */
  app.get(
    "/api/v1/vessels/:id/voyages",
    authenticateToken,
    enforceTenantIsolation,
    requirePermission(Permission.VIEW_VOYAGES),
    rateLimit(),
    async (req, res) => {
      try {
        const { id } = req.params;
        
        // Verify vessel exists and belongs to tenant
        const vessel = await storage.getVessel(id, req.user!.tenantId);
        if (!vessel) {
          return notFoundError(res, "Vessel not found");
        }

        const voyages = await storage.getVoyagesByVessel(id, req.user!.tenantId);
        successResponse(res, voyages);
      } catch (error) {
        console.error("Get vessel voyages error:", error);
        internalServerError(res, "Failed to fetch voyages");
      }
    }
  );
}

