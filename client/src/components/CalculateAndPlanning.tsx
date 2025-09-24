import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, TrendingUp, AlertTriangle, CheckCircle2, Fuel, Ship, Target, BarChart3 } from "lucide-react";
import { useState } from "react";

interface PenaltyCalculation {
  deficit: number;
  penaltyRate: number;
  totalPenalty: number;
  complianceGap: number;
}

interface FuelMixScenario {
  fuelType: string;
  percentage: number;
  ghgIntensity: number;
  cost: number;
}

interface ComplianceScenario {
  name: string;
  currentIntensity: number;
  targetIntensity: number;
  energyUsed: number;
  creditBalance: number;
  scenarios: FuelMixScenario[];
}

const CalculateAndPlanning = () => {
  const [activeTab, setActiveTab] = useState("penalty");
  
  // Penalty Calculator State
  const [vesselName, setVesselName] = useState("Atlantic Pioneer");
  const [currentIntensity, setCurrentIntensity] = useState(85.2);
  const [targetIntensity, setTargetIntensity] = useState(89.3);
  const [energyUsed, setEnergyUsed] = useState(125000);
  const [penaltyCalculation, setPenaltyCalculation] = useState<PenaltyCalculation | null>(null);

  // Compliance Planning State
  const [planningScenario, setPlanningScenario] = useState<ComplianceScenario>({
    name: "2025 Compliance Plan",
    currentIntensity: 92.5,
    targetIntensity: 89.3,
    energyUsed: 1500000,
    creditBalance: -125.5,
    scenarios: [
      { fuelType: "HFO", percentage: 60, ghgIntensity: 91.2, cost: 520 },
      { fuelType: "MGO", percentage: 30, ghgIntensity: 85.1, cost: 680 },
      { fuelType: "Bio-LNG", percentage: 10, ghgIntensity: 45.3, cost: 1200 }
    ]
  });

  // Fuel Optimization State
  const [fuelMix, setFuelMix] = useState<FuelMixScenario[]>([
    { fuelType: "HFO", percentage: 70, ghgIntensity: 91.2, cost: 520 },
    { fuelType: "MGO", percentage: 20, ghgIntensity: 85.1, cost: 680 },
    { fuelType: "Bio-fuel", percentage: 10, ghgIntensity: 55.0, cost: 950 }
  ]);

  // Credit Planning State
  const [creditPlan, setCreditPlan] = useState({
    currentBalance: -125.5,
    requiredCredits: 250.0,
    bankingPlan: 100.0,
    borrowingPlan: 150.0,
    tradingBudget: 50000
  });

  const calculatePenalty = () => {
    const complianceGap = Math.max(0, currentIntensity - targetIntensity);
    const deficit = complianceGap * energyUsed / 1000; // Convert to proper units
    const penaltyRate = 2400; // EUR per tonne CO2eq
    const totalPenalty = deficit * penaltyRate;
    
    const result: PenaltyCalculation = {
      deficit,
      penaltyRate,
      totalPenalty,
      complianceGap
    };
    
    setPenaltyCalculation(result);
    console.log('Penalty calculation triggered:', result);
  };

  const calculateFuelMixIntensity = (scenarios: FuelMixScenario[]) => {
    const totalPercentage = scenarios.reduce((sum, s) => sum + s.percentage, 0);
    if (totalPercentage === 0) return 0;
    
    return scenarios.reduce((sum, s) => sum + (s.ghgIntensity * s.percentage / totalPercentage), 0);
  };

  const calculateFuelMixCost = (scenarios: FuelMixScenario[]) => {
    const totalPercentage = scenarios.reduce((sum, s) => sum + s.percentage, 0);
    if (totalPercentage === 0) return 0;
    
    return scenarios.reduce((sum, s) => sum + (s.cost * s.percentage / totalPercentage), 0);
  };

  const updateFuelMixPercentage = (index: number, newPercentage: number) => {
    const newMix = [...fuelMix];
    newMix[index].percentage = newPercentage;
    setFuelMix(newMix);
  };

  const addFuelType = () => {
    setFuelMix([...fuelMix, { fuelType: "New Fuel", percentage: 0, ghgIntensity: 80.0, cost: 600 }]);
  };

  const removeFuelType = (index: number) => {
    if (fuelMix.length > 1) {
      setFuelMix(fuelMix.filter((_, i) => i !== index));
    }
  };

  const renderPenaltyCalculator = () => (
    <div className="space-y-6">
      <Card className="hover-elevate">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Penalty Calculator</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vessel-name">Vessel Name</Label>
                <Input
                  id="vessel-name"
                  value={vesselName}
                  onChange={(e) => setVesselName(e.target.value)}
                  data-testid="input-vessel-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="energy-used">Total Energy Used (MJ)</Label>
                <Input
                  id="energy-used"
                  type="number"
                  step="1000"
                  value={energyUsed}
                  onChange={(e) => setEnergyUsed(parseFloat(e.target.value) || 0)}
                  data-testid="input-energy-used"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-intensity">Current GHG Intensity (gCO2e/MJ)</Label>
                <Input
                  id="current-intensity"
                  type="number"
                  step="0.1"
                  value={currentIntensity}
                  onChange={(e) => setCurrentIntensity(parseFloat(e.target.value) || 0)}
                  data-testid="input-current-intensity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-intensity">Target GHG Intensity (gCO2e/MJ)</Label>
                <Input
                  id="target-intensity"
                  type="number"
                  step="0.1"
                  value={targetIntensity}
                  onChange={(e) => setTargetIntensity(parseFloat(e.target.value) || 0)}
                  data-testid="input-target-intensity"
                />
              </div>
            </div>

            <Button onClick={calculatePenalty} className="w-full" data-testid="button-calculate-penalty">
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Penalty
            </Button>

            {penaltyCalculation && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  {penaltyCalculation.complianceGap === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">Calculation Results</span>
                  <Badge variant={penaltyCalculation.complianceGap === 0 ? "default" : "destructive"}>
                    {penaltyCalculation.complianceGap === 0 ? "Compliant" : "Non-Compliant"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Compliance Gap</div>
                    <div className="text-lg font-bold">{penaltyCalculation.complianceGap.toFixed(2)} gCO2e/MJ</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Deficit</div>
                    <div className="text-lg font-bold">{penaltyCalculation.deficit.toFixed(1)} tCO2eq</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Penalty Rate</div>
                    <div className="text-lg font-bold">€{penaltyCalculation.penaltyRate.toLocaleString()}/tCO2eq</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Total Penalty</div>
                    <div className={`text-xl font-bold ${penaltyCalculation.totalPenalty > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      €{penaltyCalculation.totalPenalty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFuelOptimization = () => (
    <div className="space-y-6">
      <Card className="hover-elevate">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Fuel className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Fuel Mix Optimization</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fuelMix.map((fuel, index) => (
              <div key={index} className="grid grid-cols-5 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Fuel Type</Label>
                  <Select value={fuel.fuelType} onValueChange={(value) => {
                    const newMix = [...fuelMix];
                    newMix[index].fuelType = value;
                    setFuelMix(newMix);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HFO">Heavy Fuel Oil (HFO)</SelectItem>
                      <SelectItem value="MGO">Marine Gas Oil (MGO)</SelectItem>
                      <SelectItem value="LNG">Liquefied Natural Gas (LNG)</SelectItem>
                      <SelectItem value="Bio-LNG">Bio-LNG</SelectItem>
                      <SelectItem value="Bio-fuel">Bio-fuel</SelectItem>
                      <SelectItem value="e-Methanol">e-Methanol</SelectItem>
                      <SelectItem value="e-Ammonia">e-Ammonia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Percentage (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={fuel.percentage}
                    onChange={(e) => updateFuelMixPercentage(index, parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>GHG Intensity</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={fuel.ghgIntensity}
                    onChange={(e) => {
                      const newMix = [...fuelMix];
                      newMix[index].ghgIntensity = parseFloat(e.target.value) || 0;
                      setFuelMix(newMix);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost (€/MT)</Label>
                  <Input
                    type="number"
                    value={fuel.cost}
                    onChange={(e) => {
                      const newMix = [...fuelMix];
                      newMix[index].cost = parseFloat(e.target.value) || 0;
                      setFuelMix(newMix);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Action</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFuelType(index)}
                    disabled={fuelMix.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            <Button onClick={addFuelType} variant="outline" className="w-full">
              Add Fuel Type
            </Button>

            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total Percentage</div>
                <div className={`text-lg font-bold ${fuelMix.reduce((sum, f) => sum + f.percentage, 0) === 100 ? 'text-green-600' : 'text-destructive'}`}>
                  {fuelMix.reduce((sum, f) => sum + f.percentage, 0).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Weighted GHG Intensity</div>
                <div className="text-lg font-bold">{calculateFuelMixIntensity(fuelMix).toFixed(1)} gCO2e/MJ</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Weighted Cost</div>
                <div className="text-lg font-bold">€{calculateFuelMixCost(fuelMix).toFixed(0)}/MT</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCompliancePlanning = () => (
    <div className="space-y-6">
      <Card className="hover-elevate">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Compliance Scenario Planning</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scenario Name</Label>
                <Input
                  value={planningScenario.name}
                  onChange={(e) => setPlanningScenario({...planningScenario, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Energy Used (MJ)</Label>
                <Input
                  type="number"
                  value={planningScenario.energyUsed}
                  onChange={(e) => setPlanningScenario({...planningScenario, energyUsed: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Current Intensity (gCO2e/MJ)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={planningScenario.currentIntensity}
                  onChange={(e) => setPlanningScenario({...planningScenario, currentIntensity: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Intensity (gCO2e/MJ)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={planningScenario.targetIntensity}
                  onChange={(e) => setPlanningScenario({...planningScenario, targetIntensity: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Current Credit Balance</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={planningScenario.creditBalance}
                  onChange={(e) => setPlanningScenario({...planningScenario, creditBalance: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3">Scenario Analysis</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Compliance Gap</div>
                  <div className={`text-lg font-bold ${planningScenario.currentIntensity <= planningScenario.targetIntensity ? 'text-green-600' : 'text-destructive'}`}>
                    {Math.max(0, planningScenario.currentIntensity - planningScenario.targetIntensity).toFixed(2)} gCO2e/MJ
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Required Credits</div>
                  <div className="text-lg font-bold">
                    {Math.max(0, (planningScenario.currentIntensity - planningScenario.targetIntensity) * planningScenario.energyUsed / 1000).toFixed(1)} Credits
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge variant={planningScenario.currentIntensity <= planningScenario.targetIntensity ? "default" : "destructive"}>
                    {planningScenario.currentIntensity <= planningScenario.targetIntensity ? "Compliant" : "Non-Compliant"}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Improvement Needed</div>
                  <div className="text-lg font-bold">
                    {Math.max(0, ((planningScenario.currentIntensity - planningScenario.targetIntensity) / planningScenario.currentIntensity * 100)).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCreditPlanning = () => (
    <div className="space-y-6">
      <Card className="hover-elevate">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Credit Banking & Trading Planning</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Credit Balance</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={creditPlan.currentBalance}
                  onChange={(e) => setCreditPlan({...creditPlan, currentBalance: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Required Credits</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={creditPlan.requiredCredits}
                  onChange={(e) => setCreditPlan({...creditPlan, requiredCredits: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Banking Plan (Credits)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={creditPlan.bankingPlan}
                  onChange={(e) => setCreditPlan({...creditPlan, bankingPlan: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Borrowing Plan (Credits)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={creditPlan.borrowingPlan}
                  onChange={(e) => setCreditPlan({...creditPlan, borrowingPlan: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Trading Budget (€)</Label>
              <Input
                type="number"
                step="1000"
                value={creditPlan.tradingBudget}
                onChange={(e) => setCreditPlan({...creditPlan, tradingBudget: parseFloat(e.target.value) || 0})}
              />
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3">Credit Planning Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Net Position</div>
                  <div className={`text-lg font-bold ${(creditPlan.currentBalance + creditPlan.bankingPlan + creditPlan.borrowingPlan - creditPlan.requiredCredits) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {(creditPlan.currentBalance + creditPlan.bankingPlan + creditPlan.borrowingPlan - creditPlan.requiredCredits).toFixed(1)} Credits
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Strategy Status</div>
                  <Badge variant={(creditPlan.currentBalance + creditPlan.bankingPlan + creditPlan.borrowingPlan - creditPlan.requiredCredits) >= 0 ? "default" : "destructive"}>
                    {(creditPlan.currentBalance + creditPlan.bankingPlan + creditPlan.borrowingPlan - creditPlan.requiredCredits) >= 0 ? "Sufficient" : "Deficit"}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Estimated Cost</div>
                  <div className="text-lg font-bold">
                    €{((creditPlan.borrowingPlan * 2400) + (creditPlan.tradingBudget)).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Banking Interest</div>
                  <div className="text-lg font-bold text-green-600">
                    +{(creditPlan.bankingPlan * 0.02).toFixed(1)} Credits/year
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" data-testid="calculate-and-planning">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Calculate & Planning</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive tools for FuelEU Maritime compliance calculations, scenario planning, and fuel optimization
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="penalty" data-testid="tab-penalty">
            <Calculator className="h-4 w-4 mr-2" />
            Penalty Calculator
          </TabsTrigger>
          <TabsTrigger value="fuel" data-testid="tab-fuel">
            <Fuel className="h-4 w-4 mr-2" />
            Fuel Optimization
          </TabsTrigger>
          <TabsTrigger value="planning" data-testid="tab-planning">
            <Target className="h-4 w-4 mr-2" />
            Compliance Planning
          </TabsTrigger>
          <TabsTrigger value="credits" data-testid="tab-credits">
            <BarChart3 className="h-4 w-4 mr-2" />
            Credit Planning
          </TabsTrigger>
        </TabsList>

        <TabsContent value="penalty" className="space-y-6">
          {renderPenaltyCalculator()}
        </TabsContent>

        <TabsContent value="fuel" className="space-y-6">
          {renderFuelOptimization()}
        </TabsContent>

        <TabsContent value="planning" className="space-y-6">
          {renderCompliancePlanning()}
        </TabsContent>

        <TabsContent value="credits" className="space-y-6">
          {renderCreditPlanning()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CalculateAndPlanning;