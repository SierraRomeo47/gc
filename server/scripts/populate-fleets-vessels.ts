import { storage } from '../storage';

/**
 * Script to populate memory storage with fleets and vessels for testing
 * This creates 4 fleets and assigns the 26 vessels to them
 */

async function populateFleetsAndVessels() {
  console.log('Creating fleets and assigning vessels...');

  try {
    // Create 4 fleets
    const fleet1 = await storage.createFleet({
      orgId: 'org-1',
      name: 'European Coastal Fleet',
      description: 'Fleet operating in European coastal waters with focus on short-haul routes'
    });

    const fleet2 = await storage.createFleet({
      orgId: 'org-1', 
      name: 'Transatlantic Fleet',
      description: 'Long-distance fleet operating transatlantic routes between Europe and Americas'
    });

    const fleet3 = await storage.createFleet({
      orgId: 'org-1',
      name: 'Mediterranean Fleet', 
      description: 'Fleet specializing in Mediterranean and Black Sea operations'
    });

    const fleet4 = await storage.createFleet({
      orgId: 'org-1',
      name: 'Arctic Fleet',
      description: 'Specialized fleet for Arctic and Northern European operations'
    });

    console.log('Created fleets:', {
      fleet1: fleet1.id,
      fleet2: fleet2.id, 
      fleet3: fleet3.id,
      fleet4: fleet4.id
    });

    // Get all vessels
    const vessels = await storage.getVesselsByTenant('demo');
    console.log(`Found ${vessels.length} vessels to assign`);

    // Assign vessels to fleets based on their characteristics
    const vesselAssignments = {
      [fleet1.id]: ['Adriatic Star', 'Celtic Pride', 'Nordic Explorer', 'Baltic Star', 'Scandinavian Queen'],
      [fleet2.id]: ['Atlantic Pioneer', 'Ocean Voyager', 'Maritime Express', 'Global Navigator', 'Pacific Explorer', 'Continental Carrier', 'International Trader', 'Worldwide Merchant', 'Universal Carrier'],
      [fleet3.id]: ['Mediterranean Star', 'Aegean Explorer', 'Ionian Navigator', 'Adriatic Express', 'Tyrrhenian Voyager', 'Black Sea Trader', 'Levant Carrier', 'Caspian Merchant'],
      [fleet4.id]: ['Arctic Guardian', 'Nordic Explorer', 'Polar Pioneer', 'Fjord Navigator', 'Icebreaker Express', 'Northern Star', 'Aurora Voyager', 'Frost Trader']
    };

    let assignedCount = 0;
    for (const [fleetId, vesselNames] of Object.entries(vesselAssignments)) {
      for (const vesselName of vesselNames) {
        const vessel = vessels.find(v => v.name === vesselName);
        if (vessel) {
          await storage.updateVessel(vessel.id, 'demo', { fleetId });
          assignedCount++;
          console.log(`Assigned ${vesselName} to fleet ${fleetId}`);
        } else {
          console.warn(`Vessel ${vesselName} not found`);
        }
      }
    }

    console.log(`Successfully assigned ${assignedCount} vessels to fleets`);

    // Verify assignments
    const allFleets = await storage.getAllFleets();
    console.log('\nFleet Summary:');
    for (const fleet of allFleets) {
      const fleetVessels = await storage.getVesselsByFleet(fleet.id, 'demo');
      console.log(`${fleet.name}: ${fleetVessels.length} vessels`);
      console.log(`  Vessels: ${fleetVessels.map(v => v.name).join(', ')}`);
    }

  } catch (error) {
    console.error('Error populating fleets and vessels:', error);
  }
}

// Run the script
if (require.main === module) {
  populateFleetsAndVessels()
    .then(() => {
      console.log('Fleet and vessel population completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { populateFleetsAndVessels };
