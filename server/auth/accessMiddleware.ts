import { Request, Response, NextFunction } from 'express';
import { AccessControlService } from '../services/accessControl';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        tenantId?: string;
      };
    }
  }
}

/**
 * Middleware to enforce fleet access
 * Verifies that the authenticated user has access to the specified fleet
 */
export const enforceFleetAccess = (fleetIdParam: string = 'fleetId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fleetId = req.params[fleetIdParam];
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!fleetId) {
        return res.status(400).json({ error: 'Fleet ID is required' });
      }

      const hasAccess = await AccessControlService.hasFleetAccess(userId, fleetId, userRole);
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied', 
          message: 'You do not have access to this fleet' 
        });
      }

      next();
    } catch (error) {
      console.error('Error in enforceFleetAccess middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to enforce vessel access
 * Verifies that the authenticated user has access to the specified vessel
 */
export const enforceVesselAccess = (vesselIdParam: string = 'vesselId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vesselId = req.params[vesselIdParam];
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!vesselId) {
        return res.status(400).json({ error: 'Vessel ID is required' });
      }

      const hasAccess = await AccessControlService.hasVesselAccess(userId, vesselId, userRole);
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied', 
          message: 'You do not have access to this vessel' 
        });
      }

      next();
    } catch (error) {
      console.error('Error in enforceVesselAccess middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to enforce access to multiple fleets
 * Verifies that the authenticated user has access to all specified fleets
 */
export const enforceMultipleFleetAccess = (fleetIdsParam: string = 'fleetIds') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fleetIds = req.body[fleetIdsParam] || req.query[fleetIdsParam];
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!fleetIds || !Array.isArray(fleetIds)) {
        return res.status(400).json({ error: 'Fleet IDs array is required' });
      }

      // Check access to all fleets
      const accessChecks = await Promise.all(
        fleetIds.map(fleetId => 
          AccessControlService.hasFleetAccess(userId, fleetId, userRole)
        )
      );

      const deniedFleets = fleetIds.filter((_, index) => !accessChecks[index]);
      
      if (deniedFleets.length > 0) {
        return res.status(403).json({ 
          error: 'Access denied', 
          message: `You do not have access to fleets: ${deniedFleets.join(', ')}` 
        });
      }

      next();
    } catch (error) {
      console.error('Error in enforceMultipleFleetAccess middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to enforce access to multiple vessels
 * Verifies that the authenticated user has access to all specified vessels
 */
export const enforceMultipleVesselAccess = (vesselIdsParam: string = 'vesselIds') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vesselIds = req.body[vesselIdsParam] || req.query[vesselIdsParam];
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!vesselIds || !Array.isArray(vesselIds)) {
        return res.status(400).json({ error: 'Vessel IDs array is required' });
      }

      // Check access to all vessels
      const accessChecks = await Promise.all(
        vesselIds.map(vesselId => 
          AccessControlService.hasVesselAccess(userId, vesselId, userRole)
        )
      );

      const deniedVessels = vesselIds.filter((_, index) => !accessChecks[index]);
      
      if (deniedVessels.length > 0) {
        return res.status(403).json({ 
          error: 'Access denied', 
          message: `You do not have access to vessels: ${deniedVessels.join(', ')}` 
        });
      }

      next();
    } catch (error) {
      console.error('Error in enforceMultipleVesselAccess middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to filter vessels based on user access
 * Automatically filters vessel lists to only include accessible vessels
 */
export const filterVesselsByAccess = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to filter vessels
      res.json = function(data: any) {
        if (Array.isArray(data)) {
          // Filter vessels based on user access
          const filterVessels = async () => {
            const accessibleVessels = await AccessControlService.getUserAccessibleVessels(userId, userRole);
            const accessibleVesselIds = new Set(accessibleVessels.map(v => v.id));
            
            return data.filter((item: any) => {
              // If item has vesselId, check access to that vessel
              if (item.vesselId) {
                return accessibleVesselIds.has(item.vesselId);
              }
              // If item is a vessel itself, check direct access
              if (item.id) {
                return accessibleVesselIds.has(item.id);
              }
              // If item has vessels array, filter it
              if (item.vessels && Array.isArray(item.vessels)) {
                item.vessels = item.vessels.filter((vessel: any) => 
                  accessibleVesselIds.has(vessel.id)
                );
                return item.vessels.length > 0;
              }
              return true;
            });
          };

          return filterVessels().then(filteredData => {
            return originalJson.call(this, filteredData);
          });
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Error in filterVesselsByAccess middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to filter fleets based on user access
 * Automatically filters fleet lists to only include accessible fleets
 */
export const filterFleetsByAccess = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to filter fleets
      res.json = function(data: any) {
        if (Array.isArray(data)) {
          // Filter fleets based on user access
          const filterFleets = async () => {
            const accessibleFleets = await AccessControlService.getUserAccessibleFleets(userId, userRole);
            const accessibleFleetIds = new Set(accessibleFleets.map(f => f.id));
            
            return data.filter((item: any) => {
              // If item has fleetId, check access to that fleet
              if (item.fleetId) {
                return accessibleFleetIds.has(item.fleetId);
              }
              // If item is a fleet itself, check direct access
              if (item.id) {
                return accessibleFleetIds.has(item.id);
              }
              // If item has fleets array, filter it
              if (item.fleets && Array.isArray(item.fleets)) {
                item.fleets = item.fleets.filter((fleet: any) => 
                  accessibleFleetIds.has(fleet.id)
                );
                return item.fleets.length > 0;
              }
              return true;
            });
          };

          return filterFleets().then(filteredData => {
            return originalJson.call(this, filteredData);
          });
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Error in filterFleetsByAccess middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

/**
 * Middleware to require admin or owner role
 * Used for operations that only admins/owners can perform
 */
export const requireAdminOrOwner = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!['ADMIN', 'OWNER'].includes(userRole)) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Admin or Owner role required' 
      });
    }

    next();
  };
};

/**
 * Middleware to require specific role
 * Used for operations that require a specific role
 */
export const requireRole = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: `Required roles: ${requiredRoles.join(', ')}` 
      });
    }

    next();
  };
};

/**
 * Middleware to enforce tenant isolation
 * Ensures users can only access data from their own tenant
 */
export const enforceTenantIsolation = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userTenantId = req.user?.tenantId;
    const requestTenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;

    if (!userTenantId) {
      return res.status(401).json({ error: 'User tenant ID not found' });
    }

    if (requestTenantId && requestTenantId !== userTenantId) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Cannot access data from different tenant' 
      });
    }

    // Add tenant ID to request for downstream use
    req.tenantId = userTenantId;
    next();
  };
};


