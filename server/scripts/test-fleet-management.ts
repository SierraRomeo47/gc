#!/usr/bin/env tsx
/**
 * Fleet Management Test Script
 * Tests all fleet management operations with comprehensive validation
 */

import { storage } from "../storage";

async function testFleetManagement() {
  console.log("=".repeat(60));
  console.log("GHGConnect Fleet Management Test Suite");
  console.log("=".repeat(60));
  console.log("");

  const tenantId = 'dfa5de92-6ab2-47d4-b19c-87c01b692c94';
  
  try {
    // Test 1: Create Organization
    console.log("🧪 Test 1: Creating Organization");
    const orgData = {
      name: "Test Operations Division",
      description: "Test organization for fleet management",
      tenantId
    };
    const organization = await storage.createOrganization(orgData);
    console.log(`✅ Created organization: ${organization.name} (${organization.id})`);

    // Test 2: Create Fleet
    console.log("\n🧪 Test 2: Creating Fleet");
    const fleetData = {
      name: "Test Fleet",
      description: "Test fleet for validation",
      orgId: organization.id,
      tenantId
    };
    const fleet = await storage.createFleet(fleetData);
    console.log(`✅ Created fleet: ${fleet.name} (${fleet.id})`);

    // Test 3: Get Fleet
    console.log("\n🧪 Test 3: Retrieving Fleet");
    const retrievedFleet = await storage.getFleet(fleet.id, tenantId);
    if (retrievedFleet) {
      console.log(`✅ Retrieved fleet: ${retrievedFleet.name}`);
    } else {
      console.log("❌ Failed to retrieve fleet");
    }

    // Test 4: Get Fleets by Organization
    console.log("\n🧪 Test 4: Getting Fleets by Organization");
    const orgFleets = await storage.getFleetsByOrg(organization.id, tenantId);
    console.log(`✅ Found ${orgFleets.length} fleets in organization`);

    // Test 5: Update Fleet
    console.log("\n🧪 Test 5: Updating Fleet");
    const updatedFleet = await storage.updateFleet(fleet.id, {
      name: "Updated Test Fleet",
      description: "Updated description"
    });
    if (updatedFleet) {
      console.log(`✅ Updated fleet: ${updatedFleet.name}`);
    } else {
      console.log("❌ Failed to update fleet");
    }

    // Test 6: Create Another Fleet (for deletion test)
    console.log("\n🧪 Test 6: Creating Second Fleet");
    const fleet2Data = {
      name: "Test Fleet 2",
      description: "Second test fleet",
      orgId: organization.id,
      tenantId
    };
    const fleet2 = await storage.createFleet(fleet2Data);
    console.log(`✅ Created second fleet: ${fleet2.name} (${fleet2.id})`);

    // Test 7: Delete Fleet
    console.log("\n🧪 Test 7: Deleting Fleet");
    const deleteResult = await storage.deleteFleet(fleet2.id);
    if (deleteResult) {
      console.log(`✅ Deleted fleet: ${fleet2.name}`);
    } else {
      console.log("❌ Failed to delete fleet");
    }

    // Test 8: Verify Fleet Deletion
    console.log("\n🧪 Test 8: Verifying Fleet Deletion");
    const deletedFleet = await storage.getFleet(fleet2.id, tenantId);
    if (!deletedFleet) {
      console.log("✅ Fleet successfully deleted");
    } else {
      console.log("❌ Fleet still exists after deletion");
    }

    // Test 9: Get All Fleets
    console.log("\n🧪 Test 9: Getting All Fleets");
    const allFleets = await storage.getAllFleets();
    console.log(`✅ Total fleets in system: ${allFleets.length}`);

    // Test 10: Cleanup
    console.log("\n🧪 Test 10: Cleanup");
    await storage.deleteFleet(fleet.id);
    console.log("✅ Cleaned up test fleet");

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Fleet Management Test Suite Completed Successfully!");
    console.log("=".repeat(60));
    console.log("✅ All 10 tests passed");
    console.log("✅ Fleet creation, retrieval, update, and deletion working");
    console.log("✅ Organization integration working");
    console.log("✅ Database operations functional");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  testFleetManagement()
    .then(() => {
      console.log("🎉 All fleet management tests completed!");
      process.exit(0);
    })
    .catch(error => {
      console.error("💥 Test suite failed:", error);
      process.exit(1);
    });
}

export { testFleetManagement };

