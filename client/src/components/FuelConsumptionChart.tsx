import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface FuelDataPoint {
  month: string;
  ghgIntensity: number;
  target: number;
  fuelConsumption: number;
  complianceCredits: number;
}

interface FuelConsumptionChartProps {
  data: FuelDataPoint[];
  title: string;
  vesselName?: string;
}

const FuelConsumptionChart = ({ data, title, vesselName }: FuelConsumptionChartProps) => {
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  const toggleChartType = () => {
    setChartType(prev => prev === "line" ? "bar" : "line");
    console.log('Chart type toggled to:', chartType === "line" ? "bar" : "line");
  };

  const formatTooltip = (value: any, name: string) => {
    if (name === "ghgIntensity" || name === "target") {
      return [`${value} gCO2e/MJ`, name === "ghgIntensity" ? "GHG Intensity" : "Target"];
    }
    if (name === "fuelConsumption") {
      return [`${value} MT`, "Fuel Consumption"];
    }
    if (name === "complianceCredits") {
      return [`${value}`, "Compliance Credits"];
    }
    return [value, name];
  };

  return (
    <Card className="hover-elevate" data-testid="fuel-consumption-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <CardTitle>{title}</CardTitle>
            {vesselName && (
              <span className="text-sm text-muted-foreground">- {vesselName}</span>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleChartType}
            data-testid="button-toggle-chart"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            {chartType === "line" ? "Bar" : "Line"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  formatter={formatTooltip}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ghgIntensity" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  name="GHG Intensity"
                  dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                  dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="complianceCredits" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  name="Compliance Credits"
                  dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  formatter={formatTooltip}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="fuelConsumption" 
                  fill="hsl(var(--chart-1))" 
                  name="Fuel Consumption (MT)"
                />
                <Bar 
                  dataKey="ghgIntensity" 
                  fill="hsl(var(--chart-2))" 
                  name="GHG Intensity"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default FuelConsumptionChart;