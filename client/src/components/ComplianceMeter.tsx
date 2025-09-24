import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ComplianceMeterProps {
  title: string;
  currentIntensity: number;
  targetIntensity: number;
  compliancePercentage: number;
  trend: "up" | "down" | "stable";
  status: "compliant" | "warning" | "non-compliant";
  unit?: string;
}

const ComplianceMeter = ({
  title,
  currentIntensity,
  targetIntensity,
  compliancePercentage,
  trend,
  status,
  unit = "gCO2e/MJ"
}: ComplianceMeterProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "compliant":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "non-compliant":
        return "bg-destructive";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadgeVariant = () => {
    switch (status) {
      case "compliant":
        return "default";
      case "warning":
        return "secondary";
      case "non-compliant":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-destructive" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      case "stable":
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="hover-elevate" data-testid="compliance-meter">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Badge variant={getStatusBadgeVariant()} data-testid="status-badge">
            {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold" data-testid="current-intensity">
              {currentIntensity.toFixed(1)} {unit}
            </div>
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
            </div>
          </div>
          
          <Progress 
            value={compliancePercentage} 
            className="h-2"
            data-testid="compliance-progress"
          />
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Target: {targetIntensity.toFixed(1)} {unit}</span>
            <span>{compliancePercentage.toFixed(0)}% to target</span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {compliancePercentage >= 100 
              ? `${(currentIntensity - targetIntensity).toFixed(1)} ${unit} above target`
              : `${(targetIntensity - currentIntensity).toFixed(1)} ${unit} below target`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceMeter;