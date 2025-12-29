import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Fuel, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { api, fleetsAPI } from '@/lib/api';

interface FuelEUReportProps {
  selectedFleetId?: string;
}

interface FuelEUVesselData {
  id: string;
  name: string;
  imoNumber: string;
  vesselType: string;
  flagState: string;
  grossTonnage: number;
  mainEngineType: string;
  iceClass: string;
  fleetName?: string;
  // FuelEU specific fields
  fuelEUCompliance: 'compliant' | 'non-compliant';
  ghgIntensity: number;
  targetIntensity: number;
  fuelConsumption: number;
  fuelEUPenalty: number;
  fuelEUCredits: number;
  renewableFuelPercentage: number;
  zeroEmissionFuelPercentage: number;
  fuelEUComplianceScore: number;
}

const FuelEUReport: React.FC<FuelEUReportProps> = ({ selectedFleetId }) => {
  const [selectedFleet, setSelectedFleet] = useState<string>(selectedFleetId || 'all');
  const [reportData, setReportData] = useState<FuelEUVesselData[]>([]);

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

  // Process FuelEU report data
  useEffect(() => {
    if (allVessels.length === 0) return;

    let filteredVessels = allVessels;
    if (selectedFleet !== 'all') {
      filteredVessels = allVessels.filter(vessel => vessel.fleetId === selectedFleet);
    }

    const processedData: FuelEUVesselData[] = filteredVessels.map(vessel => {
      // FuelEU compliance calculation
      const fuelEUCompliance = vessel.ghgIntensity <= vessel.targetIntensity ? 'compliant' : 'non-compliant';
      
      // FuelEU penalty calculation (simplified)
      const fuelEUPenalty = vessel.ghgIntensity > vessel.targetIntensity ? 
        Math.round((vessel.ghgIntensity - vessel.targetIntensity) * vessel.fuelConsumption * 0.1) : 0;
      
      // FuelEU credits calculation
      const fuelEUCredits = vessel.ghgIntensity <= vessel.targetIntensity ? 
        Math.round((vessel.targetIntensity - vessel.ghgIntensity) * vessel.fuelConsumption * 0.05) : 
        -fuelEUPenalty;
      
      // Renewable fuel percentage (simulated)
      const renewableFuelPercentage = Math.random() * 20; // 0-20%
      
      // Zero emission fuel percentage (simulated)
      const zeroEmissionFuelPercentage = Math.random() * 5; // 0-5%
      
      // FuelEU compliance score (0-100)
      const fuelEUComplianceScore = vessel.ghgIntensity <= vessel.targetIntensity ? 
        Math.round(100 - ((vessel.ghgIntensity / vessel.targetIntensity - 1) * 100)) : 
        Math.round(50 - ((vessel.ghgIntensity / vessel.targetIntensity - 1) * 50));

      return {
        id: vessel.id,
        name: vessel.name,
        imoNumber: vessel.imoNumber,
        vesselType: vessel.type,
        flagState: vessel.flag,
        grossTonnage: vessel.grossTonnage,
        mainEngineType: vessel.mainEngineType || 'Diesel',
        iceClass: vessel.iceClass || 'None',
        fleetName: (vessel as any).fleetName,
        fuelEUCompliance,
        ghgIntensity: vessel.ghgIntensity,
        targetIntensity: vessel.targetIntensity,
        fuelConsumption: vessel.fuelConsumption,
        fuelEUPenalty,
        fuelEUCredits,
        renewableFuelPercentage,
        zeroEmissionFuelPercentage,
        fuelEUComplianceScore,
      };
    });

    setReportData(processedData);
  }, [allVessels, selectedFleet]);

  // Calculate fleet totals
  const fleetTotals = {
    totalVessels: reportData.length,
    totalFuelConsumption: reportData.reduce((sum, vessel) => sum + vessel.fuelConsumption, 0),
    totalPenalties: reportData.reduce((sum, vessel) => sum + vessel.fuelEUPenalty, 0),
    totalCredits: reportData.reduce((sum, vessel) => sum + vessel.fuelEUCredits, 0),
    compliantVessels: reportData.filter(vessel => vessel.fuelEUCompliance === 'compliant').length,
    nonCompliantVessels: reportData.filter(vessel => vessel.fuelEUCompliance === 'non-compliant').length,
    averageComplianceScore: reportData.reduce((sum, vessel) => sum + vessel.fuelEUComplianceScore, 0) / reportData.length,
    averageRenewableFuel: reportData.reduce((sum, vessel) => sum + vessel.renewableFuelPercentage, 0) / reportData.length,
  };

  const getComplianceBadgeColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non-compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToExcel = () => {
    const headers = [
      'Vessel Name', 'IMO Number', 'Vessel Type', 'Flag State', 'Gross Tonnage',
      'Main Engine Type', 'Ice Class', 'Fleet', 'GHG Intensity (gCO2e/MJ)',
      'Target Intensity (gCO2e/MJ)', 'Fuel Consumption (MT)', 'FuelEU Compliance',
      'FuelEU Penalty (EUR)', 'FuelEU Credits', 'Compliance Score',
      'Renewable Fuel %', 'Zero Emission Fuel %'
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
        vessel.fuelEUPenalty,
        vessel.fuelEUCredits,
        vessel.fuelEUComplianceScore,
        vessel.renewableFuelPercentage.toFixed(1),
        vessel.zeroEmissionFuelPercentage.toFixed(1)
      ].join(','))
    ].join('\n');

    const summaryContent = [
      '\n',
      'FUEL EU MARITIME FLEET SUMMARY',
      `Total Vessels,${fleetTotals.totalVessels}`,
      `Total Fuel Consumption (MT),${fleetTotals.totalFuelConsumption.toFixed(2)}`,
      `Total Penalties (EUR),${fleetTotals.totalPenalties}`,
      `Total Credits,${fleetTotals.totalCredits}`,
      `Compliant Vessels,${fleetTotals.compliantVessels}`,
      `Non-Compliant Vessels,${fleetTotals.nonCompliantVessels}`,
      `Compliance Rate,${((fleetTotals.compliantVessels / fleetTotals.totalVessels) * 100).toFixed(1)}%`,
      `Average Compliance Score,${fleetTotals.averageComplianceScore.toFixed(1)}`,
      `Average Renewable Fuel %,${fleetTotals.averageRenewableFuel.toFixed(1)}%`
    ].join('\n');

    const fullContent = csvContent + summaryContent;
    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `FuelEU_Maritime_Report_${selectedFleet === 'all' ? 'All_Fleets' : (allFleets.find((f: any) => f.id === selectedFleet)?.name || 'Fleet')}_${new Date().toISOString().split('T')[0]}.csv`);
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
            <span className="ml-2">Loading FuelEU report data...</span>
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
                <Fuel className="h-6 w-6 text-blue-600" />
                FuelEU Maritime Report
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                EU Regulation on the use of renewable and low-carbon fuels in maritime transport
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
            FuelEU Fleet Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{fleetTotals.totalVessels}</div>
              <div className="text-sm text-blue-800">Total Vessels</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{fleetTotals.averageRenewableFuel.toFixed(1)}%</div>
              <div className="text-sm text-green-800">Average Renewable Fuel Uses</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{fleetTotals.totalCredits >= 0 ? '+' : ''}{fleetTotals.totalCredits}</div>
              <div className="text-sm text-orange-800">Total Compliance Balance</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{fleetTotals.totalPenalties.toLocaleString()}</div>
              <div className="text-sm text-purple-800">Total Surplus/Penalty</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vessel Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>FuelEU Vessel Compliance Report</CardTitle>
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
                  <th className="text-center p-3 font-semibold">FuelEU Status</th>
                  <th className="text-right p-3 font-semibold">Credits</th>
                  <th className="text-right p-3 font-semibold">Penalty (EUR)</th>
                  <th className="text-right p-3 font-semibold">Score</th>
                  <th className="text-right p-3 font-semibold">Renewable %</th>
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
                      <span className={vessel.fuelEUCredits >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {vessel.fuelEUCredits >= 0 ? '+' : ''}{vessel.fuelEUCredits}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-sm">
                      {vessel.fuelEUPenalty > 0 ? (
                        <span className="text-red-600">{vessel.fuelEUPenalty.toLocaleString()}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-sm">
                      <span className={vessel.fuelEUComplianceScore >= 70 ? 'text-green-600' : vessel.fuelEUComplianceScore >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                        {vessel.fuelEUComplianceScore}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-sm">{vessel.renewableFuelPercentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
              {/* Fleet Totals Row */}
              <tfoot>
                <tr className="border-t-2 bg-gray-100 font-semibold">
                  <td className="p-3" colSpan={3}>FUEL EU FLEET TOTALS</td>
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
                    <span className={fleetTotals.totalCredits >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {fleetTotals.totalCredits >= 0 ? '+' : ''}{fleetTotals.totalCredits}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-red-600">
                    {fleetTotals.totalPenalties.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {fleetTotals.averageComplianceScore.toFixed(1)}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {fleetTotals.averageRenewableFuel.toFixed(1)}%
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

export default FuelEUReport;

