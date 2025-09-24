import VoyageDataTable from '../VoyageDataTable';

export default function VoyageDataTableExample() {
  // todo: remove mock functionality
  const mockVoyages = [
    {
      id: "1",
      vessel: "Atlantic Pioneer",
      departure: "Hamburg",
      arrival: "Rotterdam",
      distance: 285,
      fuelType: "MGO",
      fuelConsumed: 125.5,
      ghgIntensity: 85.2,
      complianceStatus: "compliant" as const,
      voyageType: "intra-eu" as const,
      date: "2025-01-15"
    },
    {
      id: "2",
      vessel: "Nordic Carrier",
      departure: "Oslo",
      arrival: "Copenhagen",
      distance: 320,
      fuelType: "HFO",
      fuelConsumed: 180.3,
      ghgIntensity: 91.8,
      complianceStatus: "warning" as const,
      voyageType: "intra-eu" as const,
      date: "2025-01-14"
    },
    {
      id: "3",
      vessel: "Mediterranean Express",
      departure: "Piraeus",
      arrival: "New York",
      distance: 4850,
      fuelType: "HFO",
      fuelConsumed: 1250.8,
      ghgIntensity: 98.6,
      complianceStatus: "non-compliant" as const,
      voyageType: "extra-eu" as const,
      date: "2025-01-12"
    },
    {
      id: "4",
      vessel: "Baltic Trader",
      departure: "Stockholm",
      arrival: "Helsinki",
      distance: 180,
      fuelType: "Bio-LNG",
      fuelConsumed: 85.2,
      ghgIntensity: 43.2,
      complianceStatus: "compliant" as const,
      voyageType: "intra-eu" as const,
      date: "2025-01-11"
    },
    {
      id: "5",
      vessel: "Arctic Explorer",
      departure: "Murmansk",
      arrival: "Tromsø",
      distance: 420,
      fuelType: "e-Methanol",
      fuelConsumed: 95.7,
      ghgIntensity: 35.4,
      complianceStatus: "compliant" as const,
      voyageType: "extra-eu" as const,
      date: "2025-01-10"
    }
  ];

  return (
    <div className="p-4">
      <VoyageDataTable 
        data={mockVoyages}
        title="2025 Voyage Compliance Data"
      />
    </div>
  );
}