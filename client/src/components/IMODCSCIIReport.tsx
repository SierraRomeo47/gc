import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Ship, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { api, fleetsAPI } from '@/lib/api';

interface IMODCSCIIReportProps {
  selectedFleetId?: string;
}

interface IMODCSCIIVesselData {
  id: string;
  name: string;
  imoNumber: string;
  vesselType: string;
  flagState: string;
  grossTonnage: number;
  mainEngineType: string;
  iceClass: string;
  fleetName?: string;
  // IMO DCS CII specific fields
  ciiRating: 'A' | 'B' | 'C' | 'D' | 'E';
  ciiScore: number;
  ciiCompliance: 'compliant' | 'non-compliant';
  attainedCII: number; // gCO2/t·nm
  requiredCII: number; // gCO2/t·nm
  distanceTraveled: number; // nautical miles
  cargoCarried: number; // tonnes
  transportWork: number; // tonne·nm
  fuelConsumption: number; // tonnes
  co2Emissions: number; // tonnes CO2
  ciiImprovementRate: number; // % improvement required
  ciiComplianceScore: number;
  voyageCount: number;
  averageVoyageDistance: number;
}

const IMODCSCIIReport: React.FC<IMODCSCIIReportProps> = ({ selectedFleetId }) => {
  const [selectedFleet, setSelectedFleet] = useState<string>(selectedFleetId || 'all');
  const [reportData, setReportData] = useState<IMODCSCIIVesselData[]>([]);

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

  // Process IMO DCS CII report data
  useEffect(() => {
    if (allVessels.length === 0) return;

    let filteredVessels = allVessels;
    if (selectedFleet !== 'all') {
      filteredVessels = allVessels.filter(vessel => vessel.fleetId === selectedFleet);
    }

    const processedData: IMODCSCIIVesselData[] = filteredVessels.map(vessel => {
      // Simulate voyage data
      const voyageCount = Math.floor(Math.random() * 50) + 10; // 10-60 voyages
      const distanceTraveled = Math.random() * 50000 + 10000; // 10,000-60,000 nm
      const cargoCarried = (vessel.grossTonnage || 0) * (0.5 + Math.random() * 0.5); // 50-100% of GT
      const transportWork = cargoCarried * distanceTraveled;
      
      // CO2 emissions calculation
      const co2Emissions = (vessel.fuelConsumption || 0) * 3.2; // 3.2 tonnes CO2 per tonne fuel
      
      // Attained CII calculation (gCO2/t·nm)
      const attainedCII = (co2Emissions * 1000000) / transportWork; // Convert to gCO2/t·nm
      
      // Required CII (simplified calculation based on vessel type and size)
      let requiredCII: number;
      const vesselType = vessel.type?.toLowerCase() || 'general cargo';
      const grossTonnage = vessel.grossTonnage || 50000; // Default to 50,000 GT
      switch (vesselType) {
        case 'container ship':
          requiredCII = 8.0 + (grossTonnage / 100000) * 2.0; // 8-10 gCO2/t·nm
          break;
        case 'tanker':
          requiredCII = 7.5 + (grossTonnage / 100000) * 1.5; // 7.5-9 gCO2/t·nm
          break;
        case 'bulk carrier':
          requiredCII = 6.5 + (grossTonnage / 100000) * 1.0; // 6.5-7.5 gCO2/t·nm
          break;
        case 'general cargo':
          requiredCII = 7.0 + (grossTonnage / 100000) * 1.5; // 7-8.5 gCO2/t·nm
          break;
        case 'ro-ro cargo':
          requiredCII = 8.5 + (grossTonnage / 100000) * 2.0; // 8.5-10.5 gCO2/t·nm
          break;
        case 'passenger ship':
          requiredCII = 9.0 + (grossTonnage / 100000) * 2.5; // 9-11.5 gCO2/t·nm
          break;
        default:
          requiredCII = 7.5 + (grossTonnage / 100000) * 1.5; // Default
      }
      
      // CII rating calculation
      let ciiRating: 'A' | 'B' | 'C' | 'D' | 'E';
      let ciiScore: number;
      if (attainedCII <= requiredCII * 0.9) {
        ciiRating = 'A';
        ciiScore = 90;
      } else if (attainedCII <= requiredCII * 0.95) {
        ciiRating = 'B';
        ciiScore = 80;
      } else if (attainedCII <= requiredCII) {
        ciiRating = 'C';
        ciiScore = 70;
      } else if (attainedCII <= requiredCII * 1.1) {
        ciiRating = 'D';
        ciiScore = 50;
      } else {
        ciiRating = 'E';
        ciiScore = 30;
      }
      
      // CII compliance
      const ciiCompliance = attainedCII <= requiredCII ? 'compliant' : 'non-compliant';
      
      // CII improvement rate required
      const ciiImprovementRate = attainedCII > requiredCII ? 
        ((attainedCII - requiredCII) / requiredCII) * 100 : 0;
      
      // CII compliance score
      const ciiComplianceScore = attainedCII <= requiredCII ? 
        Math.round(100 - ((attainedCII / requiredCII - 1) * 100)) : 
        Math.round(50 - ((attainedCII / requiredCII - 1) * 50));
      
      const averageVoyageDistance = distanceTraveled / voyageCount;

      return {
        id: vessel.id,
        name: vessel.name || 'Unknown Vessel',
        imoNumber: vessel.imoNumber || 'N/A',
        vesselType: vessel.type || 'general cargo',
        flagState: vessel.flag || 'Unknown',
        grossTonnage: vessel.grossTonnage || 50000,
        mainEngineType: vessel.mainEngineType || 'Diesel',
        iceClass: vessel.iceClass || 'None',
        fleetName: (vessel as any).fleetName || 'Unassigned',
        ciiRating,
        ciiScore,
        ciiCompliance,
        attainedCII,
        requiredCII,
        distanceTraveled,
        cargoCarried,
        transportWork,
        fuelConsumption: vessel.fuelConsumption || 0,
        co2Emissions,
        ciiImprovementRate,
        ciiComplianceScore,
        voyageCount,
        averageVoyageDistance,
      };
    });

    setReportData(processedData);
  }, [allVessels, selectedFleet]);

  // Calculate fleet totals
  const fleetTotals = {
    totalVessels: reportData.length,
    totalDistanceTraveled: reportData.reduce((sum, vessel) => sum + vessel.distanceTraveled, 0),
    totalCargoCarried: reportData.reduce((sum, vessel) => sum + vessel.cargoCarried, 0),
    totalTransportWork: reportData.reduce((sum, vessel) => sum + vessel.transportWork, 0),
    totalCO2Emissions: reportData.reduce((sum, vessel) => sum + vessel.co2Emissions, 0),
    compliantVessels: reportData.filter(vessel => vessel.ciiCompliance === 'compliant').length,
    nonCompliantVessels: reportData.filter(vessel => vessel.ciiCompliance === 'non-compliant').length,
    averageCIIComplianceScore: reportData.reduce((sum, vessel) => sum + vessel.ciiComplianceScore, 0) / reportData.length,
    totalVoyages: reportData.reduce((sum, vessel) => sum + vessel.voyageCount, 0),
    averageCIIImprovementRate: reportData.reduce((sum, vessel) => sum + vessel.ciiImprovementRate, 0) / reportData.length,
  };

  // Calculate average CII rating (A to E)
  const getAverageCIIRating = () => {
    if (reportData.length === 0) return 'N/A';
    
    // Convert ratings to numbers for calculation
    const ratingValues = reportData.map(vessel => {
      switch (vessel.ciiRating) {
        case 'A': return 5;
        case 'B': return 4;
        case 'C': return 3;
        case 'D': return 2;
        case 'E': return 1;
        default: return 3; // Default to C if unknown
      }
    });
    
    const averageValue = ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length;
    
    // Convert back to letter rating
    if (averageValue >= 4.5) return 'A';
    if (averageValue >= 3.5) return 'B';
    if (averageValue >= 2.5) return 'C';
    if (averageValue >= 1.5) return 'D';
    return 'E';
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
      'Main Engine Type', 'Ice Class', 'Fleet', 'CII Rating', 'CII Score',
      'Attained CII (gCO2/t·nm)', 'Required CII (gCO2/t·nm)', 'CII Compliance',
      'Distance Traveled (nm)', 'Cargo Carried (tonnes)', 'Transport Work (t·nm)',
      'Fuel Consumption (tonnes)', 'CO2 Emissions (tonnes)', 'CII Improvement Rate (%)',
      'Compliance Score', 'Voyage Count', 'Avg Voyage Distance (nm)'
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
        vessel.ciiRating,
        vessel.ciiScore,
        vessel.attainedCII.toFixed(2),
        vessel.requiredCII.toFixed(2),
        vessel.ciiCompliance,
        vessel.distanceTraveled.toFixed(0),
        vessel.cargoCarried.toFixed(0),
        vessel.transportWork.toFixed(0),
        vessel.fuelConsumption.toFixed(2),
        vessel.co2Emissions.toFixed(2),
        vessel.ciiImprovementRate.toFixed(1),
        vessel.ciiComplianceScore,
        vessel.voyageCount,
        vessel.averageVoyageDistance.toFixed(0)
      ].join(','))
    ].join('\n');

    const summaryContent = [
      '\n',
      'IMO DCS CII FLEET SUMMARY',
      `Total Vessels,${fleetTotals.totalVessels}`,
      `Total Distance Traveled (nm),${fleetTotals.totalDistanceTraveled.toFixed(0)}`,
      `Total Cargo Carried (tonnes),${fleetTotals.totalCargoCarried.toFixed(0)}`,
      `Total Transport Work (t·nm),${fleetTotals.totalTransportWork.toFixed(0)}`,
      `Total CO2 Emissions (tonnes),${fleetTotals.totalCO2Emissions.toFixed(2)}`,
      `Compliant Vessels,${fleetTotals.compliantVessels}`,
      `Non-Compliant Vessels,${fleetTotals.nonCompliantVessels}`,
      `Compliance Rate,${((fleetTotals.compliantVessels / fleetTotals.totalVessels) * 100).toFixed(1)}%`,
      `Average CII Compliance Score,${fleetTotals.averageCIIComplianceScore.toFixed(1)}`,
      `Total Voyages,${fleetTotals.totalVoyages}`,
      `Average CII Improvement Rate (%),${fleetTotals.averageCIIImprovementRate.toFixed(1)}`
    ].join('\n');

    const fullContent = csvContent + summaryContent;
    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `IMO_DCS_CII_Report_${selectedFleet === 'all' ? 'All_Fleets' : (allFleets.find((f: any) => f.id === selectedFleet)?.name || 'Fleet')}_${new Date().toISOString().split('T')[0]}.csv`);
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
            <span className="ml-2">Loading IMO DCS CII report data...</span>
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
                <Ship className="h-6 w-6 text-blue-600" />
                IMO DCS CII Report
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                IMO Data Collection System and Carbon Intensity Indicator compliance reporting
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
            IMO DCS CII Fleet Summary
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
              <div className="text-sm text-green-800">CII Compliant</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{getAverageCIIRating()}</div>
              <div className="text-sm text-orange-800">Average CII Rating (A to E)</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{fleetTotals.totalDistanceTraveled.toFixed(0)}</div>
              <div className="text-sm text-purple-800">Total Distance (nm)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vessel Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>IMO DCS CII Vessel Compliance Report</CardTitle>
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
                  <th className="text-right p-3 font-semibold">Attained CII</th>
                  <th className="text-right p-3 font-semibold">Required CII</th>
                  <th className="text-center p-3 font-semibold">CII Rating</th>
                  <th className="text-center p-3 font-semibold">CII Status</th>
                  <th className="text-right p-3 font-semibold">Distance (nm)</th>
                  <th className="text-right p-3 font-semibold">Cargo (t)</th>
                  <th className="text-right p-3 font-semibold">Transport Work</th>
                  <th className="text-right p-3 font-semibold">Improvement %</th>
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
                    <td className="p-3 text-right font-mono text-sm">{vessel.attainedCII.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono text-sm">{vessel.requiredCII.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <Badge className={getCIIBadgeColor(vessel.ciiRating)}>
                        {vessel.ciiRating}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge className={getComplianceBadgeColor(vessel.ciiCompliance)}>
                        {vessel.ciiCompliance === 'compliant' ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {vessel.ciiCompliance}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-mono text-sm">{vessel.distanceTraveled.toFixed(0)}</td>
                    <td className="p-3 text-right font-mono text-sm">{vessel.cargoCarried.toFixed(0)}</td>
                    <td className="p-3 text-right font-mono text-sm">{vessel.transportWork.toFixed(0)}</td>
                    <td className="p-3 text-right font-mono text-sm">
                      {vessel.ciiImprovementRate > 0 ? (
                        <span className="text-red-600">{vessel.ciiImprovementRate.toFixed(1)}%</span>
                      ) : (
                        <span className="text-green-600">0%</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Fleet Totals Row */}
              <tfoot>
                <tr className="border-t-2 bg-gray-100 font-semibold">
                  <td className="p-3" colSpan={3}>IMO DCS CII FLEET TOTALS</td>
                  <td className="p-3">{reportData.length} vessels</td>
                  <td className="p-3 text-right font-mono">
                    {(reportData.reduce((sum, v) => sum + v.attainedCII, 0) / fleetTotals.totalVessels).toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {(reportData.reduce((sum, v) => sum + v.requiredCII, 0) / fleetTotals.totalVessels).toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <Badge className="bg-gray-100 text-gray-800">
                      AVG: {fleetTotals.averageCIIComplianceScore.toFixed(1)}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge className="bg-blue-100 text-blue-800">
                      {((fleetTotals.compliantVessels / fleetTotals.totalVessels) * 100).toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="p-3 text-right font-mono">{fleetTotals.totalDistanceTraveled.toFixed(0)}</td>
                  <td className="p-3 text-right font-mono">{fleetTotals.totalCargoCarried.toFixed(0)}</td>
                  <td className="p-3 text-right font-mono">{fleetTotals.totalTransportWork.toFixed(0)}</td>
                  <td className="p-3 text-right font-mono">
                    {fleetTotals.averageCIIImprovementRate.toFixed(1)}%
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

export default IMODCSCIIReport;

