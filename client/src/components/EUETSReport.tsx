import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Coins, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { api, fleetsAPI } from '@/lib/api';

interface EUETSReportProps {
  selectedFleetId?: string;
}

interface EUETSVesselData {
  id: string;
  name: string;
  imoNumber: string;
  vesselType: string;
  flagState: string;
  grossTonnage: number;
  mainEngineType: string;
  iceClass: string;
  fleetName?: string;
  // EU ETS specific fields
  etsCompliance: 'compliant' | 'non-compliant';
  co2Emissions: number; // tonnes CO2
  etsAllowances: number;
  etsSurrendered: number;
  etsBalance: number;
  etsPenalty: number;
  etsComplianceScore: number;
  voyageCount: number;
  averageVoyageEmissions: number;
  etsMarketPrice: number; // EUR per tonne CO2
}

const EUETSReport: React.FC<EUETSReportProps> = ({ selectedFleetId }) => {
  const [selectedFleet, setSelectedFleet] = useState<string>(selectedFleetId || 'all');
  const [reportData, setReportData] = useState<EUETSVesselData[]>([]);

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

  // Process EU ETS report data
  useEffect(() => {
    if (allVessels.length === 0) return;

    let filteredVessels = allVessels;
    if (selectedFleet !== 'all') {
      filteredVessels = allVessels.filter(vessel => vessel.fleetId === selectedFleet);
    }

    const processedData: EUETSVesselData[] = filteredVessels.map(vessel => {
      // CO2 emissions calculation (simplified: fuel consumption * emission factor)
      const co2Emissions = vessel.fuelConsumption * 3.2; // 3.2 tonnes CO2 per tonne fuel
      
      // EU ETS allowances (simplified calculation)
      const etsAllowances = Math.round(co2Emissions * 0.8); // 80% of emissions
      const etsSurrendered = Math.round(co2Emissions * 0.75); // 75% surrendered
      const etsBalance = etsAllowances - etsSurrendered;
      
      // EU ETS compliance
      const etsCompliance = etsBalance >= 0 ? 'compliant' : 'non-compliant';
      
      // EU ETS penalty calculation
      const etsPenalty = etsBalance < 0 ? Math.abs(etsBalance) * 100 : 0; // 100 EUR per tonne CO2
      
      // EU ETS compliance score
      const etsComplianceScore = etsBalance >= 0 ? 
        Math.round(100 - ((etsBalance / etsAllowances) * 20)) : 
        Math.round(50 - (Math.abs(etsBalance) / etsAllowances) * 50);
      
      // Voyage data (simulated)
      const voyageCount = Math.floor(Math.random() * 50) + 10; // 10-60 voyages
      const averageVoyageEmissions = co2Emissions / voyageCount;
      
      // EU ETS market price (simulated)
      const etsMarketPrice = 85 + Math.random() * 30; // 85-115 EUR per tonne

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
        etsCompliance,
        co2Emissions,
        etsAllowances,
        etsSurrendered,
        etsBalance,
        etsPenalty,
        etsComplianceScore,
        voyageCount,
        averageVoyageEmissions,
        etsMarketPrice,
      };
    });

    setReportData(processedData);
  }, [allVessels, selectedFleet]);

  // Calculate fleet totals
  const fleetTotals = {
    totalVessels: reportData.length,
    totalCO2Emissions: reportData.reduce((sum, vessel) => sum + vessel.co2Emissions, 0),
    totalETSSurrendered: reportData.reduce((sum, vessel) => sum + vessel.etsSurrendered, 0),
    totalETSBalance: reportData.reduce((sum, vessel) => sum + vessel.etsBalance, 0),
    totalPenalties: reportData.reduce((sum, vessel) => sum + vessel.etsPenalty, 0),
    compliantVessels: reportData.filter(vessel => vessel.etsCompliance === 'compliant').length,
    nonCompliantVessels: reportData.filter(vessel => vessel.etsCompliance === 'non-compliant').length,
    averageComplianceScore: reportData.reduce((sum, vessel) => sum + vessel.etsComplianceScore, 0) / reportData.length,
    totalVoyages: reportData.reduce((sum, vessel) => sum + vessel.voyageCount, 0),
    averageETSMarketPrice: reportData.reduce((sum, vessel) => sum + vessel.etsMarketPrice, 0) / reportData.length,
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
      'Main Engine Type', 'Ice Class', 'Fleet', 'CO2 Emissions (tonnes)',
      'ETS Allowances', 'ETS Surrendered', 'ETS Balance', 'EU ETS Compliance',
      'ETS Penalty (EUR)', 'Compliance Score', 'Voyage Count', 'Avg Voyage Emissions',
      'ETS Market Price (EUR/tonne)'
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
        vessel.co2Emissions.toFixed(2),
        vessel.etsAllowances,
        vessel.etsSurrendered,
        vessel.etsBalance,
        vessel.etsCompliance,
        vessel.etsPenalty,
        vessel.etsComplianceScore,
        vessel.voyageCount,
        vessel.averageVoyageEmissions.toFixed(2),
        vessel.etsMarketPrice.toFixed(2)
      ].join(','))
    ].join('\n');

    const summaryContent = [
      '\n',
      'EU ETS MARITIME FLEET SUMMARY',
      `Total Vessels,${fleetTotals.totalVessels}`,
      `Total CO2 Emissions (tonnes),${fleetTotals.totalCO2Emissions.toFixed(2)}`,
      `Total ETS Surrendered,${fleetTotals.totalETSSurrendered}`,
      `Total ETS Balance,${fleetTotals.totalETSBalance}`,
      `Total Penalties (EUR),${fleetTotals.totalPenalties}`,
      `Compliant Vessels,${fleetTotals.compliantVessels}`,
      `Non-Compliant Vessels,${fleetTotals.nonCompliantVessels}`,
      `Compliance Rate,${((fleetTotals.compliantVessels / fleetTotals.totalVessels) * 100).toFixed(1)}%`,
      `Average Compliance Score,${fleetTotals.averageComplianceScore.toFixed(1)}`,
      `Total Voyages,${fleetTotals.totalVoyages}`,
      `Average ETS Market Price (EUR/tonne),${fleetTotals.averageETSMarketPrice.toFixed(2)}`
    ].join('\n');

    const fullContent = csvContent + summaryContent;
    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `EU_ETS_Maritime_Report_${selectedFleet === 'all' ? 'All_Fleets' : (allFleets.find((f: any) => f.id === selectedFleet)?.name || 'Fleet')}_${new Date().toISOString().split('T')[0]}.csv`);
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
            <span className="ml-2">Loading EU ETS report data...</span>
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
                <Coins className="h-6 w-6 text-green-600" />
                EU ETS Maritime Report
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                EU Emissions Trading System for maritime transport - CO2 allowances and compliance
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
            EU ETS Fleet Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{fleetTotals.totalVessels}</div>
              <div className="text-sm text-blue-800">Total Vessels</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{fleetTotals.totalETSSurrendered}</div>
              <div className="text-sm text-green-800">Total EUA to be surrendered</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{fleetTotals.totalETSBalance >= 0 ? '+' : ''}{fleetTotals.totalETSBalance}</div>
              <div className="text-sm text-orange-800">ETS Balance total</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{fleetTotals.averageETSMarketPrice.toFixed(0)}</div>
              <div className="text-sm text-purple-800">Average EUA Price</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vessel Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>EU ETS Vessel Compliance Report</CardTitle>
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
                  <th className="text-right p-3 font-semibold">CO2 Emissions</th>
                  <th className="text-right p-3 font-semibold">ETS Allowances</th>
                  <th className="text-right p-3 font-semibold">ETS Surrendered</th>
                  <th className="text-right p-3 font-semibold">ETS Balance</th>
                  <th className="text-center p-3 font-semibold">ETS Status</th>
                  <th className="text-right p-3 font-semibold">Penalty (EUR)</th>
                  <th className="text-right p-3 font-semibold">Score</th>
                  <th className="text-right p-3 font-semibold">Voyages</th>
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
                    <td className="p-3 text-right font-mono text-sm">{vessel.co2Emissions.toFixed(1)}</td>
                    <td className="p-3 text-right font-mono text-sm">{vessel.etsAllowances}</td>
                    <td className="p-3 text-right font-mono text-sm">{vessel.etsSurrendered}</td>
                    <td className="p-3 text-right font-mono text-sm">
                      <span className={vessel.etsBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {vessel.etsBalance >= 0 ? '+' : ''}{vessel.etsBalance}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge className={getComplianceBadgeColor(vessel.etsCompliance)}>
                        {vessel.etsCompliance === 'compliant' ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {vessel.etsCompliance}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-mono text-sm">
                      {vessel.etsPenalty > 0 ? (
                        <span className="text-red-600">{vessel.etsPenalty.toLocaleString()}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono text-sm">
                      <span className={vessel.etsComplianceScore >= 70 ? 'text-green-600' : vessel.etsComplianceScore >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                        {vessel.etsComplianceScore}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-sm">{vessel.voyageCount}</td>
                  </tr>
                ))}
              </tbody>
              {/* Fleet Totals Row */}
              <tfoot>
                <tr className="border-t-2 bg-gray-100 font-semibold">
                  <td className="p-3" colSpan={3}>EU ETS FLEET TOTALS</td>
                  <td className="p-3">{reportData.length} vessels</td>
                  <td className="p-3 text-right font-mono">{fleetTotals.totalCO2Emissions.toFixed(1)}</td>
                  <td className="p-3 text-right font-mono">{fleetTotals.totalETSSurrendered}</td>
                  <td className="p-3 text-right font-mono">{fleetTotals.totalETSSurrendered}</td>
                  <td className="p-3 text-right font-mono">
                    <span className={fleetTotals.totalETSBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {fleetTotals.totalETSBalance >= 0 ? '+' : ''}{fleetTotals.totalETSBalance}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Badge className="bg-blue-100 text-blue-800">
                      {((fleetTotals.compliantVessels / fleetTotals.totalVessels) * 100).toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="p-3 text-right font-mono text-red-600">
                    {fleetTotals.totalPenalties.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {fleetTotals.averageComplianceScore.toFixed(1)}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {fleetTotals.totalVoyages}
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

export default EUETSReport;

