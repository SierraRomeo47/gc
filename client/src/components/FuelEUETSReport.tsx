import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { api, fleetsAPI } from '@/lib/api';

interface FuelEUETSReportProps {
  selectedFleetId?: string;
}

interface VesselReportData {
  id: string;
  name: string;
  imoNumber: string;
  vesselType: string;
  flagState: string;
  grossTonnage: number;
  mainEngineType: string;
  iceClass: string;
  complianceStatus: string;
  ghgIntensity: number;
  targetIntensity: number;
  credits: number;
  fuelConsumption: number;
  fleetName?: string;
  // Fuel EU ETS specific fields
  fuelEUCompliance: 'compliant' | 'non-compliant' | 'warning';
  etsAllowances: number;
  etsSurrendered: number;
  etsBalance: number;
  ciiRating: 'A' | 'B' | 'C' | 'D' | 'E';
  ciiScore: number;
  fuelEUPenalty: number;
}

const FuelEUETSReport: React.FC<FuelEUETSReportProps> = ({ selectedFleetId }) => {
  const [selectedFleet, setSelectedFleet] = useState<string>(selectedFleetId || 'all');
  const [reportData, setReportData] = useState<VesselReportData[]>([]);

  // Fetch vessels data
  const { data: allVessels = [], isLoading: vesselsLoading } = useQuery({
    queryKey: ['vessels', 'all'],
    queryFn: () => api.vessels.getAll(),
  });

  // Fetch fleets data
  const { data: allFleets = [], isLoading: fleetsLoading } = useQuery({
    queryKey: ['fleets', 'all'],
    queryFn: () => fleetsAPI.getAll(),
  });

  // Process report data
  useEffect(() => {
    if (allVessels.length === 0) return;

    let filteredVessels = allVessels;
    if (selectedFleet !== 'all') {
      filteredVessels = allVessels.filter(vessel => vessel.fleetId === selectedFleet);
    }

    const processedData: VesselReportData[] = filteredVessels.map(vessel => {
      // Calculate Fuel EU ETS compliance
      const fuelEUCompliance = vessel.ghgIntensity <= vessel.targetIntensity ? 'compliant' : 'non-compliant';
      
      // Calculate ETS allowances (simplified calculation)
      const etsAllowances = Math.round(vessel.fuelConsumption * 0.8); // 80% of fuel consumption
      const etsSurrendered = Math.round(vessel.fuelConsumption * 0.75); // 75% surrendered
      const etsBalance = etsAllowances - etsSurrendered;
      
      // Calculate CII rating based on GHG intensity
      let ciiRating: 'A' | 'B' | 'C' | 'D' | 'E';
      let ciiScore: number;
      if (vessel.ghgIntensity <= vessel.targetIntensity * 0.9) {
        ciiRating = 'A';
        ciiScore = 90;
      } else if (vessel.ghgIntensity <= vessel.targetIntensity * 0.95) {
        ciiRating = 'B';
        ciiScore = 80;
      } else if (vessel.ghgIntensity <= vessel.targetIntensity) {
        ciiRating = 'C';
        ciiScore = 70;
      } else if (vessel.ghgIntensity <= vessel.targetIntensity * 1.1) {
        ciiRating = 'D';
        ciiScore = 50;
      } else {
        ciiRating = 'E';
        ciiScore = 30;
      }
      
      // Calculate Fuel EU penalty
      const fuelEUPenalty = vessel.ghgIntensity > vessel.targetIntensity ? 
        Math.round((vessel.ghgIntensity - vessel.targetIntensity) * vessel.fuelConsumption * 0.1) : 0;

      return {
        id: vessel.id,
        name: vessel.name,
        imoNumber: vessel.imoNumber,
        vesselType: vessel.type,
        flagState: vessel.flag,
        grossTonnage: vessel.grossTonnage,
        mainEngineType: vessel.mainEngineType || 'Diesel',
        iceClass: vessel.iceClass || 'None',
        complianceStatus: vessel.complianceStatus,
        ghgIntensity: vessel.ghgIntensity,
        targetIntensity: vessel.targetIntensity,
        credits: (vessel as any).credits || 0,
        fuelConsumption: vessel.fuelConsumption,
        fleetName: (vessel as any).fleetName,
        fuelEUCompliance,
        etsAllowances,
        etsSurrendered,
        etsBalance,
        ciiRating,
        ciiScore,
        fuelEUPenalty,
      };
    });

    setReportData(processedData);
  }, [allVessels, selectedFleet]);

  // Calculate fleet totals
  const fleetTotals = {
    totalVessels: reportData.length,
    totalFuelConsumption: reportData.reduce((sum, vessel) => sum + vessel.fuelConsumption, 0),
    totalETSSurrendered: reportData.reduce((sum, vessel) => sum + vessel.etsSurrendered, 0),
    totalETSBalance: reportData.reduce((sum, vessel) => sum + vessel.etsBalance, 0),
    totalPenalties: reportData.reduce((sum, vessel) => sum + vessel.fuelEUPenalty, 0),
    compliantVessels: reportData.filter(vessel => vessel.fuelEUCompliance === 'compliant').length,
    nonCompliantVessels: reportData.filter(vessel => vessel.fuelEUCompliance === 'non-compliant').length,
  };

  const getComplianceBadgeColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non-compliant': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCIIBadgeColor = (rating: string) => {
    switch (rating) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'E': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToExcel = () => {
    // Create CSV content
    const headers = [
      'Vessel Name', 'IMO Number', 'Vessel Type', 'Flag State', 'Gross Tonnage',
      'Main Engine Type', 'Ice Class', 'Fleet', 'GHG Intensity (gCO2e/MJ)',
      'Target Intensity (gCO2e/MJ)', 'Fuel Consumption (MT)', 'Fuel EU Compliance',
      'ETS Allowances', 'ETS Surrendered', 'ETS Balance', 'CII Rating', 'CII Score',
      'Fuel EU Penalty (EUR)', 'Credits'
    ];

    const csvContent = [
      headers.join(','),
      ...reportData.map(vessel => [
        `"${vessel.name}"`,
        vessel.imoNumber,
        `"${vessel.vesselType}"`,
        vessel.flagState,
        vessel.grossTonnage,
        `"${vessel.mainEngineType}"`,
        `"${vessel.iceClass}"`,
        `"${vessel.fleetName || 'Unassigned'}"`,
        vessel.ghgIntensity.toFixed(2),
        vessel.targetIntensity.toFixed(2),
        vessel.fuelConsumption.toFixed(2),
        vessel.fuelEUCompliance,
        vessel.etsAllowances,
        vessel.etsSurrendered,
        vessel.etsBalance,
        vessel.ciiRating,
        vessel.ciiScore,
        vessel.fuelEUPenalty,
        vessel.credits.toFixed(2)
      ].join(','))
    ].join('\n');

    // Add fleet summary
    const summaryContent = [
      '\n',
      'FLEET SUMMARY',
      `Total Vessels,${fleetTotals.totalVessels}`,
      `Total Fuel Consumption (MT),${fleetTotals.totalFuelConsumption.toFixed(2)}`,
      `Total ETS Surrendered,${fleetTotals.totalETSSurrendered}`,
      `Total ETS Balance,${fleetTotals.totalETSBalance}`,
      `Total Penalties (EUR),${fleetTotals.totalPenalties}`,
      `Compliant Vessels,${fleetTotals.compliantVessels}`,
      `Non-Compliant Vessels,${fleetTotals.nonCompliantVessels}`,
      `Compliance Rate,${((fleetTotals.compliantVessels / fleetTotals.totalVessels) * 100).toFixed(1)}%`
    ].join('\n');

    const fullContent = csvContent + summaryContent;

    // Download file
    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Fuel_EU_ETS_CII_Report_${selectedFleet === 'all' ? 'All_Fleets' : (allFleets.find((f: any) => f.id === selectedFleet)?.name || 'Fleet')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (vesselsLoading || fleetsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading report data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                Fuel EU ETS CII Vessel Report
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive compliance report for Fuel EU Maritime, EU ETS, and CII regulations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedFleet} onValueChange={setSelectedFleet}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Fleet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fleets</SelectItem>
                  {(allFleets || []).map((fleet: any) => (
                    <SelectItem key={fleet.id} value={fleet.id}>
                      {fleet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={exportToExcel} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Fleet Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Fleet Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{fleetTotals.totalVessels}</div>
              <div className="text-sm text-blue-800">Total Vessels</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{fleetTotals.compliantVessels}</div>
              <div className="text-sm text-green-800">Compliant</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{fleetTotals.nonCompliantVessels}</div>
              <div className="text-sm text-red-800">Non-Compliant</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{fleetTotals.totalPenalties.toLocaleString()}</div>
              <div className="text-sm text-orange-800">Total Penalties (EUR)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vessel Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vessel-wise Compliance Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Vessel</th>
                  <th className="text-left p-3 font-semibold">IMO</th>
                  <th className="text-left p-3 font-semibold">Type</th>
                  <th className="text-left p-3 font-semibold">Fleet</th>
                  <th className="text-right p-3 font-semibold">GHG Intensity</th>
                  <th className="text-right p-3 font-semibold">Target</th>
                  <th className="text-right p-3 font-semibold">Fuel (MT)</th>
                  <th className="text-center p-3 font-semibold">Fuel EU</th>
                  <th className="text-right p-3 font-semibold">ETS Balance</th>
                  <th className="text-center p-3 font-semibold">CII Rating</th>
                  <th className="text-right p-3 font-semibold">Penalty (EUR)</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((vessel) => (
                  <tr key={vessel.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">{vessel.name}</div>
                      <div className="text-sm text-gray-600">{vessel.flagState}</div>
                    </td>
                    <td className="p-3 text-sm">{vessel.imoNumber}</td>
                    <td className="p-3 text-sm">{vessel.vesselType}</td>
                    <td className="p-3 text-sm">{vessel.fleetName || 'Unassigned'}</td>
                    <td className="p-3 text-right font-mono text-sm">{vessel.ghgIntensity.toFixed(1)}</td>
                    <td className="p-3 text-right font-mono text-sm">{vessel.targetIntensity.toFixed(1)}</td>
                    <td className="p-3 text-right font-mono text-sm">{vessel.fuelConsumption.toFixed(1)}</td>
                    <td className="p-3 text-center">
                      <Badge className={getComplianceBadgeColor(vessel.fuelEUCompliance)}>
                        {vessel.fuelEUCompliance === 'compliant' ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {vessel.fuelEUCompliance}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-mono text-sm">
                      <span className={vessel.etsBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {vessel.etsBalance >= 0 ? '+' : ''}{vessel.etsBalance}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge className={getCIIBadgeColor(vessel.ciiRating)}>
                        {vessel.ciiRating}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-mono text-sm">
                      {vessel.fuelEUPenalty > 0 ? (
                        <span className="text-red-600">{vessel.fuelEUPenalty.toLocaleString()}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Fleet Totals Row */}
              <tfoot>
                <tr className="border-t-2 bg-gray-100 font-semibold">
                  <td className="p-3" colSpan={3}>FLEET TOTALS</td>
                  <td className="p-3">{reportData.length} vessels</td>
                  <td className="p-3 text-right font-mono">
                    {(fleetTotals.totalFuelConsumption / fleetTotals.totalVessels).toFixed(1)}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {(reportData.reduce((sum, v) => sum + v.targetIntensity, 0) / fleetTotals.totalVessels).toFixed(1)}
                  </td>
                  <td className="p-3 text-right font-mono">{fleetTotals.totalFuelConsumption.toFixed(1)}</td>
                  <td className="p-3 text-center">
                    <Badge className="bg-blue-100 text-blue-800">
                      {((fleetTotals.compliantVessels / fleetTotals.totalVessels) * 100).toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="p-3 text-right font-mono">
                    <span className={fleetTotals.totalETSBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {fleetTotals.totalETSBalance >= 0 ? '+' : ''}{fleetTotals.totalETSBalance}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Badge className="bg-gray-100 text-gray-800">
                      AVG: {reportData.reduce((sum, v) => sum + v.ciiScore, 0) / fleetTotals.totalVessels}
                    </Badge>
                  </td>
                  <td className="p-3 text-right font-mono text-red-600">
                    {fleetTotals.totalPenalties.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FuelEUETSReport;
