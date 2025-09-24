import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Target, Euro, Fuel, Globe } from "lucide-react";
import { FUELEU_MARITIME, EU_ETS, IMO_NET_ZERO, UK_ETS, calculateFuelEUPenalty, calculateEUETSCost, calculateIMOGap } from "@/lib/regulatoryConstants";

interface FrameworkGraphsProps {
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

const FrameworkVisualGraphs = ({ frameworks, vesselData }: FrameworkGraphsProps) => {
  
  // FuelEU Maritime Trajectory Data using official targets
  const fuelEUTrajectoryData = [
    { year: 2025, target: FUELEU_MARITIME.targets[2025].intensity, current: vesselData.ghgIntensity, reduction: FUELEU_MARITIME.targets[2025].reduction },
    { year: 2026, target: FUELEU_MARITIME.targets[2026].intensity, current: vesselData.ghgIntensity * 0.95, reduction: FUELEU_MARITIME.targets[2026].reduction },
    { year: 2027, target: FUELEU_MARITIME.targets[2027].intensity, current: vesselData.ghgIntensity * 0.92, reduction: FUELEU_MARITIME.targets[2027].reduction },
    { year: 2028, target: FUELEU_MARITIME.targets[2028].intensity, current: vesselData.ghgIntensity * 0.89, reduction: FUELEU_MARITIME.targets[2028].reduction },
    { year: 2029, target: FUELEU_MARITIME.targets[2029].intensity, current: vesselData.ghgIntensity * 0.86, reduction: FUELEU_MARITIME.targets[2029].reduction },
    { year: 2030, target: FUELEU_MARITIME.targets[2030].intensity, current: vesselData.ghgIntensity * 0.80, reduction: FUELEU_MARITIME.targets[2030].reduction }
  ];

  // EU ETS Phase-in Schedule using official parameters
  const euETSPhaseData = [
    { year: 2024, coverage: EU_ETS.phaseIn[2024] * 100, cost: calculateEUETSCost(vesselData.fuelConsumption, vesselData.voyageType, 2024) },
    { year: 2025, coverage: EU_ETS.phaseIn[2025] * 100, cost: calculateEUETSCost(vesselData.fuelConsumption, vesselData.voyageType, 2025) },
    { year: 2026, coverage: EU_ETS.phaseIn[2026] * 100, cost: calculateEUETSCost(vesselData.fuelConsumption, vesselData.voyageType, 2026) },
    { year: 2027, coverage: EU_ETS.phaseIn[2027] * 100, cost: calculateEUETSCost(vesselData.fuelConsumption, vesselData.voyageType, 2027) },
    { year: 2028, coverage: 100, cost: vesselData.fuelConsumption * EU_ETS.emissionFactor * EU_ETS.voyageCoverage[vesselData.voyageType] * EU_ETS.allowancePrice * 1.1 },
    { year: 2029, coverage: 100, cost: vesselData.fuelConsumption * EU_ETS.emissionFactor * EU_ETS.voyageCoverage[vesselData.voyageType] * EU_ETS.allowancePrice * 1.2 },
    { year: 2030, coverage: 100, cost: vesselData.fuelConsumption * EU_ETS.emissionFactor * EU_ETS.voyageCoverage[vesselData.voyageType] * EU_ETS.allowancePrice * 1.3 }
  ];

  // IMO Net Zero Pathway using official 2023 strategy
  const imoNetZeroData = [
    { year: 2025, intensity: vesselData.ghgIntensity, target: calculateIMOGap(vesselData.ghgIntensity, 2025).targetIntensity, reduction: 4.3 },
    { year: 2027, intensity: vesselData.ghgIntensity * 0.92, target: calculateIMOGap(vesselData.ghgIntensity, 2027).targetIntensity, reduction: 8.5 },
    { year: 2030, intensity: vesselData.ghgIntensity * 0.80, target: IMO_NET_ZERO.targets[2030].intensity, reduction: IMO_NET_ZERO.targets[2030].reduction },
    { year: 2035, intensity: vesselData.ghgIntensity * 0.65, target: 59.25, reduction: 35 },
    { year: 2040, intensity: vesselData.ghgIntensity * 0.45, target: IMO_NET_ZERO.targets[2040].intensity, reduction: IMO_NET_ZERO.targets[2040].reduction },
    { year: 2045, intensity: vesselData.ghgIntensity * 0.25, target: 22.79, reduction: 75 },
    { year: 2050, intensity: vesselData.ghgIntensity * 0.10, target: IMO_NET_ZERO.targets[2050].intensity, reduction: IMO_NET_ZERO.targets[2050].reduction }
  ];

  // Cumulative Cost Breakdown by Framework using corrected calculations
  const energyUsed = vesselData.fuelConsumption * 1000 * 40.2; // Convert to MJ
  const fuelEUTarget = FUELEU_MARITIME.targets[2025].intensity;
  const imoAssessment = calculateIMOGap(vesselData.ghgIntensity, 2025);
  const ukCoverage = vesselData.voyageType === 'intra-eu' ? 0.25 : 0.15;
  
  const costBreakdownData = [
    {
      framework: "FuelEU Maritime",
      cost: calculateFuelEUPenalty(vesselData.ghgIntensity, fuelEUTarget, energyUsed),
      color: "#3B82F6"
    },
    {
      framework: "EU ETS", 
      cost: calculateEUETSCost(vesselData.fuelConsumption, vesselData.voyageType, 2025),
      color: "#8B5CF6"
    },
    {
      framework: "IMO Net Zero",
      cost: imoAssessment.gap * vesselData.fuelConsumption * 1000 * 40.2 * IMO_NET_ZERO.economicMeasures.estimatedLevy / 1000000,
      color: "#10B981"
    },
    {
      framework: "UK ETS",
      cost: vesselData.fuelConsumption * UK_ETS.emissionFactor * ukCoverage * UK_ETS.allowancePrice * UK_ETS.currencyConversion,
      color: "#F59E0B"
    }
  ].filter(item => {
    if (item.framework === "FuelEU Maritime") return frameworks.fuelEUMaritime;
    if (item.framework === "EU ETS") return frameworks.euETS;
    if (item.framework === "IMO Net Zero") return frameworks.imoNetZero;
    if (item.framework === "UK ETS") return frameworks.ukETS;
    return false;
  });

  // Monthly Compliance Trend (12 months)
  const monthlyTrendData = [
    { month: 'Jan', fuelEU: 89.1, euETS: 234000, imo: 87.5, ukETS: 45000 },
    { month: 'Feb', fuelEU: 88.8, euETS: 245000, imo: 87.2, ukETS: 47000 },
    { month: 'Mar', fuelEU: 89.4, euETS: 258000, imo: 87.8, ukETS: 49000 },
    { month: 'Apr', fuelEU: 88.9, euETS: 241000, imo: 87.1, ukETS: 46000 },
    { month: 'May', fuelEU: 89.2, euETS: 252000, imo: 87.4, ukETS: 48000 },
    { month: 'Jun', fuelEU: 88.7, euETS: 238000, imo: 86.9, ukETS: 45500 },
    { month: 'Jul', fuelEU: 89.0, euETS: 247000, imo: 87.2, ukETS: 47200 },
    { month: 'Aug', fuelEU: 88.6, euETS: 235000, imo: 86.8, ukETS: 44800 },
    { month: 'Sep', fuelEU: 89.3, euETS: 255000, imo: 87.5, ukETS: 48600 },
    { month: 'Oct', fuelEU: 88.9, euETS: 243000, imo: 87.1, ukETS: 46400 },
    { month: 'Nov', fuelEU: 89.1, euETS: 249000, imo: 87.3, ukETS: 47500 },
    { month: 'Dec', fuelEU: 88.8, euETS: 240000, imo: 87.0, ukETS: 45900 }
  ];

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

  const renderFuelEUGraphs = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="hover-elevate">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <TrendingDown className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-base">GHG Intensity Trajectory (2025-2030)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={fuelEUTrajectoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                formatter={(value, name) => [
                  `${Number(value).toFixed(1)} gCO2e/MJ`, 
                  name === 'target' ? 'FuelEU Target' : 'Projected Performance'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#3B82F6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="current" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="hover-elevate">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-green-600" />
            <CardTitle className="text-base">Reduction Targets Progress</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fuelEUTrajectoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                formatter={(value) => [`${value}%`, 'Required Reduction']}
              />
              <Bar dataKey="reduction" fill="#10B981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderEUETSGraphs = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="hover-elevate">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Euro className="h-4 w-4 text-purple-600" />
            <CardTitle className="text-base">Phase-in Cost Projection</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={euETSPhaseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                formatter={(value, name) => [
                  name === 'coverage' ? `${value}%` : `€${Number(value).toLocaleString()}`,
                  name === 'coverage' ? 'Coverage' : 'Annual Cost'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="cost" 
                stroke="#8B5CF6" 
                fill="#8B5CF6" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="hover-elevate">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-cyan-600" />
            <CardTitle className="text-base">Coverage Phase-in Schedule</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={euETSPhaseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" stroke="#666" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#666" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                formatter={(value) => [`${value}%`, 'Emissions Coverage']}
              />
              <Line 
                type="monotone" 
                dataKey="coverage" 
                stroke="#06B6D4" 
                strokeWidth={3}
                dot={{ fill: '#06B6D4', strokeWidth: 2, r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderIMOGraphs = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="hover-elevate">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-base">Net Zero Pathway (2025-2050)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={imoNetZeroData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                formatter={(value, name) => [
                  `${Number(value).toFixed(1)} gCO2e/MJ`,
                  name === 'target' ? 'IMO Target' : 'Projected Intensity'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="target" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.2}
              />
              <Line 
                type="monotone" 
                dataKey="intensity" 
                stroke="#059669" 
                strokeWidth={2}
                dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="hover-elevate">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-teal-600" />
            <CardTitle className="text-base">Reduction Milestones</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={imoNetZeroData.filter(d => [2030, 2040, 2050].includes(d.year))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                formatter={(value) => [`${value}%`, 'Reduction Target']}
              />
              <Bar dataKey="reduction" fill="#14B8A6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderCumulativeCostGraph = () => (
    <Card className="hover-elevate border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Euro className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Cumulative Compliance Cost Breakdown</CardTitle>
          </div>
          <Badge variant="secondary" data-testid="badge-total-cost">
            €{costBreakdownData.reduce((sum, item) => sum + item.cost, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} Annual
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={costBreakdownData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="cost"
                label={({ framework, cost }) => `${framework}: €${cost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              >
                {costBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`€${Number(value).toLocaleString()}`, 'Annual Cost']}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-4">
            {costBreakdownData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium">{item.framework}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold" data-testid={`text-cost-${item.framework.toLowerCase().replace(/\s+/g, '-')}`}>€{item.cost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                  <div className="text-xs text-muted-foreground">
                    {((item.cost / costBreakdownData.reduce((sum, i) => sum + i.cost, 0)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMonthlyTrendGraph = () => (
    <Card className="hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Monthly Compliance Trends</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            {frameworks.fuelEUMaritime && (
              <Line 
                type="monotone" 
                dataKey="fuelEU" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="FuelEU Maritime (gCO2e/MJ)"
                dot={{ fill: '#3B82F6', r: 3 }}
              />
            )}
            {frameworks.euETS && (
              <Line 
                type="monotone" 
                dataKey="euETS" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                name="EU ETS Cost (€)"
                dot={{ fill: '#8B5CF6', r: 3 }}
              />
            )}
            {frameworks.imoNetZero && (
              <Line 
                type="monotone" 
                dataKey="imo" 
                stroke="#10B981" 
                strokeWidth={2}
                name="IMO Intensity (gCO2e/MJ)"
                dot={{ fill: '#10B981', r: 3 }}
              />
            )}
            {frameworks.ukETS && (
              <Line 
                type="monotone" 
                dataKey="ukETS" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="UK ETS Cost (€)"
                dot={{ fill: '#F59E0B', r: 3 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  if (!Object.values(frameworks).some(Boolean)) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="framework-visual-graphs">
      {/* Cumulative Cost Overview */}
      {costBreakdownData.length > 0 && renderCumulativeCostGraph()}

      {/* Framework-specific graphs */}
      {frameworks.fuelEUMaritime && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Fuel className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-600">FuelEU Maritime Analytics</h3>
          </div>
          {renderFuelEUGraphs()}
        </div>
      )}

      {frameworks.euETS && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Euro className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-600">EU ETS Analytics</h3>
          </div>
          {renderEUETSGraphs()}
        </div>
      )}

      {frameworks.imoNetZero && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-emerald-600">IMO Net Zero Analytics</h3>
          </div>
          {renderIMOGraphs()}
        </div>
      )}

      {/* Monthly trends for all active frameworks */}
      {renderMonthlyTrendGraph()}
    </div>
  );
};

export default FrameworkVisualGraphs;