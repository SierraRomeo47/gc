import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ship, Fuel, TrendingUp, AlertCircle } from "lucide-react";

export interface VesselCardProps {
  id: string;
  name: string;
  imoNumber: string;
  type: "Container Ship" | "Oil Tanker" | "Bulk Carrier" | "Gas Carrier" | "Passenger Ship" | "Offshore Vessel";
  flag: string;
  grossTonnage: number;
  complianceStatus: "compliant" | "warning" | "non-compliant";
  ghgIntensity: number;
  targetIntensity: number;
  fuelConsumption: number;
  creditBalance: number;
  onViewDetails?: (id: string) => void;
}

const VesselCard = ({
  id,
  name,
  imoNumber,
  type,
  flag,
  grossTonnage,
  complianceStatus,
  ghgIntensity,
  targetIntensity,
  fuelConsumption,
  creditBalance,
  onViewDetails
}: VesselCardProps) => {
  const getStatusBadgeVariant = () => {
    switch (complianceStatus) {
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

  const getStatusIcon = () => {
    switch (complianceStatus) {
      case "compliant":
        return <Ship className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "non-compliant":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Ship className="h-4 w-4" />;
    }
  };

  const handleViewDetails = () => {
    console.log('View details triggered for vessel:', id);
    onViewDetails?.(id);
  };

  return (
    <Card className="hover-elevate" data-testid={`vessel-card-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg" data-testid="vessel-name">{name}</CardTitle>
              <p className="text-sm text-muted-foreground">IMO: {imoNumber}</p>
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant()} data-testid="compliance-status">
            {complianceStatus.charAt(0).toUpperCase() + complianceStatus.slice(1).replace("-", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium" data-testid="vessel-type">{type}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Flag</p>
              <p className="font-medium">{flag}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gross Tonnage</p>
              <p className="font-medium">{grossTonnage.toLocaleString()} GT</p>
            </div>
            <div>
              <p className="text-muted-foreground">Credit Balance</p>
              <p className={`font-medium ${creditBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {creditBalance >= 0 ? '+' : ''}{creditBalance.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">GHG Intensity</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {ghgIntensity.toFixed(1)} / {targetIntensity.toFixed(1)} gCO2e/MJ
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Fuel Consumption</span>
              </div>
              <span className="text-sm text-muted-foreground">{fuelConsumption.toFixed(1)} MT</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={handleViewDetails}
            data-testid="button-view-details"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VesselCard;