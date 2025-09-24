import FuelConsumptionChart from '../FuelConsumptionChart';

export default function FuelConsumptionChartExample() {
  // todo: remove mock functionality
  const mockData = [
    {
      month: "Jan 2025",
      ghgIntensity: 91.2,
      target: 89.3,
      fuelConsumption: 1250.5,
      complianceCredits: 125.3
    },
    {
      month: "Feb 2025", 
      ghgIntensity: 88.7,
      target: 89.3,
      fuelConsumption: 1180.2,
      complianceCredits: 142.8
    },
    {
      month: "Mar 2025",
      ghgIntensity: 85.4,
      target: 89.3,
      fuelConsumption: 1320.8,
      complianceCredits: 178.5
    },
    {
      month: "Apr 2025",
      ghgIntensity: 87.9,
      target: 89.3,
      fuelConsumption: 1095.3,
      complianceCredits: 156.2
    },
    {
      month: "May 2025",
      ghgIntensity: 92.1,
      target: 89.3,
      fuelConsumption: 1410.7,
      complianceCredits: 89.4
    },
    {
      month: "Jun 2025",
      ghgIntensity: 84.2,
      target: 89.3,
      fuelConsumption: 1275.6,
      complianceCredits: 195.8
    }
  ];

  return (
    <div className="space-y-6 p-4">
      <FuelConsumptionChart 
        data={mockData} 
        title="2025 Fuel Consumption & GHG Intensity Trends"
        vesselName="Atlantic Pioneer"
      />
      <FuelConsumptionChart 
        data={mockData.map(d => ({
          ...d,
          ghgIntensity: d.ghgIntensity + 3.5,
          complianceCredits: d.complianceCredits - 50
        }))} 
        title="Fleet Average Performance"
      />
    </div>
  );
}