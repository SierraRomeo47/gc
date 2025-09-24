import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Ship, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Calculator, 
  Euro,
  Target,
  Fuel,
  Globe,
  FileText,
  Clock,
  BarChart3,
  Zap,
  Anchor,
  MapPin
} from "lucide-react";
import { FUELEU_MARITIME, EU_ETS, IMO_NET_ZERO, UK_ETS, calculateFuelEUPenalty, calculateEUETSCost, calculateIMOGap } from "@/lib/regulatoryConstants";

interface FrameworkTilesProps {
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

const FrameworkSpecificTiles = ({ frameworks, vesselData }: FrameworkTilesProps) => {
  
  // FuelEU Maritime Calculations using corrected regulatory constants
  const currentYear = 2025;
  const fuelEUTargetData = FUELEU_MARITIME.targets[currentYear];
  const energyUsed = vesselData.fuelConsumption * 1000 * 40.2; // Convert tonnes to kg to MJ
  const fuelEUData = {
    currentIntensity: vesselData.ghgIntensity,
    targetIntensity: fuelEUTargetData.intensity, // Official 2025 target
    poolingBalance: 125.3, // Placeholder - should come from pooling system
    bankedCredits: 45.2, // Placeholder - should come from banking system
    borrowedCredits: 0,
    complianceGap: Math.max(0, vesselData.ghgIntensity - fuelEUTargetData.intensity),
    penaltyExposure: calculateFuelEUPenalty(vesselData.ghgIntensity, fuelEUTargetData.intensity, energyUsed),
    nextDeadline: "January 31, 2026", // FuelEU Maritime reporting deadline
    daysToDeadline: 128
  };

  // EU ETS Calculations using corrected voyage-aware calculations
  const phaseInCoverage = EU_ETS.phaseIn[currentYear as keyof typeof EU_ETS.phaseIn];
  const voyageCoverage = EU_ETS.voyageCoverage[vesselData.voyageType];
  const totalCoverage = phaseInCoverage * voyageCoverage;
  const euETSData = {
    coveragePhase: Math.round(phaseInCoverage * 100), // Phase-in coverage
    euaPrice: EU_ETS.allowancePrice, // Current EUA price
    annualEmissions: vesselData.fuelConsumption * EU_ETS.emissionFactor, // tCO2
    allowancesRequired: Math.round(vesselData.fuelConsumption * EU_ETS.emissionFactor * totalCoverage),
    allowanceCost: calculateEUETSCost(vesselData.fuelConsumption, vesselData.voyageType, currentYear),
    mohaBalance: 1250, // Placeholder - should come from THETIS-MRV integration
    voyageCoverage: Math.round(voyageCoverage * 100), // % coverage by voyage type
    surrenderDeadline: EU_ETS.surrenderDeadline,
    daysToSurrender: 249
  };

  // IMO Net Zero Calculations using official 2023 IMO strategy
  const imoAssessment = calculateIMOGap(vesselData.ghgIntensity, currentYear);
  const imoData = {
    currentReduction: ((IMO_NET_ZERO.baseline - vesselData.ghgIntensity) / IMO_NET_ZERO.baseline) * 100,
    target2030: IMO_NET_ZERO.targets[2030].reduction, // Official 20% reduction by 2030
    target2050: 96, // Official net-zero target (96% reduction with 4% residual)
    trajectoryCompliance: imoAssessment.isCompliant ? 'compliant' : 'warning',
    complianceGap: imoAssessment.gap,
    technologyReadiness: 'green-ammonia', // Next technology milestone
    implementationYear: IMO_NET_ZERO.economicMeasures.implementationYear,
    estimatedLevy: IMO_NET_ZERO.economicMeasures.estimatedLevy
  };

  // UK ETS Calculations with proper coverage determination
  const ukCoverage = vesselData.voyageType === 'intra-eu' ? 0.25 : 0.15; // Simplified coverage estimate
  const ukETSData = {
    ukAllowancePrice: UK_ETS.allowancePrice * UK_ETS.currencyConversion, // GBP to EUR conversion
    ukCoverage: Math.round(ukCoverage * 100), // Coverage percentage
    ukEmissions: vesselData.fuelConsumption * UK_ETS.emissionFactor * ukCoverage,
    ukCost: vesselData.fuelConsumption * UK_ETS.emissionFactor * ukCoverage * UK_ETS.allowancePrice * UK_ETS.currencyConversion,
    portCallsUK: 12, // Annual UK port calls
    compliance: 'market-based'
  };

  const renderFuelEUMaritimeTiles = () => (
    <div className="space-y-4">
      {/* GHG Intensity Performance */}
      <Card className="hover-elevate border border-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Fuel className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">GHG Intensity Performance</CardTitle>
            </div>
            <Badge variant={fuelEUData.complianceGap === 0 ? "default" : "destructive"}>
              {fuelEUData.complianceGap === 0 ? "Compliant" : "Non-Compliant"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{fuelEUData.currentIntensity.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Current gCO2e/MJ</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{fuelEUData.targetIntensity}</div>
              <div className="text-xs text-muted-foreground">2025 Target</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${fuelEUData.complianceGap > 0 ? 'text-destructive' : 'text-green-600'}`} data-testid="text-compliance-gap">
                {fuelEUData.complianceGap.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Gap gCO2e/MJ</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Intensity Reduction Progress</span>
              <span>{Math.min(100, (fuelEUData.targetIntensity / fuelEUData.currentIntensity) * 100).toFixed(1)}%</span>
            </div>
            <Progress 
              value={Math.min(100, (fuelEUData.targetIntensity / fuelEUData.currentIntensity) * 100)} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pooling & Banking Mechanism */}
      <Card className="hover-elevate border border-green-500">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Pooling & Banking Mechanism</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-xl font-bold ${fuelEUData.poolingBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {fuelEUData.poolingBalance >= 0 ? '+' : ''}{fuelEUData.poolingBalance.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Pooling Balance</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{fuelEUData.bankedCredits.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Banked Credits</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600">{fuelEUData.borrowedCredits.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Borrowed Credits</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Penalty Exposure & Deadlines */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="hover-elevate border border-red-500">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <CardTitle className="text-base">Penalty Exposure</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive" data-testid="text-penalty-exposure">
                €{fuelEUData.penaltyExposure.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-muted-foreground">Annual Risk (€2,400/tCO2eq)</div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate border border-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <CardTitle className="text-base">Next Deadline</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{fuelEUData.daysToDeadline} days</div>
              <div className="text-xs text-muted-foreground">{fuelEUData.nextDeadline}</div>
              <div className="text-xs text-muted-foreground">Emissions Report Due</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderEUETSTiles = () => (
    <div className="space-y-4">
      {/* EUA Allowance Tracking */}
      <Card className="hover-elevate border border-purple-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Euro className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">EUA Allowance Tracking</CardTitle>
            </div>
            <Badge variant="secondary">Phase {euETSData.coveragePhase}% Coverage</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{euETSData.annualEmissions.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">Annual tCO2</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600" data-testid="text-allowances-required">{euETSData.allowancesRequired}</div>
              <div className="text-xs text-muted-foreground">EUAs Required</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">€{euETSData.euaPrice}</div>
              <div className="text-xs text-muted-foreground">Current EUA Price</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-destructive" data-testid="text-allowance-cost">
                €{euETSData.allowanceCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-muted-foreground">Annual Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MOHA Balance & Voyage Coverage */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="hover-elevate border border-cyan-500">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-cyan-600" />
              <CardTitle className="text-base">MOHA Balance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-600" data-testid="text-moha-balance">{euETSData.mohaBalance.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Available Allowances</div>
              <div className="mt-2">
                <Badge variant={euETSData.mohaBalance >= euETSData.allowancesRequired ? "default" : "destructive"}>
                  {euETSData.mohaBalance >= euETSData.allowancesRequired ? "Sufficient" : "Deficit"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate border border-indigo-500">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-indigo-600" />
              <CardTitle className="text-base">Voyage Coverage</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600" data-testid="text-voyage-coverage">{euETSData.voyageCoverage}%</div>
              <div className="text-xs text-muted-foreground">{vesselData.voyageType === 'intra-eu' ? 'Intra-EU' : 'Extra-EU'} Routes</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {vesselData.voyageType === 'intra-eu' ? '100% of voyage covered' : '50% of voyage covered'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Surrender Deadline */}
      <Card className="hover-elevate border border-yellow-500">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <CardTitle className="text-base">EUA Surrender Deadline</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-bold text-yellow-600">{euETSData.daysToSurrender} days remaining</div>
              <div className="text-sm text-muted-foreground">{euETSData.surrenderDeadline}</div>
            </div>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-1" />
              THETIS-MRV Upload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIMONetZeroTiles = () => (
    <div className="space-y-4">
      {/* Decarbonization Trajectory */}
      <Card className="hover-elevate border border-emerald-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg">Decarbonization Trajectory</CardTitle>
            </div>
            <Badge variant={imoData.trajectoryCompliance === 'compliant' ? "default" : "secondary"}>
              {imoData.trajectoryCompliance === 'compliant' ? "On Track" : "Monitoring"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-600" data-testid="text-current-reduction">{imoData.currentReduction.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Current Reduction</div>
              <div className="text-xs text-muted-foreground">vs 2008 Baseline</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{imoData.target2030}%</div>
              <div className="text-xs text-muted-foreground">2030 Target</div>
              <div className="text-xs text-muted-foreground">5 years remaining</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600" data-testid="text-target-2050">{imoData.target2050}%</div>
              <div className="text-xs text-muted-foreground">2050 Target</div>
              <div className="text-xs text-muted-foreground">Net Zero Goal</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress to 2030 Target</span>
              <span>{((imoData.currentReduction / imoData.target2030) * 100).toFixed(1)}%</span>
            </div>
            <Progress 
              value={Math.min(100, (imoData.currentReduction / imoData.target2030) * 100)} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Technology Implementation */}
      <Card className="hover-elevate border border-teal-500">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-teal-600" />
            <CardTitle className="text-lg">Technology Implementation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Green Ammonia Readiness</span>
              <Badge variant="secondary">2027 Target</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Shore Power Infrastructure</span>
              <Badge variant="outline">Planning Phase</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Alternative Fuel Bunkering</span>
              <Badge variant="outline">Assessment Required</Badge>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">
              Next milestone: IMO Economic Measures implementation ({imoData.implementationYear})
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Economic Measures Estimate */}
      <Card className="hover-elevate border border-amber-500">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Calculator className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-base">Economic Measures (Estimated)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600" data-testid="text-estimated-levy">€{imoData.estimatedLevy}</div>
            <div className="text-xs text-muted-foreground">Estimated Levy per tCO2eq</div>
            <div className="text-xs text-muted-foreground mt-1">Subject to IMO negotiations</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderUKETSTiles = () => (
    <div className="space-y-4">
      {/* UK Allowance Tracking */}
      <Card className="hover-elevate border border-rose-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Anchor className="h-5 w-5 text-rose-600" />
              <CardTitle className="text-lg">UK Allowance Tracking</CardTitle>
            </div>
            <Badge variant="secondary">Market-Based</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-rose-600" data-testid="text-uk-emissions">{ukETSData.ukEmissions.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">UK Covered tCO2</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">€{ukETSData.ukAllowancePrice.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">UK Allowance Price</div>
              <div className="text-xs text-muted-foreground">(GBP converted)</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-destructive" data-testid="text-uk-cost">
                €{ukETSData.ukCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-muted-foreground">Annual UK Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UK Port Operations */}
      <Card className="hover-elevate border border-violet-500">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Ship className="h-4 w-4 text-violet-600" />
            <CardTitle className="text-base">UK Port Operations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold text-violet-600">{ukETSData.portCallsUK}</div>
              <div className="text-xs text-muted-foreground">Annual UK Port Calls</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600" data-testid="text-uk-coverage">{ukETSData.ukCoverage}%</div>
              <div className="text-xs text-muted-foreground">Estimated Coverage</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs text-muted-foreground">
              Coverage applies to voyages calling at UK ports, following similar methodology to EU ETS
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="framework-specific-tiles">
      {frameworks.fuelEUMaritime && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Fuel className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-600">FuelEU Maritime</h3>
            <Badge variant="outline">Active</Badge>
          </div>
          {renderFuelEUMaritimeTiles()}
        </div>
      )}

      {frameworks.euETS && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Euro className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-600">EU Emissions Trading System</h3>
            <Badge variant="outline">Active</Badge>
          </div>
          {renderEUETSTiles()}
        </div>
      )}

      {frameworks.imoNetZero && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-600">IMO Net Zero Framework</h3>
            <Badge variant="outline">Active</Badge>
          </div>
          {renderIMONetZeroTiles()}
        </div>
      )}

      {frameworks.ukETS && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Anchor className="h-5 w-5 text-rose-600" />
            <h3 className="text-lg font-semibold text-rose-600">UK Emissions Trading System</h3>
            <Badge variant="outline">Active</Badge>
          </div>
          {renderUKETSTiles()}
        </div>
      )}

      {!Object.values(frameworks).some(Boolean) && (
        <Card className="hover-elevate">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <Ship className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No compliance frameworks selected</p>
              <p className="text-sm">Enable frameworks above to see specific tiles and metrics</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FrameworkSpecificTiles;