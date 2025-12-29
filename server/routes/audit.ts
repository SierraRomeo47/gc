import type { Express } from "express";
import { storage } from "../storage";
import { 
  authenticateToken,
  enforceTenantIsolation,
  rateLimit,
} from "../auth/middleware";
import { requirePermission, Permission } from "../auth/rbac";

export function registerAuditRoutes(app: Express) {
  /**
   * GET /api/v1/audit
   * Get audit logs with filtering
   */
  app.get(
    "/api/v1/audit",
    authenticateToken,
    enforceTenantIsolation,
    requirePermission(Permission.VIEW_AUDIT_LOGS),
    rateLimit(),
    async (req, res) => {
      try {
        const { 
          entityType, 
          entityId, 
          userId, 
          action, 
          startDate, 
          endDate,
          limit,
        } = req.query;

        const filters: any = {};
        
        if (entityType) filters.entityType = entityType as string;
        if (entityId) filters.entityId = entityId as string;
        if (userId) filters.userId = userId as string;
        if (action) filters.action = action as string;
        if (startDate) filters.startDate = new Date(startDate as string);
        if (endDate) filters.endDate = new Date(endDate as string);
        if (limit) filters.limit = parseInt(limit as string, 10);

        const logs = await storage.getAuditLogs(req.user!.tenantId, filters);

        res.json({
          logs,
          total: logs.length,
          filters,
        });
      } catch (error) {
        console.error("Get audit logs error:", error);
        res.status(500).json({ error: "Failed to fetch audit logs" });
      }
    }
  );

  /**
   * GET /api/v1/audit/entity/:entityType/:entityId
   * Get audit trail for specific entity
   */
  app.get(
    "/api/v1/audit/entity/:entityType/:entityId",
    authenticateToken,
    enforceTenantIsolation,
    requirePermission(Permission.VIEW_AUDIT_LOGS),
    rateLimit(),
    async (req, res) => {
      try {
        const { entityType, entityId } = req.params;

        const logs = await storage.getAuditLogs(req.user!.tenantId, {
          entityType,
          entityId,
        });

        res.json({
          entityType,
          entityId,
          logs,
          total: logs.length,
        });
      } catch (error) {
        console.error("Get entity audit trail error:", error);
        res.status(500).json({ error: "Failed to fetch audit trail" });
      }
    }
  );

  /**
   * GET /api/v1/audit/user/:userId
   * Get audit logs for specific user
   */
  app.get(
    "/api/v1/audit/user/:userId",
    authenticateToken,
    enforceTenantIsolation,
    requirePermission(Permission.VIEW_AUDIT_LOGS),
    rateLimit(),
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { limit } = req.query;

        const logs = await storage.getAuditLogs(req.user!.tenantId, {
          userId,
          limit: limit ? parseInt(limit as string, 10) : undefined,
        });

        res.json({
          userId,
          logs,
          total: logs.length,
        });
      } catch (error) {
        console.error("Get user audit logs error:", error);
        res.status(500).json({ error: "Failed to fetch user audit logs" });
      }
    }
  );
}

