import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, TrendingUp, Ship, Calculator, Euro } from "lucide-react";

interface ComplianceFramework {
  name: string;
  enabled: boolean;
  calculations: ComplianceCalculation;
}

interface ComplianceCalculation {
  currentEmissions: number;
  targetEmissions: number;
  allowancePrice: number;
  totalCost: number;
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
  details: {
    description: string;
    methodology: string;
    coverage: string;
  };
}

interface ComplianceFrameworkCalculatorProps {
  frameworks: {
    fuelEUMaritime: boolean;
    euETS: boolean;
    imoNetZero: boolean;
    ukETS: boolean;
  };
  vesselData: {
    grossTonnage: number;
    fuelConsumption: number;
    ghgIntensity: number;
    voyageType: 'intra-eu' | 'extra-eu';
  };
}

const ComplianceFrameworkCalculator = ({ frameworks, vesselData }: ComplianceFrameworkCalculatorProps) => {
  
  // FuelEU Maritime Calculations
  const calculateFuelEUMaritime = (): ComplianceCalculation => {
    const targetIntensity = 89.3; // 2025 target: 2% reduction from baseline 91.16
    const currentIntensity = vesselData.ghgIntensity;
    const energyUsed = vesselData.fuelConsumption * 40.2 * 1000; // Convert to MJ
    
    const complianceGap = Math.max(0, currentIntensity - targetIntensity);
    const deficit = complianceGap * energyUsed / 1000000; // Convert to tCO2eq
    const penaltyRate = 2400; // EUR per tonne CO2eq
    const totalCost = deficit * penaltyRate;
    
    return {
      currentEmissions: currentIntensity,
      targetEmissions: targetIntensity,
      allowancePrice: penaltyRate,
      totalCost,
      complianceStatus: complianceGap === 0 ? 'compliant' : complianceGap < 5 ? 'warning' : 'non-compliant',
      details: {
        description: "FuelEU Maritime requires progressive reduction in GHG intensity of energy used on board",
        methodology: "Well-to-wake GHG intensity calculation with 2% reduction target for 2025",
        coverage: "Ships ≥5000 GT calling at EU ports, 50% of voyages between EU ports"
      }
    };
  };

  // EU ETS Calculations
  const calculateEUETS = (): ComplianceCalculation => {
    const emissionFactor = 3.114; // tCO2/tonne fuel for HFO
    const currentEmissions = vesselData.fuelConsumption * emissionFactor;
    const allowancePrice = 85; // EUR per tonne CO2 (approximate current price)
    const totalCost = currentEmissions * allowancePrice;
    
    // EU ETS applies to 100% from 2026, 40% in 2024, 70% in 2025
    const coverage = 0.7; // 2025 coverage
    const coveredEmissions = currentEmissions * coverage;
    const actualCost = coveredEmissions * allowancePrice;
    
    return {
      currentEmissions: coveredEmissions,
      targetEmissions: 0, // No specific target, market-based
      allowancePrice,
      totalCost: actualCost,
      complianceStatus: 'compliant', // Compliance through allowance purchase
      details: {
        description: "EU Emissions Trading System covers CO2 emissions from shipping",
        methodology: "Fuel-based emission factors applied to covered voyages",
        coverage: "Ships ≥5000 GT: 100% intra-EU, 50% extra-EU voyages (from 2026)"
      }
    };
  };

  // IMO Net Zero Framework Calculations
  const calculateIMONetZero = (): ComplianceCalculation => {
    const baselineIntensity = 91.16; // 2008 baseline
    const targetReduction2030 = 0.2; // 20% reduction by 2030
    const targetReduction2050 = 0.7; // 70% reduction by 2050
    
    // Linear interpolation for current year (2025)
    const yearProgress = (2025 - 2020) / (2030 - 2020); // Progress between milestones
    const currentTargetReduction = yearProgress * targetReduction2030;
    const targetIntensity = baselineIntensity * (1 - currentTargetReduction);
    
    const currentIntensity = vesselData.ghgIntensity;
    const gap = Math.max(0, currentIntensity - targetIntensity);
    
    // Economic measures still being developed - using estimated levy
    const estimatedLevy = 150; // EUR per tonne CO2eq (estimated)
    const energyUsed = vesselData.fuelConsumption * 40.2 * 1000;
    const excessEmissions = gap * energyUsed / 1000000;
    const totalCost = excessEmissions * estimatedLevy;
    
    return {
      currentEmissions: currentIntensity,
      targetEmissions: targetIntensity,
      allowancePrice: estimatedLevy,
      totalCost,
      complianceStatus: gap === 0 ? 'compliant' : gap < 5 ? 'warning' : 'non-compliant',
      details: {
        description: "IMO strategy aims for net-zero GHG emissions by 2050",
        methodology: "Well-to-wake GHG intensity with interim targets: 20% by 2030, 70% by 2050",
        coverage: "All international shipping under IMO jurisdiction"
      }
    };
  };

  // UK ETS Calculations
  const calculateUKETS = (): ComplianceCalculation => {
    const emissionFactor = 3.114; // tCO2/tonne fuel
    const currentEmissions = vesselData.fuelConsumption * emissionFactor;
    const allowancePrice = 75; // GBP per tonne CO2 (converted to EUR ~85)
    const allowancePriceEUR = allowancePrice * 1.13; // GBP to EUR conversion
    
    // UK ETS coverage similar to EU ETS but for UK voyages
    const coverage = vesselData.voyageType === 'intra-eu' ? 0.5 : 0.25; // Estimated UK coverage
    const coveredEmissions = currentEmissions * coverage;
    const totalCost = coveredEmissions * allowancePriceEUR;
    
    return {
      currentEmissions: coveredEmissions,
      targetEmissions: 0, // Market-based system
      allowancePrice: allowancePriceEUR,
      totalCost,
      complianceStatus: 'compliant', // Compliance through allowance purchase
      details: {
        description: "UK Emissions Trading System covering shipping emissions to/from UK ports",
        methodology: "Fuel-based emission factors for UK territorial waters and ports",
        coverage: "Ships calling at UK ports with coverage similar to EU ETS"
      }
    };
  };

  // Get active frameworks and their calculations
  const getActiveFrameworks = (): ComplianceFramework[] => {
    const activeFrameworks: ComplianceFramework[] = [];
    
    if (frameworks.fuelEUMaritime) {
      activeFrameworks.push({
        name: "FuelEU Maritime",
        enabled: true,
        calculations: calculateFuelEUMaritime()
      });
    }
    
    if (frameworks.euETS) {
      activeFrameworks.push({
        name: "EU ETS",
        enabled: true,
        calculations: calculateEUETS()
      });
    }
    
    if (frameworks.imoNetZero) {
      activeFrameworks.push({
        name: "IMO Net Zero",
        enabled: true,
        calculations: calculateIMONetZero()
      });
    }
    
    if (frameworks.ukETS) {
      activeFrameworks.push({
        name: "UK ETS",
        enabled: true,
        calculations: calculateUKETS()
      });
    }
    
    return activeFrameworks;
  };

  const activeFrameworks = getActiveFrameworks();
  const totalCumulativeCost = activeFrameworks.reduce((sum, fw) => sum + fw.calculations.totalCost, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'non-compliant': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'non-compliant': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  if (activeFrameworks.length === 0) {
    return (
      <Card className="hover-elevate">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No compliance frameworks selected</p>
            <p className="text-sm">Enable frameworks above to see calculations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="compliance-framework-calculator">
      {/* Cumulative Overview */}
      <Card className="hover-elevate border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Cumulative Compliance Exposure</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Active Frameworks</div>
              <div className="text-2xl font-bold text-primary">
                {activeFrameworks.length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Annual Cost</div>
              <div className="text-2xl font-bold text-destructive">
                €{totalCumulativeCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Overall Status</div>
              <div className="flex items-center justify-center space-x-2">
                {activeFrameworks.some(fw => fw.calculations.complianceStatus === 'non-compliant') ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span className="font-medium text-destructive">Non-Compliant</span>
                  </>
                ) : activeFrameworks.some(fw => fw.calculations.complianceStatus === 'warning') ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-600">Warning</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-600">Compliant</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Framework Calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeFrameworks.map((framework) => (
          <Card key={framework.name} className="hover-elevate">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Ship className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{framework.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(framework.calculations.complianceStatus)}
                  <Badge variant={
                    framework.calculations.complianceStatus === 'compliant' ? 'default' :
                    framework.calculations.complianceStatus === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {framework.calculations.complianceStatus === 'compliant' ? 'Compliant' :
                     framework.calculations.complianceStatus === 'warning' ? 'Warning' : 'Non-Compliant'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                {framework.calculations.targetEmissions > 0 && (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Current</div>
                      <div className="font-medium">
                        {framework.calculations.currentEmissions.toFixed(2)} 
                        {framework.name.includes('ETS') ? ' tCO2' : ' gCO2e/MJ'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Target</div>
                      <div className="font-medium">
                        {framework.calculations.targetEmissions.toFixed(2)}
                        {framework.name.includes('ETS') ? ' tCO2' : ' gCO2e/MJ'}
                      </div>
                    </div>
                  </>
                )}
                
                <div>
                  <div className="text-sm text-muted-foreground">Price/Rate</div>
                  <div className="font-medium">
                    €{framework.calculations.allowancePrice.toFixed(0)}
                    {framework.name.includes('ETS') ? '/tCO2' : '/tCO2eq'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Annual Cost</div>
                  <div className={`font-bold text-lg ${framework.calculations.totalCost > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    €{framework.calculations.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              {/* Progress Bar for Target-based Frameworks */}
              {framework.calculations.targetEmissions > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Performance vs Target</span>
                    <span className={getStatusColor(framework.calculations.complianceStatus)}>
                      {((framework.calculations.targetEmissions / framework.calculations.currentEmissions) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, (framework.calculations.targetEmissions / framework.calculations.currentEmissions) * 100)}
                    className="h-2"
                  />
                </div>
              )}

              {/* Framework Details */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">{framework.calculations.details.description}</p>
                <div className="text-xs text-muted-foreground">
                  <p><strong>Coverage:</strong> {framework.calculations.details.coverage}</p>
                  <p><strong>Methodology:</strong> {framework.calculations.details.methodology}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ComplianceFrameworkCalculator;