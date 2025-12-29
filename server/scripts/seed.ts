#!/usr/bin/env tsx
/**
 * Seed script to populate reference data (ports, fuels)
 * Run with: npm run db:seed
 */

import { seedReferenceData, getReferenceDataStats } from "../data/seedData";

async function main() {
  console.log("=".repeat(60));
  console.log("GHGConnect Reference Data Seeding");
  console.log("=".repeat(60));
  console.log("");

  try {
    // Check current stats
    console.log("Checking existing data...");
    const beforeStats = await getReferenceDataStats();
    console.log(`Current ports: ${beforeStats.portsCount}`);
    console.log(`Current fuels: ${beforeStats.fuelsCount}`);
    console.log("");

    // Run seeding
    await seedReferenceData();

    // Check after stats
    console.log("");
    const afterStats = await getReferenceDataStats();
    console.log("=".repeat(60));
    console.log("Final Statistics:");
    console.log(`Total ports: ${afterStats.portsCount}`);
    console.log(`Total fuels: ${afterStats.fuelsCount}`);
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error("❌ Seeding failed:");
    console.error(error);
    process.exit(1);
  }
}

main();

