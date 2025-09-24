import { useState } from "react";
import ComplianceMeter from "./ComplianceMeter";
import VesselCard from "./VesselCard";
import CreditPoolingCard from "./CreditPoolingCard";
import FuelConsumptionChart from "./FuelConsumptionChart";
import VoyageDataTable from "./VoyageDataTable";
import CalculateAndPlanning from "./CalculateAndPlanning";
import ComplianceFrameworkCalculator from "./ComplianceFrameworkCalculator";
import FrameworkSpecificTiles from "./FrameworkSpecificTiles";
import FrameworkVisualGraphs from "./FrameworkVisualGraphs";
import DynamicDashboardTiles from "./DynamicDashboardTiles";
import EnhancedCompliancePage from "./EnhancedCompliancePage";
import IntegratedFrameworkManager from "./IntegratedFrameworkManager";
import DataImportManager from "./DataImportManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ship, TrendingUp, AlertCircle, CheckCircle2, Fuel, Calculator, BarChart3, Settings } from "lucide-react";

interface DashboardProps {
  activeTab: string;
}

const Dashboard = ({ activeTab }: DashboardProps) => {
  // todo: remove mock functionality
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);
  
  // Compliance Framework Toggles
  const [complianceFrameworks, setComplianceFrameworks] = useState({
    fuelEUMaritime: true,
    euETS: false,
    imoNetZero: false,
    ukETS: false
  });

  // Custom Tiles Management
  const [customDashboardTiles, setCustomDashboardTiles] = useState<string[]>([]);
  const [customComplianceTiles, setCustomComplianceTiles] = useState<string[]>([]);

  const addCustomDashboardTile = (tileType: string) => {
    if (!customDashboardTiles.includes(tileType)) {
      setCustomDashboardTiles(prev => [...prev, tileType]);
    }
  };

  const removeCustomDashboardTile = (tileId: string) => {
    setCustomDashboardTiles(prev => prev.filter((_, index) => `custom-${index}` !== tileId));
  };

  const addCustomComplianceTile = (tileType: string) => {
    if (!customComplianceTiles.includes(tileType)) {
      setCustomComplianceTiles(prev => [...prev, tileType]);
    }
  };

  const removeCustomComplianceTile = (tileId: string) => {
    setCustomComplianceTiles(prev => prev.filter((_, index) => `compliance-custom-${index}` !== tileId));
  };

  // Integrated data refresh handler
  const handleDataRefresh = () => {
    // In a real application, this would refresh data from APIs
    console.log('Refreshing integrated framework data...');
  };

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
    },
    {
      id: "4",
      name: "Baltic Trader",
      imoNumber: "9543210",
      type: "Gas Carrier" as const,
      flag: "Sweden",
      grossTonnage: 45000,
      complianceStatus: "compliant" as const,
      ghgIntensity: 78.2,
      targetIntensity: 89.3,
      fuelConsumption: 750.1,
      creditBalance: 215.8
    }
  ];

  const mockFuelData = [
    {
      month: "Jan 2025",
      ghgIntensity: 87.2,
      target: 89.3,
      fuelConsumption: 4250.5,
      complianceCredits: 325.3
    },
    {
      month: "Feb 2025",
      ghgIntensity: 84.7,
      target: 89.3,
      fuelConsumption: 3980.2,
      complianceCredits: 442.8
    },
    {
      month: "Mar 2025",
      ghgIntensity: 89.4,
      target: 89.3,
      fuelConsumption: 4120.8,
      complianceCredits: 278.5
    },
    {
      month: "Apr 2025",
      ghgIntensity: 85.9,
      target: 89.3,
      fuelConsumption: 3895.3,
      complianceCredits: 356.2
    },
    {
      month: "May 2025",
      ghgIntensity: 92.1,
      target: 89.3,
      fuelConsumption: 4410.7,
      complianceCredits: 189.4
    },
    {
      month: "Jun 2025",
      ghgIntensity: 83.2,
      target: 89.3,
      fuelConsumption: 4075.6,
      complianceCredits: 395.8
    }
  ];

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
    }
  ];

  const mockTransactions = [
    {
      id: "1",
      type: "bank" as const,
      amount: 50.5,
      date: "2025-01-15",
      status: "completed" as const
    },
    {
      id: "2",
      type: "trade" as const,
      amount: 25.0,
      counterparty: "Nordic Carrier",
      date: "2025-01-12",
      status: "pending" as const
    }
  ];

  // Calculate fleet statistics
  const fleetStats = {
    totalVessels: mockVessels.length,
    compliant: mockVessels.filter(v => v.complianceStatus === "compliant").length,
    warning: mockVessels.filter(v => v.complianceStatus === "warning").length,
    nonCompliant: mockVessels.filter(v => v.complianceStatus === "non-compliant").length,
    averageIntensity: mockVessels.reduce((sum, v) => sum + v.ghgIntensity, 0) / mockVessels.length,
    totalCredits: mockVessels.reduce((sum, v) => sum + v.creditBalance, 0)
  };

  const renderDashboardOverview = () => (
    <IntegratedFrameworkManager
      frameworks={complianceFrameworks}
      vesselData={{
        grossTonnage: fleetStats.totalVessels > 0 ? mockVessels[0].grossTonnage : 85000,
        fuelConsumption: fleetStats.totalVessels > 0 ? mockVessels[0].fuelConsumption : 1250,
        ghgIntensity: fleetStats.averageIntensity,
        voyageType: 'intra-eu'
      }}
      onFrameworkChange={setComplianceFrameworks}
      onDataRefresh={handleDataRefresh}
    >
      <div className="space-y-6">
      {/* Compliance Framework Toggles */}
      <Card className="hover-elevate">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Compliance Frameworks</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <Switch
                id="fueleu-maritime"
                checked={complianceFrameworks.fuelEUMaritime}
                onCheckedChange={(checked) => 
                  setComplianceFrameworks(prev => ({...prev, fuelEUMaritime: checked}))
                }
                data-testid="switch-fueleu-maritime"
              />
              <Label htmlFor="fueleu-maritime" className="text-sm font-medium">
                FuelEU Maritime
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <Switch
                id="eu-ets"
                checked={complianceFrameworks.euETS}
                onCheckedChange={(checked) => 
                  setComplianceFrameworks(prev => ({...prev, euETS: checked}))
                }
                data-testid="switch-eu-ets"
              />
              <Label htmlFor="eu-ets" className="text-sm font-medium">
                EU ETS
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <Switch
                id="imo-net-zero"
                checked={complianceFrameworks.imoNetZero}
                onCheckedChange={(checked) => 
                  setComplianceFrameworks(prev => ({...prev, imoNetZero: checked}))
                }
                data-testid="switch-imo-net-zero"
              />
              <Label htmlFor="imo-net-zero" className="text-sm font-medium">
                IMO Net Zero
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <Switch
                id="uk-ets"
                checked={complianceFrameworks.ukETS}
                onCheckedChange={(checked) => 
                  setComplianceFrameworks(prev => ({...prev, ukETS: checked}))
                }
                data-testid="switch-uk-ets"
              />
              <Label htmlFor="uk-ets" className="text-sm font-medium">
                UK ETS
              </Label>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Active frameworks: {Object.values(complianceFrameworks).filter(Boolean).length} of 4 enabled
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Dashboard Tiles */}
      <DynamicDashboardTiles 
        frameworks={complianceFrameworks}
        fleetData={fleetStats}
        vesselData={{
          grossTonnage: fleetStats.totalVessels > 0 ? mockVessels[0].grossTonnage : 85000,
          fuelConsumption: fleetStats.totalVessels > 0 ? mockVessels[0].fuelConsumption : 1250,
          ghgIntensity: fleetStats.averageIntensity,
          voyageType: 'intra-eu'
        }}
        customTiles={customDashboardTiles}
        onAddCustomTile={addCustomDashboardTile}
        onRemoveCustomTile={removeCustomDashboardTile}
      />

      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vessels</CardTitle>
            <Ship className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetStats.totalVessels}</div>
            <div className="flex space-x-2 mt-2">
              <Badge variant="default" className="text-xs">{fleetStats.compliant} Compliant</Badge>
              <Badge variant="destructive" className="text-xs">{fleetStats.nonCompliant} Non-Compliant</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Avg. GHG Intensity</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetStats.averageIntensity.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">gCO2e/MJ</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credit Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${fleetStats.totalCredits >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {fleetStats.totalCredits >= 0 ? '+' : ''}{fleetStats.totalCredits.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Compliance Credits</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            {fleetStats.compliant / fleetStats.totalVessels >= 0.8 ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((fleetStats.compliant / fleetStats.totalVessels) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Vessels in compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ComplianceMeter
          title="Fleet Performance"
          currentIntensity={fleetStats.averageIntensity}
          targetIntensity={89.3}
          compliancePercentage={Math.min(100, (89.3 / fleetStats.averageIntensity) * 100)}
          trend="down"
          status={fleetStats.averageIntensity <= 89.3 ? "compliant" : "warning"}
        />
        <ComplianceMeter
          title="2025 Target Progress"
          currentIntensity={87.5}
          targetIntensity={85.7}
          compliancePercentage={98}
          trend="stable"
          status="warning"
        />
        <ComplianceMeter
          title="Credit Utilization"
          currentIntensity={75.2}
          targetIntensity={100}
          compliancePercentage={75}
          trend="up"
          status="compliant"
          unit="%"
        />
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FuelConsumptionChart
          data={mockFuelData}
          title="Fleet GHG Intensity Trends"
        />
        <div className="space-y-4">
          <CreditPoolingCard
            vesselName="Fleet Summary"
            currentBalance={fleetStats.totalCredits}
            bankedCredits={380.5}
            borrowedCredits={183.2}
            availableForTrading={245.8}
            recentTransactions={mockTransactions}
          />
        </div>
      </div>
    </div>
    </IntegratedFrameworkManager>
  );

  const renderVesselsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockVessels.map((vessel) => (
          <VesselCard
            key={vessel.id}
            {...vessel}
            onViewDetails={(id) => setSelectedVessel(id)}
          />
        ))}
      </div>
    </div>
  );

  const renderComplianceTab = () => (
    <EnhancedCompliancePage
      frameworks={complianceFrameworks}
      vesselData={{
        grossTonnage: fleetStats.totalVessels > 0 ? mockVessels[0].grossTonnage : 85000,
        fuelConsumption: fleetStats.totalVessels > 0 ? mockVessels[0].fuelConsumption : 1250,
        ghgIntensity: fleetStats.averageIntensity,
        voyageType: 'intra-eu'
      }}
      customTiles={customComplianceTiles}
      onAddCustomTile={addCustomComplianceTile}
      onRemoveCustomTile={removeCustomComplianceTile}
    />
  );

  const renderCalculatorTab = () => (
    <CalculateAndPlanning 
      frameworks={complianceFrameworks}
      vesselData={{
        grossTonnage: fleetStats.totalVessels > 0 ? mockVessels[0].grossTonnage : 85000,
        fuelConsumption: fleetStats.totalVessels > 0 ? mockVessels[0].fuelConsumption : 1250,
        ghgIntensity: fleetStats.averageIntensity,
        voyageType: 'intra-eu'
      }}
    />
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>FuelEU Maritime Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configuration settings for compliance tracking, penalty calculations, and data management will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderDataIntegrationTab = () => (
    <DataImportManager />
  );

  const getTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboardOverview();
      case "vessels":
        return renderVesselsTab();
      case "compliance":
        return renderComplianceTab();
      case "calculator":
        return renderCalculatorTab();
      case "settings":
        return renderSettingsTab();
      case "data-integration":
        return renderDataIntegrationTab();
      default:
        return renderDashboardOverview();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" data-testid="dashboard">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          {activeTab === "dashboard" && "GHGConnect Fleet Overview"}
          {activeTab === "vessels" && "Vessel Management"}
          {activeTab === "compliance" && "Multi-Framework Compliance"}
          {activeTab === "calculator" && "Calculate & Planning"}
          {activeTab === "settings" && "Settings"}
          {activeTab === "data-integration" && "Data Integration & Calculations"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {activeTab === "dashboard" && "Monitor fleet-wide compliance across multiple maritime frameworks"}
          {activeTab === "vessels" && "Manage individual vessel compliance, fuel consumption, and credit balances"}
          {activeTab === "compliance" && "Track multi-framework compliance data and cumulative exposure"}
          {activeTab === "calculator" && "Comprehensive maritime compliance calculations and planning tools"}
          {activeTab === "settings" && "Configure system preferences and compliance parameters"}
          {activeTab === "data-integration" && "Import maritime data and customize calculation formulas for compliance frameworks"}
        </p>
      </div>
      
      {getTabContent()}
    </div>
  );
};

export default Dashboard;