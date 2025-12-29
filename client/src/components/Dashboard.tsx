import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useVesselSelection } from "@/contexts/VesselSelectionContext";
import ComplianceMeter from "./ComplianceMeter";
import VesselCard from "./VesselCard";
import VesselDetailsModal from "./VesselDetailsModal";
import VesselVoyages from "./VesselVoyages";
import UserManagement from "./UserManagement";
import EnhancedVesselManagement from "./EnhancedVesselManagement";
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
import { api } from "@/lib/api";
import { UserRole, Permission, hasPermission } from "@/lib/userRoles";
import type { VesselViewModel, UserViewModel } from "@shared/viewModels";

interface DashboardProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
}

const Dashboard = ({ activeTab, onTabChange }: DashboardProps) => {
  // Use vessel selection context
  const { selectedVessel, selectedFleet, setSelectedVessel } = useVesselSelection();
  const [isVesselModalOpen, setIsVesselModalOpen] = useState(false);
  
  // Mock current user (in real app, this would come from auth context)
  const currentUser: UserViewModel = {
    id: '550e8400-e29b-41d4-a716-446655440000', // Use actual UUID from database
    username: 'admin',
    email: 'admin@ghgconnect.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
    subscriptionTier: 'premium' as any,
    tenantId: 'dfa5de92-6ab2-47d4-b19c-87c01b692c94', // Use actual tenant ID
    fleetIds: ['fleet-1'],
    vesselIds: ['1', '2', '3', '4', '5'], // Admin can see all vessels
    isActive: true,
    mfaEnabled: false,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date().toISOString()
  };
  
  // Fetch vessels from database (falls back to demo if DB unavailable)
  const { data: allVessels = [], isLoading: vesselsLoading, error: vesselsError } = useQuery({
    queryKey: ['vessels', 'all'],
    queryFn: () => api.vessels.getAll(),
    staleTime: 30000, // Cache for 30 seconds
  });

  // Filter vessels based on user role and permissions
  const getFilteredVessels = () => {
    if (currentUser.role === UserRole.ADMIN) {
      return allVessels; // Admin can see all vessels
    }
    
    // Filter vessels based on user's access
    return allVessels.filter(vessel => 
      currentUser.vesselIds.includes(vessel.id) || 
      currentUser.fleetIds.includes(vessel.fleetId || '')
    );
  };

  const vessels = getFilteredVessels();

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

  // Vessel selection handlers
  const handleVesselViewDetails = (vesselId: string) => {
    const vessel = vessels.find(v => v.id === vesselId);
    if (vessel) {
      setSelectedVessel(vessel);
      setIsVesselModalOpen(true);
    }
  };

  const handleViewVesselDetailsFromCard = (vesselOrId: VesselViewModel | string) => {
    console.log('View Details clicked for:', vesselOrId);
    console.log('Available vessels:', allVessels.length);
    
    if (typeof vesselOrId === 'string') {
      // If we get just an ID, find the vessel in the allVessels array
      const vessel = allVessels.find(v => v.id === vesselOrId);
      console.log('Found vessel:', vessel);
      if (vessel) {
        setSelectedVessel(vessel);
        setIsVesselModalOpen(true);
        console.log('Modal should now be open');
      } else {
        console.error('Vessel not found with ID:', vesselOrId);
      }
    } else {
      // If we get the full vessel object
      console.log('Using full vessel object:', vesselOrId);
      setSelectedVessel(vesselOrId);
      setIsVesselModalOpen(true);
      console.log('Modal should now be open');
    }
  };

  const handleViewInCompliance = (vessel: VesselViewModel) => {
    setSelectedVessel(vessel);
    setIsVesselModalOpen(false);
    onTabChange?.('compliance');
  };

  const handleViewInCalculator = (vessel: VesselViewModel) => {
    setSelectedVessel(vessel);
    setIsVesselModalOpen(false);
    onTabChange?.('calculator');
  };

  const handleViewVesselDetails = (vessel: VesselViewModel) => {
    setSelectedVessel(vessel);
    setIsVesselModalOpen(false);
    onTabChange?.('vessel-details');
  };

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

  // Calculate fleet statistics from API data
  const fleetStats = {
    totalVessels: vessels.length,
    compliant: vessels.filter(v => v.complianceStatus === "compliant").length,
    warning: vessels.filter(v => v.complianceStatus === "warning").length,
    nonCompliant: vessels.filter(v => v.complianceStatus === "non-compliant").length,
    averageIntensity: vessels.length > 0 ? vessels.reduce((sum, v) => sum + v.ghgIntensity, 0) / vessels.length : 0,
    totalCredits: vessels.reduce((sum, v) => sum + v.creditBalance, 0)
  };

  const renderDashboardOverview = () => (
    <IntegratedFrameworkManager
      frameworks={complianceFrameworks}
      vesselData={{
        grossTonnage: fleetStats.totalVessels > 0 ? vessels[0].grossTonnage : 85000,
        fuelConsumption: fleetStats.totalVessels > 0 ? vessels[0].fuelConsumption : 1250,
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
          grossTonnage: fleetStats.totalVessels > 0 ? vessels[0].grossTonnage : 85000,
          fuelConsumption: fleetStats.totalVessels > 0 ? vessels[0].fuelConsumption : 1250,
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

  const renderVesselsTab = () => {
    return <EnhancedVesselManagement currentUser={currentUser} onViewDetails={handleViewVesselDetailsFromCard} onTabChange={onTabChange} />;
  };

  const renderComplianceTab = () => (
    <div className="space-y-6">
      {selectedVessel && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Ship className="h-5 w-5" />
              Selected Vessel: {selectedVessel.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">IMO:</span> {selectedVessel.imoNumber}
              </div>
              <div>
                <span className="font-medium">Type:</span> {selectedVessel.type}
              </div>
              <div>
                <span className="font-medium">GHG Intensity:</span> {selectedVessel.ghgIntensity} gCO2e/MJ
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <Badge variant={selectedVessel.complianceStatus === 'compliant' ? 'default' : 
                              selectedVessel.complianceStatus === 'warning' ? 'secondary' : 'destructive'}
                       className="ml-2">
                  {selectedVessel.complianceStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <EnhancedCompliancePage
        frameworks={complianceFrameworks}
        vesselData={selectedVessel ? {
          grossTonnage: selectedVessel.grossTonnage,
          fuelConsumption: selectedVessel.fuelConsumption,
          ghgIntensity: selectedVessel.ghgIntensity,
          voyageType: (selectedVessel.voyageType === 'intra-eu' || selectedVessel.voyageType === 'extra-eu') ? selectedVessel.voyageType : 'intra-eu'
        } : {
          grossTonnage: fleetStats.totalVessels > 0 ? vessels[0].grossTonnage : 85000,
          fuelConsumption: fleetStats.totalVessels > 0 ? vessels[0].fuelConsumption : 1250,
          ghgIntensity: fleetStats.averageIntensity,
          voyageType: 'intra-eu'
        }}
        customTiles={customComplianceTiles}
        onAddCustomTile={addCustomComplianceTile}
        onRemoveCustomTile={removeCustomComplianceTile}
      />
    </div>
  );

  const renderCalculatorTab = () => (
    <div className="space-y-6">
      {selectedVessel && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Calculator className="h-5 w-5" />
              Calculating for: {selectedVessel.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">IMO:</span> {selectedVessel.imoNumber}
              </div>
              <div>
                <span className="font-medium">Engine:</span> {selectedVessel.mainEngineType || 'Diesel'}
              </div>
              <div>
                <span className="font-medium">Current GHG:</span> {selectedVessel.ghgIntensity} gCO2e/MJ
              </div>
              <div>
                <span className="font-medium">Credits:</span> 
                <span className={`ml-1 ${selectedVessel.creditBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedVessel.creditBalance >= 0 ? '+' : ''}{selectedVessel.creditBalance.toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <CalculateAndPlanning 
        frameworks={complianceFrameworks}
        vesselData={selectedVessel ? {
          grossTonnage: selectedVessel.grossTonnage,
          fuelConsumption: selectedVessel.fuelConsumption,
          ghgIntensity: selectedVessel.ghgIntensity,
          voyageType: (selectedVessel.voyageType === 'intra-eu' || selectedVessel.voyageType === 'extra-eu') ? selectedVessel.voyageType : 'intra-eu'
        } : {
          grossTonnage: fleetStats.totalVessels > 0 ? vessels[0].grossTonnage : 85000,
          fuelConsumption: fleetStats.totalVessels > 0 ? vessels[0].fuelConsumption : 1250,
          ghgIntensity: fleetStats.averageIntensity,
          voyageType: 'intra-eu'
        }}
        selectedVessel={selectedVessel || undefined}
      />
    </div>
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

  const renderUserManagementTab = () => (
    <UserManagement currentUser={currentUser} />
  );

  const renderVesselFleetManagementTab = () => (
    <EnhancedVesselManagement currentUser={currentUser} onViewDetails={handleViewVesselDetailsFromCard} onTabChange={onTabChange} />
  );

  const renderVesselDetailsTab = () => {
    if (!selectedVessel) {
      return (
        <div className="space-y-6">
          <Card>
            <CardContent className="text-center py-12">
              <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Vessel Selected</h3>
              <p className="text-muted-foreground">
                Click "View Details" on any vessel card to see detailed information here.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Vessel Header */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Ship className="h-6 w-6" />
              {selectedVessel.name} - Complete Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">IMO Number</label>
                <p className="text-sm font-mono">{selectedVessel.imoNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Vessel Type</label>
                <p className="text-sm">{selectedVessel.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Flag State</label>
                <p className="text-sm">{selectedVessel.flag}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Gross Tonnage</label>
                <p className="text-sm font-mono">{selectedVessel.grossTonnage.toLocaleString()} GT</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vessel Voyages */}
        <VesselVoyages vessel={selectedVessel} />

        {/* Compliance Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Compliance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{selectedVessel.ghgIntensity}</div>
                <div className="text-sm text-muted-foreground">Current GHG Intensity</div>
                <div className="text-xs text-muted-foreground">gCO2e/MJ</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{selectedVessel.targetIntensity}</div>
                <div className="text-sm text-muted-foreground">2025 Target</div>
                <div className="text-xs text-muted-foreground">gCO2e/MJ</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className={`text-2xl font-bold ${selectedVessel.creditBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedVessel.creditBalance >= 0 ? '+' : ''}{selectedVessel.creditBalance.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Credit Balance</div>
                <div className="text-xs text-muted-foreground">compliance credits</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

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
      case "vessel-details":
        return renderVesselDetailsTab();
      case "user-management":
        return renderUserManagementTab();
      case "vessel-fleet-management":
        return renderVesselFleetManagementTab();
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
          {activeTab === "vessel-details" && "Vessel Details"}
          {activeTab === "vessel-fleet-management" && "Fleet Management"}
          {activeTab === "compliance" && "Multi-Framework Compliance"}
          {activeTab === "calculator" && "Calculate & Planning"}
          {activeTab === "data-integration" && "Data Integration & Calculations"}
          {activeTab === "user-management" && "User Management"}
          {activeTab === "settings" && "Settings"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {activeTab === "dashboard" && "Monitor fleet-wide compliance across multiple maritime frameworks"}
          {activeTab === "vessels" && "Manage individual vessel compliance, fuel consumption, and credit balances"}
          {activeTab === "vessel-details" && "View detailed vessel information, voyages, and compliance analysis"}
          {activeTab === "vessel-fleet-management" && "Add, edit, and manage vessels and fleets with role-based access"}
          {activeTab === "compliance" && "Track multi-framework compliance data and cumulative exposure"}
          {activeTab === "calculator" && "Comprehensive maritime compliance calculations and planning tools"}
          {activeTab === "data-integration" && "Import maritime data and customize calculation formulas for compliance frameworks"}
          {activeTab === "user-management" && "Manage user accounts, roles, and permissions"}
          {activeTab === "settings" && "Configure system preferences and compliance parameters"}
        </p>
      </div>
      
      {getTabContent()}
      
      {/* Vessel Details Modal */}
      <VesselDetailsModal
        vessel={selectedVessel}
        isOpen={isVesselModalOpen}
        onClose={() => setIsVesselModalOpen(false)}
        onViewInCompliance={handleViewInCompliance}
        onViewInCalculator={handleViewInCalculator}
        onViewVesselDetails={handleViewVesselDetails}
      />
    </div>
  );
};

export default Dashboard;