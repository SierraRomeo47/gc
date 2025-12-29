import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, TrendingUp, AlertTriangle, CheckCircle2, Fuel, Ship, Target, BarChart3, Download, FileText, Calendar, Settings } from "lucide-react";
import ComplianceFrameworkCalculator from "./ComplianceFrameworkCalculator";
import { useState, useEffect } from "react";

interface VesselInfo {
  name: string;
  imoNumber: string;
  flag: string;
  vesselType: string;
  grossTonnage: number;
  deadweight: number;
  yearBuilt: number;
}

interface FuelConsumptionData {
  voyageId: string;
  departure: string;
  arrival: string;
  distance: number;
  fuelType: string;
  fuelConsumed: number;
  fuelCost: number;
  ghgIntensity: number;
  lcvValue: number;
  energyContent: number;
}

interface ComplianceResult {
  year: number;
  targetReduction: number;
  actualIntensity: number;
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
  penalty: number;
  creditsUsed: number;
}

interface CalculateAndPlanningProps {
  frameworks?: {
    fuelEUMaritime: boolean;
    euETS: boolean;
    imoNetZero: boolean;
    ukETS: boolean;
  };
  vesselData?: {
    grossTonnage: number;
    fuelConsumption: number;
    ghgIntensity: number;
    voyageType: 'intra-eu' | 'extra-eu';
  };
  selectedVessel?: {
    id: string;
    name: string;
    imoNumber: string;
    type: string;
    flag: string;
    grossTonnage: number;
    iceClass?: string | null;
    mainEngineType?: string;
    voyageType?: string;
    complianceStatus: 'compliant' | 'warning' | 'non-compliant';
    ghgIntensity: number;
    targetIntensity: number;
    fuelConsumption: number;
    creditBalance: number;
  };
}

const CalculateAndPlanning = ({ frameworks, vesselData, selectedVessel }: CalculateAndPlanningProps = {}) => {
  const [activeTab, setActiveTab] = useState("calculator");
  
  // Vessel Information State - Initialize with selected vessel data if available
  const [vesselInfo, setVesselInfo] = useState<VesselInfo>({
    name: selectedVessel?.name || "Atlantic Pioneer",
    imoNumber: selectedVessel?.imoNumber || "9876543",
    flag: selectedVessel?.flag || "Germany",
    vesselType: selectedVessel?.type || "Container Ship",
    grossTonnage: selectedVessel?.grossTonnage || 85000,
    deadweight: selectedVessel?.grossTonnage ? selectedVessel.grossTonnage * 1.4 : 120000,
    yearBuilt: 2018
  });
  
  // Calculator Parameters - Initialize with selected vessel data if available
  const [calculationYear, setCalculationYear] = useState(2025);
  const [totalEnergyUsed, setTotalEnergyUsed] = useState(selectedVessel?.fuelConsumption ? selectedVessel.fuelConsumption * 1000 : 1250000);
  const [baselineIntensity, setBaselineIntensity] = useState(selectedVessel?.ghgIntensity || 91.16);
  
  // Update vessel info when selectedVessel changes
  useEffect(() => {
    if (selectedVessel) {
      setVesselInfo({
        name: selectedVessel.name,
        imoNumber: selectedVessel.imoNumber,
        flag: selectedVessel.flag,
        vesselType: selectedVessel.type,
        grossTonnage: selectedVessel.grossTonnage,
        deadweight: selectedVessel.grossTonnage * 1.4,
        yearBuilt: 2018
      });
      setTotalEnergyUsed(selectedVessel.fuelConsumption * 1000);
      setBaselineIntensity(selectedVessel.ghgIntensity);
    }
  }, [selectedVessel]);
  
  // Fuel Consumption Data State
  const [fuelConsumptionData, setFuelConsumptionData] = useState<FuelConsumptionData[]>([
    {
      voyageId: "V001",
      departure: "Hamburg",
      arrival: "Rotterdam", 
      distance: 285,
      fuelType: "HFO - 380 cSt",
      fuelConsumed: 125.5,
      fuelCost: 520,
      ghgIntensity: 91.16,
      lcvValue: 40.2,
      energyContent: 5048.1
    },
    {
      voyageId: "V002", 
      departure: "Rotterdam",
      arrival: "Le Havre",
      distance: 320,
      fuelType: "MGO",
      fuelConsumed: 85.2,
      fuelCost: 680,
      ghgIntensity: 87.5,
      lcvValue: 42.7,
      energyContent: 3638.04
    },
    {
      voyageId: "V003",
      departure: "Le Havre", 
      arrival: "Valencia",
      distance: 890,
      fuelType: "Bio-fuel",
      fuelConsumed: 45.8,
      fuelCost: 950,
      ghgIntensity: 18.7,
      lcvValue: 39.8,
      energyContent: 1822.84
    }
  ]);

  // Compliance Results
  const [complianceResults, setComplianceResults] = useState<ComplianceResult[]>([
    { year: 2025, targetReduction: 2, actualIntensity: 89.34, complianceStatus: 'compliant', penalty: 0, creditsUsed: 0 },
    { year: 2026, targetReduction: 6, actualIntensity: 85.69, complianceStatus: 'compliant', penalty: 0, creditsUsed: 0 },
    { year: 2027, targetReduction: 6, actualIntensity: 85.69, complianceStatus: 'warning', penalty: 1200, creditsUsed: 15.5 },
    { year: 2028, targetReduction: 8, actualIntensity: 83.87, complianceStatus: 'warning', penalty: 2400, creditsUsed: 22.3 },
    { year: 2029, targetReduction: 10, actualIntensity: 82.04, complianceStatus: 'non-compliant', penalty: 8950, creditsUsed: 45.2 },
    { year: 2030, targetReduction: 20, actualIntensity: 72.93, complianceStatus: 'compliant', penalty: 0, creditsUsed: 0 }
  ]);

  // Calculate weighted average GHG intensity
  const calculateWeightedGHGIntensity = () => {
    const totalEnergy = fuelConsumptionData.reduce((sum, fuel) => sum + fuel.energyContent, 0);
    const weightedSum = fuelConsumptionData.reduce((sum, fuel) => sum + (fuel.ghgIntensity * fuel.energyContent), 0);
    return totalEnergy > 0 ? weightedSum / totalEnergy : 0;
  };

  // Calculate total fuel costs
  const calculateTotalCosts = () => {
    return fuelConsumptionData.reduce((sum, fuel) => sum + (fuel.fuelConsumed * fuel.fuelCost), 0);
  };

  // Add new fuel consumption entry
  const addFuelEntry = () => {
    const newEntry: FuelConsumptionData = {
      voyageId: `V${String(fuelConsumptionData.length + 1).padStart(3, '0')}`,
      departure: "",
      arrival: "",
      distance: 0,
      fuelType: "HFO - 380 cSt",
      fuelConsumed: 0,
      fuelCost: 520,
      ghgIntensity: 91.16,
      lcvValue: 40.2,
      energyContent: 0
    };
    setFuelConsumptionData([...fuelConsumptionData, newEntry]);
  };

  // Update fuel entry
  const updateFuelEntry = (index: number, field: keyof FuelConsumptionData, value: string | number) => {
    const updatedData = [...fuelConsumptionData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    
    // Recalculate energy content when fuel consumed or LCV changes
    if (field === 'fuelConsumed' || field === 'lcvValue') {
      updatedData[index].energyContent = updatedData[index].fuelConsumed * updatedData[index].lcvValue * 1000;
    }
    
    setFuelConsumptionData(updatedData);
  };

  // Remove fuel entry
  const removeFuelEntry = (index: number) => {
    if (fuelConsumptionData.length > 1) {
      setFuelConsumptionData(fuelConsumptionData.filter((_, i) => i !== index));
    }
  };

  const renderVesselInformation = () => (
    <Card className="hover-elevate">
      <CardHeader className="bg-yellow-50 dark:bg-yellow-950/20">
        <div className="flex items-center space-x-2">
          <Ship className="h-5 w-5 text-primary" />
          <CardTitle>Vessel Information</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vessel-name">Vessel Name</Label>
            <Input
              id="vessel-name"
              value={vesselInfo.name}
              onChange={(e) => setVesselInfo({...vesselInfo, name: e.target.value})}
              data-testid="input-vessel-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imo-number">IMO Number</Label>
            <Input
              id="imo-number"
              value={vesselInfo.imoNumber}
              onChange={(e) => setVesselInfo({...vesselInfo, imoNumber: e.target.value})}
              data-testid="input-imo-number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="flag">Flag</Label>
            <Select value={vesselInfo.flag} onValueChange={(value) => setVesselInfo({...vesselInfo, flag: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="Norway">Norway</SelectItem>
                <SelectItem value="Malta">Malta</SelectItem>
                <SelectItem value="Netherlands">Netherlands</SelectItem>
                <SelectItem value="Denmark">Denmark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vessel-type">Vessel Type</Label>
            <Select value={vesselInfo.vesselType} onValueChange={(value) => setVesselInfo({...vesselInfo, vesselType: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Container Ship">Container Ship</SelectItem>
                <SelectItem value="Bulk Carrier">Bulk Carrier</SelectItem>
                <SelectItem value="Oil Tanker">Oil Tanker</SelectItem>
                <SelectItem value="Gas Carrier">Gas Carrier</SelectItem>
                <SelectItem value="Passenger Ship">Passenger Ship</SelectItem>
                <SelectItem value="General Cargo">General Cargo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gross-tonnage">Gross Tonnage</Label>
            <Input
              id="gross-tonnage"
              type="number"
              value={vesselInfo.grossTonnage}
              onChange={(e) => setVesselInfo({...vesselInfo, grossTonnage: parseInt(e.target.value) || 0})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year-built">Year Built</Label>
            <Input
              id="year-built"
              type="number"
              value={vesselInfo.yearBuilt}
              onChange={(e) => setVesselInfo({...vesselInfo, yearBuilt: parseInt(e.target.value) || 0})}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFuelConsumptionTable = () => (
    <Card className="hover-elevate">
      <CardHeader className="bg-blue-50 dark:bg-blue-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Fuel className="h-5 w-5 text-primary" />
            <CardTitle>Fuel Consumption Data</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button onClick={addFuelEntry} size="sm" data-testid="button-add-fuel">
              Add Entry
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voyage</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Distance (nm)</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Consumed (MT)</TableHead>
                <TableHead>Cost (€/MT)</TableHead>
                <TableHead>GHG Intensity</TableHead>
                <TableHead>LCV (MJ/kg)</TableHead>
                <TableHead>Energy (MJ)</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fuelConsumptionData.map((fuel, index) => (
                <TableRow key={fuel.voyageId}>
                  <TableCell>
                    <Input
                      value={fuel.voyageId}
                      onChange={(e) => updateFuelEntry(index, 'voyageId', e.target.value)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Input
                        value={fuel.departure}
                        onChange={(e) => updateFuelEntry(index, 'departure', e.target.value)}
                        placeholder="From"
                        className="w-20"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        value={fuel.arrival}
                        onChange={(e) => updateFuelEntry(index, 'arrival', e.target.value)}
                        placeholder="To"
                        className="w-20"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={fuel.distance}
                      onChange={(e) => updateFuelEntry(index, 'distance', parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={fuel.fuelType} 
                      onValueChange={(value) => updateFuelEntry(index, 'fuelType', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HFO - 380 cSt">HFO - 380 cSt</SelectItem>
                        <SelectItem value="HFO - 180 cSt">HFO - 180 cSt</SelectItem>
                        <SelectItem value="MGO">MGO</SelectItem>
                        <SelectItem value="LNG">LNG</SelectItem>
                        <SelectItem value="Bio-fuel">Bio-fuel</SelectItem>
                        <SelectItem value="e-Methanol">e-Methanol</SelectItem>
                        <SelectItem value="e-Ammonia">e-Ammonia</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      value={fuel.fuelConsumed}
                      onChange={(e) => updateFuelEntry(index, 'fuelConsumed', parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={fuel.fuelCost}
                      onChange={(e) => updateFuelEntry(index, 'fuelCost', parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={fuel.ghgIntensity}
                      onChange={(e) => updateFuelEntry(index, 'ghgIntensity', parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      value={fuel.lcvValue}
                      onChange={(e) => updateFuelEntry(index, 'lcvValue', parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {fuel.energyContent.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFuelEntry(index)}
                      disabled={fuelConsumptionData.length <= 1}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Summary Row */}
        <div className="p-4 bg-muted/50 border-t">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Energy Used</div>
              <div className="text-lg font-bold">
                {fuelConsumptionData.reduce((sum, fuel) => sum + fuel.energyContent, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} MJ
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Weighted GHG Intensity</div>
              <div className="text-lg font-bold">
                {calculateWeightedGHGIntensity().toFixed(2)} gCO2e/MJ
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Fuel Cost</div>
              <div className="text-lg font-bold">
                €{calculateTotalCosts().toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Fuel Consumed</div>
              <div className="text-lg font-bold">
                {fuelConsumptionData.reduce((sum, fuel) => sum + fuel.fuelConsumed, 0).toFixed(1)} MT
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderComplianceAnalysis = () => (
    <Card className="hover-elevate">
      <CardHeader className="bg-green-50 dark:bg-green-950/20">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle>FuelEU Compliance Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead>Target Reduction (%)</TableHead>
              <TableHead>Target Intensity</TableHead>
              <TableHead>Actual Intensity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Penalty (€)</TableHead>
              <TableHead>Credits Used</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complianceResults.map((result) => {
              const targetIntensity = baselineIntensity * (1 - result.targetReduction / 100);
              return (
                <TableRow key={result.year}>
                  <TableCell className="font-medium">{result.year}</TableCell>
                  <TableCell>{result.targetReduction}%</TableCell>
                  <TableCell>{targetIntensity.toFixed(2)}</TableCell>
                  <TableCell>{result.actualIntensity.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      result.complianceStatus === 'compliant' ? 'default' : 
                      result.complianceStatus === 'warning' ? 'secondary' : 'destructive'
                    }>
                      {result.complianceStatus === 'compliant' ? 'Compliant' :
                       result.complianceStatus === 'warning' ? 'Warning' : 'Non-Compliant'}
                    </Badge>
                  </TableCell>
                  <TableCell className={result.penalty > 0 ? 'text-destructive font-medium' : 'text-green-600'}>
                    €{result.penalty.toLocaleString()}
                  </TableCell>
                  <TableCell>{result.creditsUsed}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderCalculatorParameters = () => (
    <Card className="hover-elevate">
      <CardHeader className="bg-purple-50 dark:bg-purple-950/20">
        <div className="flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle>Calculation Parameters</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="calculation-year">Calculation Year</Label>
            <Select value={calculationYear.toString()} onValueChange={(value) => setCalculationYear(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
                <SelectItem value="2028">2028</SelectItem>
                <SelectItem value="2029">2029</SelectItem>
                <SelectItem value="2030">2030</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="baseline-intensity">Baseline GHG Intensity (gCO2e/MJ)</Label>
            <Input
              id="baseline-intensity"
              type="number"
              step="0.01"
              value={baselineIntensity}
              onChange={(e) => setBaselineIntensity(parseFloat(e.target.value) || 0)}
              data-testid="input-baseline-intensity"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="total-energy">Total Energy Used (MJ)</Label>
            <Input
              id="total-energy"
              type="number"
              step="1000"
              value={totalEnergyUsed}
              onChange={(e) => setTotalEnergyUsed(parseFloat(e.target.value) || 0)}
              data-testid="input-total-energy"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Current Weighted Intensity</div>
            <div className="text-lg font-bold">
              {calculateWeightedGHGIntensity().toFixed(2)} gCO2e/MJ
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">2025 Target Intensity</div>
            <div className="text-lg font-bold">
              {(baselineIntensity * 0.98).toFixed(2)} gCO2e/MJ
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Compliance Gap</div>
            <div className={`text-lg font-bold ${calculateWeightedGHGIntensity() <= (baselineIntensity * 0.98) ? 'text-green-600' : 'text-destructive'}`}>
              {Math.max(0, calculateWeightedGHGIntensity() - (baselineIntensity * 0.98)).toFixed(2)} gCO2e/MJ
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" data-testid="calculate-and-planning">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Calculate & Planning</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive maritime compliance calculator with multi-framework support and cumulative exposure analysis
        </p>
      </div>

      {/* Selected Vessel Header */}
      {selectedVessel && (
        <Card className="mb-6 border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">Calculating for: {selectedVessel.name}</h3>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">IMO:</span>
                    <span className="ml-1 font-mono">{selectedVessel.imoNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Engine:</span>
                    <span className="ml-1">{selectedVessel.mainEngineType || 'Diesel'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current GHG:</span>
                    <span className="ml-1 font-semibold">{selectedVessel.ghgIntensity} gCO2e/MJ</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Credits:</span>
                    <span className={`ml-1 font-semibold ${selectedVessel.creditBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedVessel.creditBalance >= 0 ? '+' : ''}{selectedVessel.creditBalance}
                    </span>
                  </div>
                </div>
              </div>
              <Badge variant={selectedVessel.complianceStatus === 'compliant' ? 'default' : selectedVessel.complianceStatus === 'warning' ? 'secondary' : 'destructive'}>
                {selectedVessel.complianceStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="calculator" data-testid="tab-calculator">
            <Calculator className="h-4 w-4 mr-2" />
            Main Calculator
          </TabsTrigger>
          <TabsTrigger value="fuel-data" data-testid="tab-fuel-data">
            <Fuel className="h-4 w-4 mr-2" />
            Fuel Data
          </TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-compliance">
            <Target className="h-4 w-4 mr-2" />
            Compliance Analysis
          </TabsTrigger>
          <TabsTrigger value="multi-framework" data-testid="tab-multi-framework">
            <Settings className="h-4 w-4 mr-2" />
            Multi-Framework
          </TabsTrigger>
          <TabsTrigger value="planning" data-testid="tab-planning">
            <BarChart3 className="h-4 w-4 mr-2" />
            Planning Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          {renderVesselInformation()}
          {renderCalculatorParameters()}
          {renderFuelConsumptionTable()}
        </TabsContent>

        <TabsContent value="fuel-data" className="space-y-6">
          {renderFuelConsumptionTable()}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {renderComplianceAnalysis()}
        </TabsContent>

        <TabsContent value="multi-framework" className="space-y-6">
          {frameworks && (
            <ComplianceFrameworkCalculator 
              frameworks={frameworks}
              vesselData={{
                grossTonnage: vesselInfo.grossTonnage,
                fuelConsumption: fuelConsumptionData.reduce((sum, fuel) => sum + fuel.fuelConsumed, 0),
                ghgIntensity: calculateWeightedGHGIntensity(),
                voyageType: 'intra-eu'
              }}
            />
          )}
          {!frameworks && (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Multi-framework analysis requires compliance framework selection</p>
                  <p className="text-sm">Please select frameworks from the main dashboard</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="planning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Planning Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced planning tools for scenario analysis, fuel optimization, and credit management will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CalculateAndPlanning;