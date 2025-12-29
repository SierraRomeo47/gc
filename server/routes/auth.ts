import type { Express } from "express";
import bcrypt from "bcrypt";
import { storage } from "../storage";
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  addRequestId,
  rateLimit,
} from "../auth/middleware";
import { generateMFASecret, verifyMFAToken, isValidMFATokenFormat } from "../auth/mfa";
import { Role } from "../auth/rbac";
import { BackendRole, toFrontendRole } from "@shared/roleMapper";

export function registerAuthRoutes(app: Express) {
  // Request ID middleware
  app.use(addRequestId);

  /**
   * POST /api/v1/auth/register
   * Register a new user and create default tenant
   */
  app.post("/api/v1/auth/register", rateLimit(), async (req, res) => {
    try {
      const { username, email, password, tenantName } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ error: "Email already exists" });
      }

      // Create tenant
      const tenant = await storage.createTenant({
        name: tenantName || `${username}'s Organization`,
      });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        tenantId: tenant.id,
      });

      // Create default organization
      const org = await storage.createOrganization({
        tenantId: tenant.id,
        name: "Default Organization",
      });

      // Assign OWNER role
      await storage.createUserRole({
        userId: user.id,
        tenantId: tenant.id,
        role: Role.OWNER,
      });

      // Log audit event
      await storage.createAuditLog({
        tenantId: tenant.id,
        userId: user.id,
        entityType: "user",
        entityId: user.id,
        action: "REGISTER",
        newValueJson: { username, email, role: Role.OWNER },
        requestId: req.requestId,
      });

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          tenantId: user.tenantId,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  /**
   * POST /api/v1/auth/login
   * Authenticate user and return tokens
   */
  app.post("/api/v1/auth/login", rateLimit(), async (req, res) => {
    try {
      const { username, password, mfaToken } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check MFA if enabled
      if (user.mfaEnabled) {
        if (!mfaToken) {
          return res.status(403).json({ 
            error: "MFA token required",
            mfaRequired: true 
          });
        }

        if (!isValidMFATokenFormat(mfaToken)) {
          return res.status(400).json({ error: "Invalid MFA token format" });
        }

        const validToken = verifyMFAToken(user.mfaSecret!, mfaToken);
        if (!validToken) {
          return res.status(401).json({ error: "Invalid MFA token" });
        }
      }

      // Get user role
      const roles = await storage.getUserRoles(user.id, user.tenantId!);
      const role = roles[0]?.role || Role.VERIFIER_RO;

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

      // Generate tokens
      const payload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        tenantId: user.tenantId!,
        role,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Log audit event
      await storage.createAuditLog({
        tenantId: user.tenantId!,
        userId: user.id,
        entityType: "auth",
        action: "LOGIN",
        newValueJson: { username, timestamp: new Date() },
        requestId: req.requestId,
      });

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          tenantId: user.tenantId,
          role,
          roleDisplay: toFrontendRole(role), // Include frontend-compatible role
          mfaEnabled: user.mfaEnabled,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token using refresh token
   */
  app.post("/api/v1/auth/refresh", rateLimit(), async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token required" });
      }

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Get latest user data
      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Get current role
      const roles = await storage.getUserRoles(user.id, user.tenantId!);
      const role = roles[0]?.role || Role.VERIFIER_RO;

      // Generate new tokens
      const newPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        tenantId: user.tenantId!,
        role,
      };

      const newAccessToken = generateAccessToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(401).json({ error: "Invalid refresh token" });
    }
  });

  /**
   * POST /api/v1/auth/mfa/setup
   * Setup MFA for user
   */
  app.post("/api/v1/auth/mfa/setup", rateLimit(), async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate MFA secret
      const mfaSetup = await generateMFASecret(user.username);

      // Store secret (not enabled yet)
      await storage.updateUser(user.id, {
        mfaSecret: mfaSetup.secret,
      });

      res.json({
        secret: mfaSetup.secret,
        qrCode: mfaSetup.qrCode,
        backupCodes: mfaSetup.backupCodes,
      });
    } catch (error) {
      console.error("MFA setup error:", error);
      res.status(500).json({ error: "MFA setup failed" });
    }
  });

  /**
   * POST /api/v1/auth/mfa/verify
   * Verify and enable MFA
   */
  app.post("/api/v1/auth/mfa/verify", rateLimit(), async (req, res) => {
    try {
      const { username, password, token } = req.body;

      if (!username || !password || !token) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!isValidMFATokenFormat(token)) {
        return res.status(400).json({ error: "Invalid MFA token format" });
      }

      // Verify user
      const user = await storage.getUserByUsername(username);
      if (!user || !user.mfaSecret) {
        return res.status(401).json({ error: "Invalid request" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify token
      const validToken = verifyMFAToken(user.mfaSecret, token);
      if (!validToken) {
        return res.status(401).json({ error: "Invalid MFA token" });
      }

      // Enable MFA
      await storage.updateUser(user.id, {
        mfaEnabled: true,
      });

      // Log audit event
      await storage.createAuditLog({
        tenantId: user.tenantId!,
        userId: user.id,
        entityType: "auth",
        action: "MFA_ENABLED",
        newValueJson: { username },
        requestId: req.requestId,
      });

      res.json({ message: "MFA enabled successfully" });
    } catch (error) {
      console.error("MFA verify error:", error);
      res.status(500).json({ error: "MFA verification failed" });
    }
  });

  /**
   * POST /api/v1/auth/logout
   * Logout user (client-side token removal)
   */
  app.post("/api/v1/auth/logout", async (req, res) => {
    // In a stateless JWT setup, logout is primarily client-side
    // Here we just log the event
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (token) {
        // Could verify token and log audit event
        // For now, just acknowledge
      }

      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.json({ message: "Logged out successfully" });
    }
  });
}

