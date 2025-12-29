#!/usr/bin/env tsx
/**
 * Database seeding script that ensures database connection before seeding
 * Run with: npm run db:seed
 */

import { db, pool } from "../db";
import { storage } from "../storage";
import bcrypt from "bcrypt";

async function waitForDatabase(maxAttempts = 10, delay = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      if (pool && db) {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log('✅ Database connection verified');
        return true;
      }
    } catch (error) {
      console.log(`⏳ Waiting for database connection... (attempt ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Database connection timeout');
}

async function seedDatabase() {
  console.log("=".repeat(60));
  console.log("GHGConnect Database Seeding");
  console.log("=".repeat(60));
  console.log("");

  try {
    // Wait for database connection
    await waitForDatabase();
    
    // Check if data already exists
    const existingVessels = await storage.getVesselsByTenant('demo');
    if (existingVessels.length > 0) {
      console.log(`⚠️  Database already contains ${existingVessels.length} vessels`);
      console.log("   Skipping seeding to avoid duplicates");
      return;
    }

    console.log("🌱 Starting database seeding...");
    
    // Create tenant
    const tenant = await storage.createTenant({
      name: 'Global Shipping Corporation',
      settings: { currency: 'EUR', timezone: 'UTC' }
    });
    console.log(`✓ Created tenant: ${tenant.name}`);

    // Create users
    const users = [
      {
        username: 'admin',
        email: 'admin@ghgconnect.com',
        password: await bcrypt.hash('admin123', 10),
        name: 'Admin User',
        tenantId: tenant.id
      },
      {
        username: 'compliance',
        email: 'compliance@ghgconnect.com', 
        password: await bcrypt.hash('admin123', 10),
        name: 'Compliance Officer',
        tenantId: tenant.id
      },
      {
        username: 'fleetmanager',
        email: 'fleetmanager@ghgconnect.com',
        password: await bcrypt.hash('admin123', 10),
        name: 'Fleet Manager',
        tenantId: tenant.id
      }
    ];

    for (const userData of users) {
      const user = await storage.createUser(userData);
      console.log(`✓ Created user: ${user.username} (${user.email})`);
    }

    // Create organization
    const org = await storage.createOrganization({
      name: 'Fleet Operations Division',
      tenantId: tenant.id
    });
    console.log(`✓ Created organization: ${org.name}`);

    // Create fleet
    const fleet = await storage.createFleet({
      name: 'European Trade Fleet',
      orgId: org.id,
      tenantId: tenant.id
    });
    console.log(`✓ Created fleet: ${fleet.name}`);

    // Create 26 vessels
    const vessels = [
      { name: 'Atlantic Pioneer', imoNumber: 'IMO9876543', type: 'Container Ship', flag: 'NL', grossTonnage: 50000, mainEngineType: 'Diesel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Nordic Explorer', imoNumber: 'IMO9876544', type: 'Bulk Carrier', flag: 'NO', grossTonnage: 45000, mainEngineType: 'Diesel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Baltic Star', imoNumber: 'IMO9876545', type: 'Tanker', flag: 'DK', grossTonnage: 55000, mainEngineType: 'Diesel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Mediterranean Express', imoNumber: 'IMO9876546', type: 'Container Ship', flag: 'IT', grossTonnage: 48000, mainEngineType: 'LNG Dual-Fuel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Thames Voyager', imoNumber: 'IMO9876547', type: 'Ro-Ro Cargo', flag: 'GB', grossTonnage: 35000, mainEngineType: 'Diesel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Arctic Guardian', imoNumber: 'IMO9876548', type: 'Tanker', flag: 'FI', grossTonnage: 68000, mainEngineType: 'Diesel', iceClass: '1A Super', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Polar Navigator', imoNumber: 'IMO9876549', type: 'Tanker', flag: 'NO', grossTonnage: 72000, mainEngineType: 'Diesel', iceClass: '1A', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Baltic Ice', imoNumber: 'IMO9876550', type: 'Tanker', flag: 'SE', grossTonnage: 65000, mainEngineType: 'Diesel', iceClass: '1A Super', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Northern Frost', imoNumber: 'IMO9876551', type: 'Tanker', flag: 'DK', grossTonnage: 70000, mainEngineType: 'LNG Dual-Fuel', iceClass: '1A', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Europa Link', imoNumber: 'IMO9876552', type: 'Ro-Ro Passenger', flag: 'DE', grossTonnage: 42000, mainEngineType: 'Diesel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Coastal Trader', imoNumber: 'IMO9876553', type: 'General Cargo', flag: 'NL', grossTonnage: 28000, mainEngineType: 'Diesel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Baltic Express', imoNumber: 'IMO9876554', type: 'Container Ship', flag: 'PL', grossTonnage: 38000, mainEngineType: 'Diesel', iceClass: '1C', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Adriatic Star', imoNumber: 'IMO9876555', type: 'Ro-Ro Cargo', flag: 'IT', grossTonnage: 32000, mainEngineType: 'LNG Dual-Fuel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Celtic Pride', imoNumber: 'IMO9876556', type: 'Ro-Ro Passenger', flag: 'GB', grossTonnage: 46000, mainEngineType: 'Diesel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Canary Islander', imoNumber: 'IMO9876557', type: 'Container Ship', flag: 'ES', grossTonnage: 35000, mainEngineType: 'Diesel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Azores Connector', imoNumber: 'IMO9876558', type: 'General Cargo', flag: 'PT', grossTonnage: 29000, mainEngineType: 'Diesel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Madeira Express', imoNumber: 'IMO9876559', type: 'Container Ship', flag: 'PT', grossTonnage: 33000, mainEngineType: 'Diesel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Martinique Trader', imoNumber: 'IMO9876560', type: 'Container Ship', flag: 'FR', grossTonnage: 31000, mainEngineType: 'Diesel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Reunion Link', imoNumber: 'IMO9876561', type: 'General Cargo', flag: 'FR', grossTonnage: 27000, mainEngineType: 'Diesel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Green Pioneer', imoNumber: 'IMO9876562', type: 'Container Ship', flag: 'DK', grossTonnage: 52000, mainEngineType: 'Methanol Dual-Fuel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Hydrogen Explorer', imoNumber: 'IMO9876563', type: 'Tanker', flag: 'NO', grossTonnage: 48000, mainEngineType: 'Hydrogen', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Electric Horizon', imoNumber: 'IMO9876564', type: 'Ro-Ro Cargo', flag: 'SE', grossTonnage: 25000, mainEngineType: 'Battery-Electric', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Global Titan', imoNumber: 'IMO9876565', type: 'Container Ship', flag: 'MT', grossTonnage: 98000, mainEngineType: 'Diesel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Ocean Voyager', imoNumber: 'IMO9876566', type: 'Bulk Carrier', flag: 'CY', grossTonnage: 85000, mainEngineType: 'Diesel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'Mediterranean Pride', imoNumber: 'IMO9876567', type: 'Tanker', flag: 'GR', grossTonnage: 92000, mainEngineType: 'Diesel', tenantId: tenant.id, fleetId: fleet.id },
      { name: 'North Sea Trader', imoNumber: 'IMO9876568', type: 'General Cargo', flag: 'BE', grossTonnage: 38000, mainEngineType: 'LNG Dual-Fuel', tenantId: tenant.id, fleetId: fleet.id }
    ];

    for (const vesselData of vessels) {
      const vessel = await storage.createVessel(vesselData);
      console.log(`✓ Created vessel: ${vessel.name} (${vessel.imoNumber})`);
    }

    console.log("");
    console.log("=".repeat(60));
    console.log("✅ Database seeding complete!");
    console.log("=".repeat(60));
    console.log(`✓ Created ${vessels.length} vessels`);
    console.log(`✓ Created ${users.length} users`);
    console.log(`✓ Created 1 tenant, 1 organization, 1 fleet`);
    console.log("");
    console.log("Login credentials:");
    console.log("- Admin: admin@ghgconnect.com / admin123");
    console.log("- Compliance: compliance@ghgconnect.com / admin123");
    console.log("- Fleet Manager: fleetmanager@ghgconnect.com / admin123");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("🎉 Seeding completed successfully!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

export { seedDatabase };

