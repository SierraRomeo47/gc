import type { Express } from "express";
import { storage } from "../storage";
import { 
  authenticateToken,
  enforceTenantIsolation,
  rateLimit,
} from "../auth/middleware";
import { requirePermission, Permission } from "../auth/rbac";

export function registerTenantRoutes(app: Express) {
  /**
   * GET /api/v1/tenants/current
   * Get current tenant details
   */
  app.get(
    "/api/v1/tenants/current",
    authenticateToken,
    rateLimit(),
    async (req, res) => {
      try {
        const tenant = await storage.getTenant(req.user!.tenantId);
        
        if (!tenant) {
          return res.status(404).json({ error: "Tenant not found" });
        }

        res.json(tenant);
      } catch (error) {
        console.error("Get tenant error:", error);
        res.status(500).json({ error: "Failed to fetch tenant" });
      }
    }
  );

  /**
   * PUT /api/v1/tenants/current
   * Update current tenant
   */
  app.put(
    "/api/v1/tenants/current",
    authenticateToken,
    requirePermission(Permission.MANAGE_TENANT),
    rateLimit(),
    async (req, res) => {
      try {
        const { name, settingsJson } = req.body;
        const tenantId = req.user!.tenantId;

        const oldTenant = await storage.getTenant(tenantId);
        
        const updated = await storage.updateTenant(tenantId, {
          name,
          settingsJson,
        });

        if (!updated) {
          return res.status(404).json({ error: "Tenant not found" });
        }

        // Log audit event
        // await storage.createAuditLog({
        //   tenantId,
        //   userId: req.user!.id,
        //   entityType: "tenant",
        //   entityId: tenantId,
        //   action: "UPDATE",
        //   oldValueJson: oldTenant,
        //   newValueJson: updated,
        //   requestId: req.requestId,
        // });

        res.json(updated);
      } catch (error) {
        console.error("Update tenant error:", error);
        res.status(500).json({ error: "Failed to update tenant" });
      }
    }
  );

  /**
   * GET /api/v1/organizations
   * Get all organizations for tenant
   */
  app.get(
    "/api/v1/organizations",
    authenticateToken,
    enforceTenantIsolation,
    rateLimit(),
    async (req, res) => {
      try {
        const organizations = await storage.getOrganizationsByTenant(req.user!.tenantId);
        res.json(organizations);
      } catch (error) {
        console.error("Get organizations error:", error);
        res.status(500).json({ error: "Failed to fetch organizations" });
      }
    }
  );

  /**
   * POST /api/v1/organizations
   * Create new organization
   */
  app.post(
    "/api/v1/organizations",
    authenticateToken,
    enforceTenantIsolation,
    requirePermission(Permission.MANAGE_TENANT),
    rateLimit(),
    async (req, res) => {
      try {
        const { name, parentOrgId } = req.body;

        if (!name) {
          return res.status(400).json({ error: "Organization name required" });
        }

        const org = await storage.createOrganization({
          tenantId: req.user!.tenantId,
          name,
          parentOrgId,
        });

        // Log audit event
        // await storage.createAuditLog({
        //   tenantId: req.user!.tenantId,
        //   userId: req.user!.id,
        //   entityType: "organization",
        //   entityId: org.id,
        //   action: "CREATE",
        //   newValueJson: org,
        //   requestId: req.requestId,
        // });

        res.status(201).json(org);
      } catch (error) {
        console.error("Create organization error:", error);
        res.status(500).json({ error: "Failed to create organization" });
      }
    }
  );

  /**
   * GET /api/v1/organizations/:id
   * Get organization by ID
   */
  app.get(
    "/api/v1/organizations/:id",
    authenticateToken,
    enforceTenantIsolation,
    rateLimit(),
    async (req, res) => {
      try {
        const { id } = req.params;
        const org = await storage.getOrganization(id, req.user!.tenantId);

        if (!org) {
          return res.status(404).json({ error: "Organization not found" });
        }

        res.json(org);
      } catch (error) {
        console.error("Get organization error:", error);
        res.status(500).json({ error: "Failed to fetch organization" });
      }
    }
  );

  /**
   * GET /api/v1/organizations/:orgId/fleets
   * Get fleets for organization
   */
  app.get(
    "/api/v1/organizations/:orgId/fleets",
    authenticateToken,
    enforceTenantIsolation,
    rateLimit(),
    async (req, res) => {
      try {
        const { orgId } = req.params;
        const fleets = await storage.getFleetsByOrg(orgId, req.user!.tenantId);
        res.json(fleets);
      } catch (error) {
        console.error("Get fleets error:", error);
        res.status(500).json({ error: "Failed to fetch fleets" });
      }
    }
  );

  /**
   * POST /api/v1/fleets
   * Create new fleet
   */
  // Temporarily disabled conflicting fleet route
  // app.post(
  //   "/api/v1/fleets",
  //   authenticateToken,
  //   enforceTenantIsolation,
  //   requirePermission(Permission.MANAGE_VESSELS),
  //   rateLimit(),
  //   async (req, res) => {
  //     try {
  //       const { orgId, name, description } = req.body;

  //       if (!orgId || !name) {
  //         return res.status(400).json({ error: "Missing required fields" });
  //       }

  //       // Verify organization belongs to tenant
  //       const org = await storage.getOrganization(orgId, req.user!.tenantId);
  //       if (!org) {
  //         return res.status(404).json({ error: "Organization not found" });
  //       }

  //       const fleet = await storage.createFleet({
  //         orgId,
  //         name,
  //         description,
  //       });

  //       // Log audit event
  //       await storage.createAuditLog({
  //         tenantId: req.user!.tenantId,
  //         userId: req.user!.id,
  //         entityType: "fleet",
  //         entityId: fleet.id,
  //         action: "CREATE",
  //         newValueJson: fleet,
  //         requestId: req.requestId,
  //       });

  //       res.status(201).json(fleet);
  //     } catch (error) {
  //       console.error("Create fleet error:", error);
  //       res.status(500).json({ error: "Failed to create fleet" });
  //     }
  //   }
  // );

  /**
   * GET /api/v1/fleets/:id
   * Get fleet by ID
   */
  app.get(
    "/api/v1/fleets/:id",
    authenticateToken,
    enforceTenantIsolation,
    rateLimit(),
    async (req, res) => {
      try {
        const { id } = req.params;
        const fleet = await storage.getFleet(id, req.user!.tenantId);

        if (!fleet) {
          return res.status(404).json({ error: "Fleet not found" });
        }

        res.json(fleet);
      } catch (error) {
        console.error("Get fleet error:", error);
        res.status(500).json({ error: "Failed to fetch fleet" });
      }
    }
  );
}

