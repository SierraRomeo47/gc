import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Lightbulb,
  ArrowRight,
  Clock,
  DollarSign,
  BarChart3,
  Settings
} from "lucide-react";
import { FUELEU_MARITIME, EU_ETS, IMO_NET_ZERO, UK_ETS, calculateFuelEUPenalty, calculateEUETSCost, calculateIMOGap } from "@/lib/regulatoryConstants";
import FrameworkSpecificTiles from "./FrameworkSpecificTiles";
import FrameworkVisualGraphs from "./FrameworkVisualGraphs";

interface EnhancedComplianceProps {
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
  customTiles: string[];
  onAddCustomTile: (tileType: string) => void;
  onRemoveCustomTile: (tileId: string) => void;
}

const EnhancedCompliancePage = ({ 
  frameworks, 
  vesselData, 
  customTiles, 
  onAddCustomTile, 
  onRemoveCustomTile 
}: EnhancedComplianceProps) => {
  const [showTileManager, setShowTileManager] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'detailed'>('overview');

  // Calculate compliance status and recommendations for each framework
  const getComplianceAnalysis = () => {
    const analysis = {
      fuelEUMaritime: {
        status: 'unknown' as 'compliant' | 'warning' | 'critical' | 'unknown',
        gap: 0,
        cost: 0,
        recommendations: [] as string[],
        nextSteps: [] as string[],
        timeToDeadline: 0
      },
      euETS: {
        status: 'unknown' as 'compliant' | 'warning' | 'critical' | 'unknown',
        gap: 0,
        cost: 0,
        recommendations: [] as string[],
        nextSteps: [] as string[],
        timeToDeadline: 0
      },
      imoNetZero: {
        status: 'unknown' as 'compliant' | 'warning' | 'critical' | 'unknown',
        gap: 0,
        cost: 0,
        recommendations: [] as string[],
        nextSteps: [] as string[],
        timeToDeadline: 0
      },
      ukETS: {
        status: 'unknown' as 'compliant' | 'warning' | 'critical' | 'unknown',
        gap: 0,
        cost: 0,
        recommendations: [] as string[],
        nextSteps: [] as string[],
        timeToDeadline: 0
      }
    };

    if (frameworks.fuelEUMaritime) {
      const target = FUELEU_MARITIME.targets[2025].intensity;
      const gap = Math.max(0, vesselData.ghgIntensity - target);
      const energyUsed = vesselData.fuelConsumption * 1000 * 40.2;
      const penalty = calculateFuelEUPenalty(vesselData.ghgIntensity, target, energyUsed);
      
      analysis.fuelEUMaritime = {
        status: gap === 0 ? 'compliant' : gap > 5 ? 'critical' : 'warning',
        gap,
        cost: penalty,
        recommendations: gap > 0 ? [
          "Switch to Marine Gas Oil (MGO) for improved efficiency",
          "Investigate bio-fuel blending opportunities",
          "Optimize vessel speed and routing",
          "Consider participation in pooling mechanism"
        ] : [
          "Maintain current operational efficiency",
          "Monitor fuel quality and consumption",
          "Consider banking excess credits"
        ],
        nextSteps: gap > 0 ? [
          "Review fuel procurement strategy",
          "Assess alternative fuel infrastructure",
          "Calculate pooling/banking opportunities",
          "Prepare emissions monitoring plan"
        ] : [
          "Continue compliance monitoring",
          "Evaluate credit trading opportunities"
        ],
        timeToDeadline: 128 // days to next deadline
      };
    }

    if (frameworks.euETS) {
      const cost = calculateEUETSCost(vesselData.fuelConsumption, vesselData.voyageType, 2025);
      
      analysis.euETS = {
        status: cost > 300000 ? 'critical' : cost > 150000 ? 'warning' : 'compliant',
        gap: 0,
        cost,
        recommendations: cost > 200000 ? [
          "Purchase EUAs in advance to hedge price risk",
          "Optimize route planning to reduce EU coverage",
          "Consider fuel switching for EU voyages",
          "Monitor MOHA balance closely"
        ] : [
          "Monitor EUA price trends",
          "Maintain adequate MOHA balance",
          "Plan for full phase-in by 2027"
        ],
        nextSteps: [
          "Set up THETIS-MRV monitoring",
          "Establish EUA procurement strategy",
          "Review voyage reporting procedures",
          "Calculate 2026 phase-in impact"
        ],
        timeToDeadline: 249 // days to surrender deadline
      };
    }

    if (frameworks.imoNetZero) {
      const assessment = calculateIMOGap(vesselData.ghgIntensity, 2025);
      
      analysis.imoNetZero = {
        status: assessment.isCompliant ? 'compliant' : 'warning',
        gap: assessment.gap,
        cost: assessment.gap * vesselData.fuelConsumption * 1000 * 40.2 * IMO_NET_ZERO.economicMeasures.estimatedLevy / 1000000,
        recommendations: !assessment.isCompliant ? [
          "Develop long-term decarbonization strategy",
          "Assess green ammonia/hydrogen feasibility",
          "Implement energy efficiency measures",
          "Consider shore power connections"
        ] : [
          "Continue trajectory monitoring",
          "Prepare for 2030 milestone review",
          "Evaluate emerging technologies"
        ],
        nextSteps: [
          "Create technology roadmap to 2030",
          "Assess port infrastructure availability",
          "Evaluate economic measures impact",
          "Monitor IMO regulatory developments"
        ],
        timeToDeadline: 1825 // days to 2030 target
      };
    }

    if (frameworks.ukETS) {
      const ukCoverage = vesselData.voyageType === 'intra-eu' ? 0.25 : 0.15;
      const cost = vesselData.fuelConsumption * UK_ETS.emissionFactor * ukCoverage * UK_ETS.allowancePrice * UK_ETS.currencyConversion;
      
      analysis.ukETS = {
        status: cost > 100000 ? 'warning' : 'compliant',
        gap: 0,
        cost,
        recommendations: cost > 50000 ? [
          "Monitor GBP/EUR exchange rates",
          "Optimize UK port call schedules",
          "Consider UK-specific fuel strategies",
          "Track UK ETS price developments"
        ] : [
          "Monitor UK regulatory updates",
          "Maintain UK operations efficiency"
        ],
        nextSteps: [
          "Review UK port operations",
          "Monitor UK ETS policy changes",
          "Assess post-Brexit implications",
          "Plan for potential coverage expansion"
        ],
        timeToDeadline: 365 // placeholder for UK deadlines
      };
    }

    return analysis;
  };

  const analysis = getComplianceAnalysis();

  // Render actionable recommendations
  const renderRecommendations = (frameworkKey: keyof typeof analysis) => {
    const frameworkAnalysis = analysis[frameworkKey];
    if (!frameworks[frameworkKey] || frameworkAnalysis.status === 'unknown') return null;

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'compliant': return 'text-green-600';
        case 'warning': return 'text-yellow-600';
        case 'critical': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'compliant': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
        case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
        case 'critical': return <AlertCircle className="h-5 w-5 text-red-600" />;
        default: return <Ship className="h-5 w-5 text-gray-600" />;
      }
    };

    const frameworkNames = {
      fuelEUMaritime: 'FuelEU Maritime',
      euETS: 'EU ETS',
      imoNetZero: 'IMO Net Zero',
      ukETS: 'UK ETS'
    };

    return (
      <Card key={frameworkKey} className="hover-elevate">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(frameworkAnalysis.status)}
              <CardTitle className="text-lg">{frameworkNames[frameworkKey]}</CardTitle>
            </div>
            <div className="text-right">
              <Badge variant={frameworkAnalysis.status === 'compliant' ? 'default' : 
                              frameworkAnalysis.status === 'warning' ? 'secondary' : 'destructive'}>
                {frameworkAnalysis.status.charAt(0).toUpperCase() + frameworkAnalysis.status.slice(1)}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">
                {frameworkAnalysis.timeToDeadline > 0 && 
                  `${frameworkAnalysis.timeToDeadline} days to next milestone`
                }
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status Summary */}
            <div className="grid grid-cols-2 gap-4">
              {frameworkAnalysis.gap > 0 && (
                <div className="text-center">
                  <div className={`text-xl font-bold ${getStatusColor(frameworkAnalysis.status)}`}>
                    {frameworkAnalysis.gap.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Compliance Gap</div>
                </div>
              )}
              {frameworkAnalysis.cost > 0 && (
                <div className="text-center">
                  <div className={`text-xl font-bold ${getStatusColor(frameworkAnalysis.status)}`}>
                    €{frameworkAnalysis.cost.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Annual Cost/Penalty</div>
                </div>
              )}
            </div>

            {/* Recommendations */}
            {frameworkAnalysis.recommendations.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Recommendations</span>
                </div>
                <ul className="space-y-1">
                  {frameworkAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                      <ArrowRight className="h-3 w-3 mt-1 text-blue-600 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            {frameworkAnalysis.nextSteps.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Next Steps</span>
                </div>
                <ul className="space-y-1">
                  {frameworkAnalysis.nextSteps.slice(0, 3).map((step, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center mt-0.5">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render custom compliance tiles
  const renderCustomComplianceTiles = () => {
    return customTiles.map((tileType, index) => (
      <Card key={`compliance-custom-${index}`} className="hover-elevate border border-gray-400">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-base">{tileType}</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onRemoveCustomTile(`compliance-custom-${index}`)}
              data-testid={`remove-compliance-tile-${index}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Custom compliance analysis for {tileType}</div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  const availableComplianceTiles = [
    "Regulatory Timeline Tracker",
    "Cost Impact Analysis",
    "Technology Assessment",
    "Port Compliance Status",
    "Credit Trading Monitor",
    "Operational Efficiency Metrics"
  ];

  const hasActiveFrameworks = Object.values(frameworks).some(Boolean);

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Multi-Framework Compliance</h2>
          <p className="text-muted-foreground">
            {hasActiveFrameworks 
              ? `Analyzing compliance across ${Object.values(frameworks).filter(Boolean).length} active framework(s)`
              : "Enable frameworks on the Dashboard to view compliance analysis"
            }
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={activeView === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveView('overview')}
            data-testid="view-overview"
          >
            Overview
          </Button>
          <Button 
            variant={activeView === 'detailed' ? 'default' : 'outline'}
            onClick={() => setActiveView('detailed')}
            data-testid="view-detailed"
          >
            Detailed
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowTileManager(!showTileManager)}
            data-testid="manage-compliance-tiles"
          >
            <Plus className="h-4 w-4 mr-2" />
            Manage Tiles
          </Button>
        </div>
      </div>

      {/* Tile Manager for Compliance */}
      {showTileManager && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Add Custom Compliance Tiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableComplianceTiles.map((tileType) => (
                <Button
                  key={tileType}
                  variant="outline"
                  size="sm"
                  onClick={() => onAddCustomTile(tileType)}
                  disabled={customTiles.includes(tileType)}
                  data-testid={`add-compliance-tile-${tileType.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {tileType}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {hasActiveFrameworks ? (
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Compliance Analysis</TabsTrigger>
            <TabsTrigger value="frameworks">Framework Details</TabsTrigger>
            <TabsTrigger value="insights">Visual Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="space-y-4">
            {activeView === 'overview' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.keys(frameworks).map((key) => 
                  renderRecommendations(key as keyof typeof frameworks)
                ).filter(Boolean)}
                {renderCustomComplianceTiles()}
              </div>
            ) : (
              <div className="space-y-6">
                <FrameworkSpecificTiles 
                  frameworks={frameworks}
                  vesselData={vesselData}
                />
                {renderCustomComplianceTiles()}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="frameworks" className="space-y-4">
            <FrameworkSpecificTiles 
              frameworks={frameworks}
              vesselData={vesselData}
            />
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-4">
            <FrameworkVisualGraphs 
              frameworks={frameworks}
              vesselData={vesselData}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Ship className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Active Compliance Frameworks</h3>
            <p className="text-muted-foreground mb-6">
              Enable compliance frameworks on the Dashboard to see detailed compliance analysis, 
              recommendations, and actionable insights for your fleet.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="p-4 border rounded-lg hover-elevate">
                <Fuel className="h-8 w-8 text-blue-600 mb-2" />
                <h4 className="font-medium text-sm">FuelEU Maritime</h4>
                <p className="text-xs text-muted-foreground">GHG intensity tracking</p>
              </div>
              <div className="p-4 border rounded-lg hover-elevate">
                <Euro className="h-8 w-8 text-purple-600 mb-2" />
                <h4 className="font-medium text-sm">EU ETS</h4>
                <p className="text-xs text-muted-foreground">Emissions trading</p>
              </div>
              <div className="p-4 border rounded-lg hover-elevate">
                <Target className="h-8 w-8 text-green-600 mb-2" />
                <h4 className="font-medium text-sm">IMO Net Zero</h4>
                <p className="text-xs text-muted-foreground">Decarbonization targets</p>
              </div>
              <div className="p-4 border rounded-lg hover-elevate">
                <Globe className="h-8 w-8 text-rose-600 mb-2" />
                <h4 className="font-medium text-sm">UK ETS</h4>
                <p className="text-xs text-muted-foreground">UK emissions system</p>
              </div>
            </div>
            {renderCustomComplianceTiles()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedCompliancePage;