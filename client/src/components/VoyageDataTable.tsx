import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Filter, Download } from "lucide-react";
import { useState } from "react";

export interface VoyageData {
  id: string;
  vessel: string;
  departure: string;
  arrival: string;
  distance: number;
  fuelType: string;
  fuelConsumed: number;
  ghgIntensity: number;
  complianceStatus: "compliant" | "warning" | "non-compliant";
  voyageType: "intra-eu" | "extra-eu";
  date: string;
}

interface VoyageDataTableProps {
  data: VoyageData[];
  title: string;
  onExport?: () => void;
  onFilter?: () => void;
}

const VoyageDataTable = ({ data, title, onExport, onFilter }: VoyageDataTableProps) => {
  const [sortField, setSortField] = useState<keyof VoyageData | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: keyof VoyageData) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    console.log('Sort triggered for field:', field, 'direction:', sortDirection);
  };

  const handleExport = () => {
    console.log('Export triggered');
    onExport?.();
  };

  const handleFilter = () => {
    console.log('Filter triggered');
    onFilter?.();
  };

  const getComplianceStatusBadge = (status: string) => {
    switch (status) {
      case "compliant":
        return <Badge variant="default" className="text-xs">Compliant</Badge>;
      case "warning":
        return <Badge variant="secondary" className="text-xs">Warning</Badge>;
      case "non-compliant":
        return <Badge variant="destructive" className="text-xs">Non-Compliant</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Unknown</Badge>;
    }
  };

  const getVoyageTypeBadge = (type: string) => {
    return type === "intra-eu" 
      ? <Badge variant="outline" className="text-xs">Intra-EU</Badge>
      : <Badge variant="outline" className="text-xs">Extra-EU</Badge>;
  };

  const sortedData = sortField 
    ? [...data].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        const modifier = sortDirection === "asc" ? 1 : -1;
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * modifier;
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * modifier;
        }
        return 0;
      })
    : data;

  return (
    <Card className="hover-elevate" data-testid="voyage-data-table">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleFilter}
              data-testid="button-filter"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExport}
              data-testid="button-export"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSort('vessel')}
                    data-testid="sort-vessel"
                  >
                    Vessel
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Route</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSort('distance')}
                    data-testid="sort-distance"
                  >
                    Distance (nm)
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Fuel</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSort('fuelConsumed')}
                    data-testid="sort-fuel-consumed"
                  >
                    Fuel (MT)
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSort('ghgIntensity')}
                    data-testid="sort-ghg-intensity"
                  >
                    GHG Intensity
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((voyage) => (
                <TableRow key={voyage.id} data-testid={`voyage-row-${voyage.id}`}>
                  <TableCell className="font-medium">{voyage.vessel}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{voyage.departure}</div>
                      <div className="text-muted-foreground">to {voyage.arrival}</div>
                    </div>
                  </TableCell>
                  <TableCell>{voyage.distance.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{voyage.fuelType}</div>
                      <div className="text-muted-foreground">{voyage.fuelConsumed.toFixed(1)} MT</div>
                    </div>
                  </TableCell>
                  <TableCell>{voyage.fuelConsumed.toFixed(1)}</TableCell>
                  <TableCell>
                    <span className="font-medium">{voyage.ghgIntensity.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm ml-1">gCO2e/MJ</span>
                  </TableCell>
                  <TableCell>{getVoyageTypeBadge(voyage.voyageType)}</TableCell>
                  <TableCell>{getComplianceStatusBadge(voyage.complianceStatus)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{voyage.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {sortedData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No voyage data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VoyageDataTable;