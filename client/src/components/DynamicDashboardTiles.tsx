import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Ship, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Fuel, 
  Euro, 
  Target, 
  Globe, 
  Calculator,
  Plus,
  X,
  Edit,
  BarChart3,
  Clock,
  Settings
} from "lucide-react";
import { FUELEU_MARITIME, EU_ETS, IMO_NET_ZERO, UK_ETS, calculateFuelEUPenalty, calculateEUETSCost, calculateIMOGap } from "@/lib/regulatoryConstants";

interface DynamicTilesProps {
  frameworks: {
    fuelEUMaritime: boolean;
    euETS: boolean;
    imoNetZero: boolean;
    ukETS: boolean;
  };
  fleetData: {
    totalVessels: number;
    compliant: number;
    warning: number;
    nonCompliant: number;
    averageIntensity: number;
    totalCredits: number;
  };
  vesselData: {
    grossTonnage: number;
    fuelConsumption: number;
    ghgIntensity: number;
    voyageType: 'intra-eu' | 'extra-eu';
  };
  customTiles: string[];
  onAddCustomTile: (tileType: string) => void;
  onRemoveCustomTile: (tileId: string) => void;
}

const DynamicDashboardTiles = ({ 
  frameworks, 
  fleetData, 
  vesselData, 
  customTiles, 
  onAddCustomTile, 
  onRemoveCustomTile 
}: DynamicTilesProps) => {
  const [showTileManager, setShowTileManager] = useState(false);

  // Calculate priority scores for each framework based on compliance status
  const getFrameworkPriority = () => {
    const priorities = [];
    
    if (frameworks.fuelEUMaritime) {
      const target = FUELEU_MARITIME.targets[2025].intensity;
      const gap = Math.max(0, vesselData.ghgIntensity - target);
      const urgency = gap > 0 ? 3 : fleetData.nonCompliant > 0 ? 2 : 1;
      priorities.push({ framework: 'fuelEUMaritime', urgency, gap, type: 'compliance' });
    }
    
    if (frameworks.euETS) {
      const cost = calculateEUETSCost(vesselData.fuelConsumption, vesselData.voyageType, 2025);
      const urgency = cost > 200000 ? 3 : cost > 100000 ? 2 : 1;
      priorities.push({ framework: 'euETS', urgency, cost, type: 'cost' });
    }
    
    if (frameworks.imoNetZero) {
      const assessment = calculateIMOGap(vesselData.ghgIntensity, 2025);
      const urgency = !assessment.isCompliant ? 3 : 1;
      priorities.push({ framework: 'imoNetZero', urgency, gap: assessment.gap, type: 'trajectory' });
    }
    
    if (frameworks.ukETS) {
      const ukCoverage = vesselData.voyageType === 'intra-eu' ? 0.25 : 0.15;
      const cost = vesselData.fuelConsumption * UK_ETS.emissionFactor * ukCoverage * UK_ETS.allowancePrice * UK_ETS.currencyConversion;
      const urgency = cost > 100000 ? 2 : 1;
      priorities.push({ framework: 'ukETS', urgency, cost, type: 'cost' });
    }
    
    return priorities.sort((a, b) => b.urgency - a.urgency);
  };

  // Render default overview tiles when no frameworks are selected
  const renderDefaultOverviewTiles = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="hover-elevate border border-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Fuel className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">FuelEU Maritime</CardTitle>
          </div>
          <Badge variant="secondary">EU Regulation 2023/1805</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              GHG intensity reduction requirements for maritime transport
            </p>
            <div className="flex justify-between text-xs">
              <span>2025 Target:</span>
              <span className="font-medium">2% reduction</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Penalty Rate:</span>
              <span className="font-medium">€2,400/tCO2eq</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" 
              onClick={() => window.location.href = '#'} data-testid="enable-fueleu">
              Enable Framework
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-elevate border border-purple-500">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Euro className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-base">EU ETS</CardTitle>
          </div>
          <Badge variant="secondary">Phase-in 2024-2027</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Emissions trading system for maritime sector
            </p>
            <div className="flex justify-between text-xs">
              <span>2025 Coverage:</span>
              <span className="font-medium">70%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>EUA Price:</span>
              <span className="font-medium">€85/tonne</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" 
              onClick={() => window.location.href = '#'} data-testid="enable-eu-ets">
              Enable Framework
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-elevate border border-green-500">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base">IMO Net Zero</CardTitle>
          </div>
          <Badge variant="secondary">2023 Strategy</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              International decarbonization framework
            </p>
            <div className="flex justify-between text-xs">
              <span>2030 Target:</span>
              <span className="font-medium">20% reduction</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>2050 Goal:</span>
              <span className="font-medium">Net Zero</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" 
              onClick={() => window.location.href = '#'} data-testid="enable-imo">
              Enable Framework
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-elevate border border-rose-500">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-rose-600" />
            <CardTitle className="text-base">UK ETS</CardTitle>
          </div>
          <Badge variant="secondary">Post-Brexit System</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              UK emissions trading system for maritime
            </p>
            <div className="flex justify-between text-xs">
              <span>Price:</span>
              <span className="font-medium">£75/tonne</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Coverage:</span>
              <span className="font-medium">UK Ports</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" 
              onClick={() => window.location.href = '#'} data-testid="enable-uk-ets">
              Enable Framework
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render priority tiles based on active frameworks
  const renderPriorityTiles = () => {
    const priorities = getFrameworkPriority();
    const activeTiles: JSX.Element[] = [];

    // Add critical compliance tiles first
    priorities.forEach(priority => {
      if (priority.urgency >= 3) {
        switch (priority.framework) {
          case 'fuelEUMaritime':
            activeTiles.push(
              <Card key="fueleu-critical" className="hover-elevate border border-red-500 bg-red-50/50 dark:bg-red-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <CardTitle className="text-base text-red-700 dark:text-red-400">FuelEU Maritime - Critical</CardTitle>
                    </div>
                    <Badge variant="destructive">Action Required</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{priority.gap?.toFixed(1)} gCO2e/MJ</div>
                      <div className="text-xs text-muted-foreground">Above target</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-red-700 dark:text-red-400">Recommended Actions:</div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Consider fuel switching to MGO/LNG</li>
                        <li>• Explore credit pooling opportunities</li>
                        <li>• Review voyage optimization</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            break;
          case 'euETS':
            activeTiles.push(
              <Card key="euets-critical" className="hover-elevate border border-orange-500 bg-orange-50/50 dark:bg-orange-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Euro className="h-5 w-5 text-orange-600" />
                      <CardTitle className="text-base text-orange-700 dark:text-orange-400">EU ETS - High Cost</CardTitle>
                    </div>
                    <Badge variant="secondary">€{(priority.cost || 0).toLocaleString()}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-orange-700 dark:text-orange-400">Cost Reduction Options:</div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Purchase EUAs in advance</li>
                      <li>• Optimize route planning</li>
                      <li>• Consider alternative fuels</li>
                      <li>• Review MOHA balance regularly</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
            break;
          case 'imoNetZero':
            activeTiles.push(
              <Card key="imo-critical" className="hover-elevate border border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-yellow-600" />
                      <CardTitle className="text-base text-yellow-700 dark:text-yellow-400">IMO Net Zero - Off Track</CardTitle>
                    </div>
                    <Badge variant="secondary">2030 Target</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Trajectory Improvement:</div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Develop decarbonization plan</li>
                      <li>• Assess green fuel availability</li>
                      <li>• Consider efficiency measures</li>
                      <li>• Monitor technology developments</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
            break;
        }
      }
    });

    // Add standard priority tiles
    priorities.forEach(priority => {
      if (priority.urgency < 3) {
        switch (priority.framework) {
          case 'fuelEUMaritime':
            activeTiles.push(
              <Card key="fueleu-normal" className="hover-elevate border border-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-base">FuelEU Maritime - Compliant</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{vesselData.ghgIntensity.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">gCO2e/MJ (Below target)</div>
                    <div className="mt-2 text-xs text-green-600">Maintain current performance</div>
                  </div>
                </CardContent>
              </Card>
            );
            break;
          case 'euETS':
            activeTiles.push(
              <Card key="euets-normal" className="hover-elevate border border-purple-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Euro className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-base">EU ETS - Manageable Cost</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">€{(priority.cost || 0).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Annual EUA cost</div>
                    <div className="mt-2 text-xs text-purple-600">Monitor EUA prices</div>
                  </div>
                </CardContent>
              </Card>
            );
            break;
          case 'imoNetZero':
            activeTiles.push(
              <Card key="imo-normal" className="hover-elevate border border-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-base">IMO Net Zero - On Track</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {((FUELEU_MARITIME.baseline - vesselData.ghgIntensity) / FUELEU_MARITIME.baseline * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Reduction achieved</div>
                    <div className="mt-2 text-xs text-green-600">Continue progress</div>
                  </div>
                </CardContent>
              </Card>
            );
            break;
          case 'ukETS':
            activeTiles.push(
              <Card key="ukets-normal" className="hover-elevate border border-rose-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-rose-600" />
                    <CardTitle className="text-base">UK ETS - Moderate Impact</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-rose-600">€{(priority.cost || 0).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Annual UK cost</div>
                    <div className="mt-2 text-xs text-rose-600">Monitor UK operations</div>
                  </div>
                </CardContent>
              </Card>
            );
            break;
        }
      }
    });

    return activeTiles;
  };

  // Render custom tiles
  const renderCustomTiles = () => {
    return customTiles.map((tileType, index) => (
      <Card key={`custom-${index}`} className="hover-elevate border border-gray-400">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-base">{tileType}</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onRemoveCustomTile(`custom-${index}`)}
              data-testid={`remove-tile-${index}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Custom tile content for {tileType}</div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  const availableCustomTiles = [
    "Fleet Performance Summary",
    "Cost Optimization Tracker",
    "Technology Readiness Assessment",
    "Market Price Monitor",
    "Regulatory Updates",
    "Credit Trading Opportunities"
  ];

  const hasActiveFrameworks = Object.values(frameworks).some(Boolean);
  const priorityTiles = hasActiveFrameworks ? renderPriorityTiles() : [];
  const customTileComponents = renderCustomTiles();

  return (
    <div className="space-y-6">
      {/* Tile Management Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Dashboard Tiles</h3>
          <p className="text-sm text-muted-foreground">
            {hasActiveFrameworks 
              ? `Showing priority tiles for ${Object.values(frameworks).filter(Boolean).length} active framework(s)`
              : "Enable frameworks above to see relevant compliance tiles"
            }
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowTileManager(!showTileManager)}
          data-testid="manage-tiles-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Manage Tiles
        </Button>
      </div>

      {/* Tile Manager */}
      {showTileManager && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Add Custom Tiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableCustomTiles.map((tileType) => (
                <Button
                  key={tileType}
                  variant="outline"
                  size="sm"
                  onClick={() => onAddCustomTile(tileType)}
                  disabled={customTiles.includes(tileType)}
                  data-testid={`add-tile-${tileType.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {tileType}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {hasActiveFrameworks ? (
          <>
            {priorityTiles}
            {customTileComponents}
          </>
        ) : (
          <>
            {renderDefaultOverviewTiles()}
            {customTileComponents}
          </>
        )}
      </div>
    </div>
  );
};

export default DynamicDashboardTiles;