#!/usr/bin/env tsx
/**
 * Fleet and Organization Seeding Script
 * Creates sample organizations and fleets for testing fleet management
 */

import { storage } from "../storage";

async function seedOrganizationsAndFleets() {
  console.log("=".repeat(60));
  console.log("GHGConnect Organizations & Fleets Seeding");
  console.log("=".repeat(60));
  console.log("");

  try {
    // Get the existing tenant
    const tenants = await storage.getAllTenants();
    if (tenants.length === 0) {
      console.log("❌ No tenants found. Please run the main seeding script first.");
      return;
    }
    
    const tenant = tenants[0];
    console.log(`✓ Using tenant: ${tenant.name} (${tenant.id})`);

    // Create organizations
    const organizations = [
      {
        name: "European Operations Division",
        description: "Manages European coastal and short-sea operations",
        tenantId: tenant.id
      },
      {
        name: "Transatlantic Division", 
        description: "Handles long-distance transatlantic routes",
        tenantId: tenant.id
      },
      {
        name: "Specialized Services Division",
        description: "Manages specialized vessels and Arctic operations",
        tenantId: tenant.id
      }
    ];

    const createdOrgs = [];
    for (const orgData of organizations) {
      const org = await storage.createOrganization(orgData);
      createdOrgs.push(org);
      console.log(`✓ Created organization: ${org.name}`);
    }

    // Create fleets for each organization
    const fleetData = [
      // European Operations Division fleets
      {
        name: "North Sea Fleet",
        description: "Container ships and Ro-Ro vessels operating in North Sea routes",
        orgId: createdOrgs[0].id,
        tenantId: tenant.id
      },
      {
        name: "Baltic Fleet", 
        description: "Ice-class vessels for Baltic Sea operations",
        orgId: createdOrgs[0].id,
        tenantId: tenant.id
      },
      {
        name: "Mediterranean Fleet",
        description: "Container ships and tankers for Mediterranean routes",
        orgId: createdOrgs[0].id,
        tenantId: tenant.id
      },
      
      // Transatlantic Division fleets
      {
        name: "Transatlantic Container Fleet",
        description: "Large container ships for Europe-Americas routes",
        orgId: createdOrgs[1].id,
        tenantId: tenant.id
      },
      {
        name: "Transatlantic Tanker Fleet",
        description: "Oil and gas tankers for transatlantic trade",
        orgId: createdOrgs[1].id,
        tenantId: tenant.id
      },
      
      // Specialized Services Division fleets
      {
        name: "Arctic Fleet",
        description: "Icebreakers and ice-class vessels for Arctic operations",
        orgId: createdOrgs[2].id,
        tenantId: tenant.id
      },
      {
        name: "Green Technology Fleet",
        description: "LNG, methanol, and hydrogen-powered vessels",
        orgId: createdOrgs[2].id,
        tenantId: tenant.id
      }
    ];

    const createdFleets = [];
    for (const fleet of fleetData) {
      const createdFleet = await storage.createFleet(fleet);
      createdFleets.push(createdFleet);
      console.log(`✓ Created fleet: ${createdFleet.name} (${fleet.name})`);
    }

    console.log("");
    console.log("=".repeat(60));
    console.log("✅ Organizations & Fleets Seeding Complete!");
    console.log("=".repeat(60));
    console.log(`✓ Created ${createdOrgs.length} organizations`);
    console.log(`✓ Created ${createdFleets.length} fleets`);
    console.log("");
    console.log("Organizations:");
    createdOrgs.forEach(org => {
      console.log(`  • ${org.name}`);
    });
    console.log("");
    console.log("Fleets:");
    createdFleets.forEach(fleet => {
      console.log(`  • ${fleet.name} (${fleet.id})`);
    });

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  seedOrganizationsAndFleets()
    .then(() => {
      console.log("🎉 Organizations & Fleets seeding completed successfully!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

export { seedOrganizationsAndFleets };

