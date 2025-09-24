import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface PenaltyCalculation {
  deficit: number;
  penaltyRate: number;
  totalPenalty: number;
  complianceGap: number;
}

interface PenaltyCalculatorProps {
  vesselName: string;
  currentIntensity: number;
  targetIntensity: number;
  energyUsed: number;
  onCalculate?: (calculation: PenaltyCalculation) => void;
}

const PenaltyCalculator = ({
  vesselName,
  currentIntensity,
  targetIntensity,
  energyUsed,
  onCalculate
}: PenaltyCalculatorProps) => {
  const [customIntensity, setCustomIntensity] = useState(currentIntensity);
  const [customEnergy, setCustomEnergy] = useState(energyUsed);
  const [calculation, setCalculation] = useState<PenaltyCalculation | null>(null);

  const calculatePenalty = () => {
    const complianceGap = Math.max(0, customIntensity - targetIntensity);
    const deficit = complianceGap * customEnergy;
    const penaltyRate = 2400; // EUR per tonne CO2eq (from FuelEU Maritime regulation)
    const totalPenalty = deficit * penaltyRate / 1000; // Convert to proper units
    
    const result: PenaltyCalculation = {
      deficit,
      penaltyRate,
      totalPenalty,
      complianceGap
    };
    
    setCalculation(result);
    console.log('Penalty calculation triggered:', result);
    onCalculate?.(result);
  };

  const handleCustomIntensityChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setCustomIntensity(numValue);
    }
  };

  const handleCustomEnergyChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setCustomEnergy(numValue);
    }
  };

  const isCompliant = calculation ? calculation.complianceGap === 0 : customIntensity <= targetIntensity;

  return (
    <Card className="hover-elevate" data-testid="penalty-calculator">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Penalty Calculator - {vesselName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Input Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ghg-intensity">GHG Intensity (gCO2e/MJ)</Label>
              <Input
                id="ghg-intensity"
                type="number"
                step="0.1"
                value={customIntensity}
                onChange={(e) => handleCustomIntensityChange(e.target.value)}
                data-testid="input-ghg-intensity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="energy-used">Energy Used (MJ)</Label>
              <Input
                id="energy-used"
                type="number"
                step="0.1"
                value={customEnergy}
                onChange={(e) => handleCustomEnergyChange(e.target.value)}
                data-testid="input-energy-used"
              />
            </div>
          </div>

          {/* Target Information */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Target GHG Intensity</span>
              <span className="text-sm font-bold">{targetIntensity.toFixed(1)} gCO2e/MJ</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-muted-foreground">Compliance Gap</span>
              <span className={`text-sm font-medium ${customIntensity > targetIntensity ? 'text-destructive' : 'text-green-600'}`}>
                {Math.max(0, customIntensity - targetIntensity).toFixed(1)} gCO2e/MJ
              </span>
            </div>
          </div>

          {/* Calculate Button */}
          <Button 
            onClick={calculatePenalty} 
            className="w-full"
            data-testid="button-calculate-penalty"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Penalty
          </Button>

          {/* Results */}
          {calculation && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center space-x-2">
                {isCompliant ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                )}
                <span className="font-medium">Penalty Calculation Results</span>
                <Badge variant={isCompliant ? "default" : "destructive"}>
                  {isCompliant ? "Compliant" : "Non-Compliant"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Compliance Deficit</span>
                    <span className="text-sm font-medium" data-testid="result-deficit">
                      {calculation.deficit.toFixed(1)} tCO2eq
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Penalty Rate</span>
                    <span className="text-sm font-medium">
                      €{calculation.penaltyRate.toLocaleString()}/tCO2eq
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Penalty</span>
                    <span className={`text-lg font-bold ${calculation.totalPenalty > 0 ? 'text-destructive' : 'text-green-600'}`} data-testid="result-total-penalty">
                      €{calculation.totalPenalty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {calculation.totalPenalty > 0 && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    This vessel requires additional compliance measures to avoid penalties.
                    Consider banking credits, using alternative fuels, or implementing efficiency measures.
                  </p>
                </div>
              )}

              {calculation.totalPenalty === 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-4 w-4 inline mr-1" />
                    This vessel is in compliance with FuelEU Maritime requirements.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PenaltyCalculator;