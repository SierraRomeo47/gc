import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { addRequestId } from "./auth/middleware";
import { sanitizeInputs } from "./middleware/validation";

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5000'];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request ID for tracing
app.use(addRequestId);

// Sanitize all inputs (XSS prevention)
app.use(sanitizeInputs);

// Rate limiting and SQL injection prevention removed for prototype development

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: unknown;

  const originalResJson = res.json.bind(res) as typeof res.json;
  res.json = ((bodyJson?: unknown) => {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson);
  }) as typeof res.json;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse !== undefined) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("🚀 GHGConnect Server Starting");
    console.log("=".repeat(70));
    console.log(`📦 ENVIRONMENT: ${(process.env.NODE_ENV || 'development').toUpperCase()}`);
    console.log(`🗄️  DATABASE: ${process.env.POSTGRES_DB || 'ghgconnect_db'}`);
    console.log(`🔌 PORT: ${process.env.PORT || '5000'}`);
    console.log(`⏰ STARTED: ${new Date().toISOString()}`);
    console.log("=".repeat(70) + "\n");
    
    // Validate required environment variables
    const requiredEnvVars = ['DATABASE_URL'];
    const missing = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
      console.error("\n" + "=".repeat(70));
      console.error("❌ FATAL ERROR: Missing required environment variables");
      console.error("=".repeat(70));
      console.error(`Missing: ${missing.join(', ')}`);
      console.error("\nSet DATABASE_URL in your .env file or environment.");
      console.error("See .env.template for examples.");
      console.error("=".repeat(70) + "\n");
      process.exit(1);
    }
    
    // Validate required environment variables in production
    if (process.env.NODE_ENV === 'production') {
      console.log("⚠️  WARNING: Running in PRODUCTION mode!");
      console.log("⚠️  All database operations will affect production data!");
      
      const prodRequiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
      const prodMissing = prodRequiredEnvVars.filter(v => !process.env[v]);
      
      if (prodMissing.length > 0) {
        console.error("\n" + "=".repeat(70));
        console.error("❌ FATAL ERROR: Missing required environment variables");
        console.error("=".repeat(70));
        console.error(`Missing: ${prodMissing.join(', ')}`);
        console.error("\nSet these variables in your .env file or environment.");
        console.error("See .env.template for examples.");
        console.error("=".repeat(70) + "\n");
        process.exit(1);
      }
      
      // Warn about weak passwords
      const weakPatterns = ['password', '123456', 'admin', 'test', 'dev'];
      const dbUrl = process.env.DATABASE_URL || '';
      const hasWeakPassword = weakPatterns.some(pattern => dbUrl.toLowerCase().includes(pattern));
      
      if (hasWeakPassword) {
        console.error("\n❌ ERROR: Weak or default password detected in DATABASE_URL!");
        console.error("❌ Use a strong, unique password for production.");
        console.error("❌ Generate one with: openssl rand -base64 32\n");
        process.exit(1);
      }
      
      console.log("=".repeat(70) + "\n");
    }
    
    console.log("Starting server setup...");
    
    // Initialize reference data (ports, fuels) if not already present
    try {
      const { seedReferenceData, getReferenceDataStats } = await import('./data/seedData');
      const stats = await getReferenceDataStats();
      
      if (stats.portsCount === 0 || stats.fuelsCount === 0) {
        console.log("No reference data found. Seeding initial data...");
        await seedReferenceData();
      } else {
        console.log(`Reference data already present: ${stats.portsCount} ports, ${stats.fuelsCount} fuels`);
      }
    } catch (error) {
      console.warn("Failed to seed reference data (continuing anyway):", error);
    }
    
    const server = await registerRoutes(app);
    console.log("Routes registered successfully");

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      console.log("Setting up Vite in development mode...");
      await setupVite(app, server);
      console.log("Vite setup complete");
    } else {
      serveStatic(app);
    }

    // 404 handler (must be after all routes)
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    console.log(`Starting server on port ${port}...`);
    server.listen(port, () => {
      console.log("\n" + "=".repeat(70));
      console.log("✅ GHGConnect Server Ready");
      console.log("=".repeat(70));
      console.log(`🌐 Server URL: http://localhost:${port}`);
      console.log(`📊 Environment: ${(process.env.NODE_ENV || 'development').toUpperCase()}`);
      console.log(`🗄️  Database: ${process.env.POSTGRES_DB || 'ghgconnect_db'}`);
      console.log("=".repeat(70) + "\n");
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("\n" + "=".repeat(70));
    console.error("❌ Server setup failed");
    console.error("=".repeat(70));
    console.error(error);
    console.error("=".repeat(70) + "\n");
    process.exit(1);
  }
})();
