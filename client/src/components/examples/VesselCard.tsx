import VesselCard from '../VesselCard';

export default function VesselCardExample() {
  // todo: remove mock functionality
  const mockVessels = [
    {
      id: "1",
      name: "Atlantic Pioneer",
      imoNumber: "9876543",
      type: "Container Ship" as const,
      flag: "Germany",
      grossTonnage: 85000,
      complianceStatus: "compliant" as const,
      ghgIntensity: 82.4,
      targetIntensity: 89.3,
      fuelConsumption: 1250.5,
      creditBalance: 125.3
    },
    {
      id: "2",
      name: "Nordic Carrier",
      imoNumber: "9765432",
      type: "Bulk Carrier" as const,
      flag: "Norway",
      grossTonnage: 62000,
      complianceStatus: "warning" as const,
      ghgIntensity: 91.2,
      targetIntensity: 89.3,
      fuelConsumption: 980.2,
      creditBalance: -45.7
    },
    {
      id: "3",
      name: "Mediterranean Express",
      imoNumber: "9654321",
      type: "Oil Tanker" as const,
      flag: "Malta",
      grossTonnage: 120000,
      complianceStatus: "non-compliant" as const,
      ghgIntensity: 98.6,
      targetIntensity: 89.3,
      fuelConsumption: 1850.8,
      creditBalance: -298.4
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {mockVessels.map((vessel) => (
        <VesselCard key={vessel.id} {...vessel} />
      ))}
    </div>
  );
}