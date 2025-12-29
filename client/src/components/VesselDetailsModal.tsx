import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ship, Snowflake, Zap, MapPin, Fuel, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import type { VesselViewModel } from "@shared/viewModels";

interface VesselDetailsModalProps {
  vessel: VesselViewModel | null;
  isOpen: boolean;
  onClose: () => void;
  onViewInCompliance: (vessel: VesselViewModel) => void;
  onViewInCalculator: (vessel: VesselViewModel) => void;
  onViewVesselDetails: (vessel: VesselViewModel) => void;
}

const VesselDetailsModal: React.FC<VesselDetailsModalProps> = ({
  vessel,
  isOpen,
  onClose,
  onViewInCompliance,
  onViewInCalculator,
  onViewVesselDetails
}) => {
  if (!vessel) return null;

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'non-compliant': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'non-compliant': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="vessel-details-description">
        {/* Debug info */}
        {console.log('VesselDetailsModal render - isOpen:', isOpen, 'vessel:', vessel)}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            {vessel.name} - Detailed Information
          </DialogTitle>
          <p id="vessel-details-description" className="sr-only">
            Detailed vessel information including compliance status, fuel consumption, and performance metrics for {vessel.name}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IMO Number</label>
                  <p className="text-sm font-mono">{vessel.imoNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vessel Type</label>
                  <p className="text-sm">{vessel.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Flag State</label>
                  <p className="text-sm">{vessel.flag}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gross Tonnage</label>
                  <p className="text-sm font-mono">{vessel.grossTonnage.toLocaleString()} GT</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Features */}
          {(vessel.iceClass || vessel.mainEngineType || vessel.voyageType) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Special Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {vessel.iceClass && (
                    <Badge variant="outline" className="text-sm">
                      <Snowflake className="h-3 w-3 mr-1" />
                      Ice Class: {vessel.iceClass}
                    </Badge>
                  )}
                  {vessel.mainEngineType && (
                    <Badge variant="outline" className="text-sm bg-green-50">
                      <Zap className="h-3 w-3 mr-1" />
                      {vessel.mainEngineType}
                    </Badge>
                  )}
                  {vessel.voyageType && (
                    <Badge variant="outline" className="text-sm bg-blue-50">
                      <MapPin className="h-3 w-3 mr-1" />
                      {vessel.voyageType === 'omr' ? 'OMR Route' : 
                       vessel.voyageType === 'intra-eu' ? 'Intra-EU' : 
                       vessel.voyageType === 'extra-eu' ? 'Extra-EU' : vessel.voyageType}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compliance Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {getComplianceIcon(vessel.complianceStatus)}
                Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current GHG Intensity</label>
                  <p className={`text-lg font-semibold ${getComplianceColor(vessel.complianceStatus)}`}>
                    {vessel.ghgIntensity} gCO2e/MJ
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Target Intensity (2025)</label>
                  <p className="text-lg font-semibold text-gray-600">
                    {vessel.targetIntensity} gCO2e/MJ
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Performance vs Target</label>
                  <p className={`text-lg font-semibold ${
                    vessel.ghgIntensity <= vessel.targetIntensity ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {vessel.ghgIntensity <= vessel.targetIntensity ? '✅ Compliant' : '❌ Exceeds Target'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fuel & Credits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Fuel className="h-5 w-5" />
                Fuel Consumption & Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Monthly Fuel Consumption</label>
                  <p className="text-lg font-semibold">{vessel.fuelConsumption} MT</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Credit Balance</label>
                  <p className={`text-lg font-semibold ${
                    vessel.creditBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {vessel.creditBalance >= 0 ? '+' : ''}{vessel.creditBalance.toFixed(1)} credits
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => onViewVesselDetails(vessel)}
              className="flex-1"
              variant="default"
            >
              <Ship className="h-4 w-4 mr-2" />
              View Complete Details
            </Button>
            <Button 
              onClick={() => onViewInCompliance(vessel)}
              className="flex-1"
              variant="outline"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View in Compliance
            </Button>
            <Button 
              onClick={() => onViewInCalculator(vessel)}
              className="flex-1"
              variant="outline"
            >
              <Fuel className="h-4 w-4 mr-2" />
              View in Calculator
            </Button>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VesselDetailsModal;
