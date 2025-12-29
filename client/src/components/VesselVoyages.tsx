import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ship, MapPin, Fuel, Calendar, TrendingUp } from "lucide-react";
import type { VesselViewModel } from "@shared/viewModels";

interface VesselVoyagesProps {
  vessel: VesselViewModel;
}

// Mock voyage data for the selected vessel
const getVesselVoyages = (vessel: VesselViewModel) => {
  const baseVoyages = [
    {
      id: "1",
      voyageNumber: `${vessel.name.substring(0, 3).toUpperCase()}-2025-001`,
      departure: "Rotterdam",
      arrival: "Hamburg",
      distance: 285,
      fuelType: vessel.mainEngineType?.includes('LNG') ? 'LNG' : 'MGO',
      fuelConsumed: (vessel.fuelConsumption * 0.1).toFixed(1),
      ghgIntensity: vessel.ghgIntensity,
      complianceStatus: vessel.complianceStatus,
      voyageType: vessel.voyageType || 'intra-eu',
      date: "2025-01-15"
    },
    {
      id: "2",
      voyageNumber: `${vessel.name.substring(0, 3).toUpperCase()}-2025-002`,
      departure: "Hamburg",
      arrival: "London Gateway",
      distance: 400,
      fuelType: vessel.mainEngineType?.includes('LNG') ? 'LNG' : 'MGO',
      fuelConsumed: (vessel.fuelConsumption * 0.12).toFixed(1),
      ghgIntensity: vessel.ghgIntensity,
      complianceStatus: vessel.complianceStatus,
      voyageType: vessel.voyageType || 'intra-eu',
      date: "2025-01-18"
    },
    {
      id: "3",
      voyageNumber: `${vessel.name.substring(0, 3).toUpperCase()}-2025-003`,
      departure: "London Gateway",
      arrival: "Le Havre",
      distance: 180,
      fuelType: vessel.mainEngineType?.includes('LNG') ? 'LNG' : 'MGO',
      fuelConsumed: (vessel.fuelConsumption * 0.08).toFixed(1),
      ghgIntensity: vessel.ghgIntensity,
      complianceStatus: vessel.complianceStatus,
      voyageType: vessel.voyageType || 'intra-eu',
      date: "2025-01-21"
    }
  ];

  // Add special voyages for OMR vessels
  if (vessel.voyageType === 'omr') {
    baseVoyages.push({
      id: "4",
      voyageNumber: `${vessel.name.substring(0, 3).toUpperCase()}-2025-004`,
      departure: "Le Havre",
      arrival: vessel.name.includes('Canary') ? 'Las Palmas' : 
              vessel.name.includes('Azores') ? 'Ponta Delgada' :
              vessel.name.includes('Madeira') ? 'Funchal' :
              vessel.name.includes('Martinique') ? 'Fort-de-France' : 'Réunion',
      distance: vessel.name.includes('Canary') ? 850 :
                vessel.name.includes('Azores') ? 520 :
                vessel.name.includes('Madeira') ? 520 :
                vessel.name.includes('Martinique') ? 4200 : 5800,
      fuelType: vessel.mainEngineType?.includes('LNG') ? 'LNG' : 'MGO',
      fuelConsumed: (vessel.fuelConsumption * 0.25).toFixed(1),
      ghgIntensity: vessel.ghgIntensity,
      complianceStatus: vessel.complianceStatus,
      voyageType: 'omr',
      date: "2025-01-25"
    });
  }

  return baseVoyages;
};

const VesselVoyages: React.FC<VesselVoyagesProps> = ({ vessel }) => {
  const voyages = getVesselVoyages(vessel);

  const getComplianceBadgeVariant = (status: string) => {
    switch (status) {
      case 'compliant': return 'default';
      case 'warning': return 'secondary';
      case 'non-compliant': return 'destructive';
      default: return 'outline';
    }
  };

  const getVoyageTypeBadge = (type: string) => {
    switch (type) {
      case 'omr': return <Badge variant="outline" className="bg-blue-50 text-blue-700">OMR Route</Badge>;
      case 'intra-eu': return <Badge variant="outline" className="bg-green-50 text-green-700">Intra-EU</Badge>;
      case 'extra-eu': return <Badge variant="outline" className="bg-orange-50 text-orange-700">Extra-EU</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ship className="h-5 w-5" />
          Recent Voyages - {vessel.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Voyage Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{voyages.length}</div>
              <div className="text-sm text-muted-foreground">Total Voyages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {voyages.reduce((sum, v) => sum + parseFloat(v.fuelConsumed), 0).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Total Fuel (MT)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {voyages.reduce((sum, v) => sum + v.distance, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Distance (nm)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(voyages.reduce((sum, v) => sum + v.distance, 0) / voyages.length).toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Distance (nm)</div>
            </div>
          </div>

          {/* Voyages Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voyage</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Fuel</TableHead>
                <TableHead>GHG Intensity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(voyages || []).map((voyage) => (
                <TableRow key={voyage.id}>
                  <TableCell className="font-mono text-sm">
                    {voyage.voyageNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {voyage.departure} → {voyage.arrival}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">{voyage.distance} nm</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Fuel className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{voyage.fuelConsumed} MT</span>
                      <Badge variant="outline" className="text-xs">{voyage.fuelType}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">{voyage.ghgIntensity} gCO2e/MJ</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={getComplianceBadgeVariant(voyage.complianceStatus)}>
                        {voyage.complianceStatus}
                      </Badge>
                      {getVoyageTypeBadge(voyage.voyageType)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{voyage.date}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default VesselVoyages;



