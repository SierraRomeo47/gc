import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Ship, Users, X, Plus, Filter } from "lucide-react";
import { api, fleetsAPI } from "@/lib/api";
import type { FleetViewModel, VesselViewModel } from "@shared/viewModels";

interface FleetVesselSelectorProps {
  userId: string;
  currentFleetIds: string[];
  currentVesselIds: string[];
  onFleetChange: (fleetIds: string[]) => void;
  onVesselChange: (vesselIds: string[]) => void;
  disabled?: boolean;
}

interface AccessSummaryProps {
  fleetCount: number;
  vesselCount: number;
  explicitFleetCount: number;
  explicitVesselCount: number;
}

const AccessSummary: React.FC<AccessSummaryProps> = ({
  fleetCount,
  vesselCount,
  explicitFleetCount,
  explicitVesselCount,
}) => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Access Summary</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Fleets</span>
            </div>
            <div className="text-muted-foreground">
              {fleetCount} total ({explicitFleetCount} explicit)
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Ship className="h-4 w-4 text-green-600" />
              <span className="font-medium">Vessels</span>
            </div>
            <div className="text-muted-foreground">
              {vesselCount} total ({explicitVesselCount} explicit)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const FleetSelector: React.FC<{
  userId: string;
  selectedFleetIds: string[];
  onSelectionChange: (fleetIds: string[]) => void;
  disabled?: boolean;
}> = ({ userId, selectedFleetIds, onSelectionChange, disabled }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch all fleets (for admin selection)
  const { data: allFleets = [], isLoading: fleetsLoading } = useQuery({
    queryKey: ['fleets'],
    queryFn: () => fleetsAPI.getAll(),
  });

  // Fetch user's accessible fleets
  const { data: accessibleFleets = [], isLoading: accessibleLoading } = useQuery({
    queryKey: ['user-fleets', userId],
    queryFn: () => api.users.getFleets(userId),
  });

  const filteredFleets = allFleets.filter(fleet => {
    const matchesSearch = fleet.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || 
      (filterType === 'accessible' && accessibleFleets.some(af => af.id === fleet.id)) ||
      (filterType === 'selected' && selectedFleetIds.includes(fleet.id));
    return matchesSearch && matchesFilter;
  });

  const handleFleetToggle = (fleetId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedFleetIds, fleetId]);
    } else {
      onSelectionChange(selectedFleetIds.filter(id => id !== fleetId));
    }
  };

  const handleSelectAll = () => {
    if (selectedFleetIds.length === filteredFleets.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredFleets.map(fleet => fleet.id));
    }
  };

  if (fleetsLoading) {
    return <div className="text-sm text-muted-foreground">Loading fleets...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fleets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              disabled={disabled}
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="accessible">Accessible</SelectItem>
            <SelectItem value="selected">Selected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all-fleets"
            checked={selectedFleetIds.length === filteredFleets.length && filteredFleets.length > 0}
            onCheckedChange={handleSelectAll}
            disabled={disabled}
          />
          <Label htmlFor="select-all-fleets" className="text-sm">
            Select All ({filteredFleets.length})
          </Label>
        </div>
        <Badge variant="outline">
          {selectedFleetIds.length} selected
        </Badge>
      </div>

      <ScrollArea className="h-48 border rounded-md">
        <div className="p-2 space-y-2">
          {filteredFleets.map((fleet) => {
            const isAccessible = accessibleFleets.some(af => af.id === fleet.id);
            const isSelected = selectedFleetIds.includes(fleet.id);
            
            return (
              <div
                key={fleet.id}
                className={`flex items-center space-x-2 p-2 rounded-md border ${
                  isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
              >
                <Checkbox
                  id={`fleet-${fleet.id}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleFleetToggle(fleet.id, checked as boolean)}
                  disabled={disabled}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`fleet-${fleet.id}`} className="font-medium cursor-pointer">
                      {fleet.name}
                    </Label>
                    {isAccessible && (
                      <Badge variant="secondary" className="text-xs">
                        Accessible
                      </Badge>
                    )}
                  </div>
                  {fleet.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {fleet.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {filteredFleets.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No fleets found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const VesselSelector: React.FC<{
  userId: string;
  selectedVesselIds: string[];
  onSelectionChange: (vesselIds: string[]) => void;
  disabled?: boolean;
}> = ({ userId, selectedVesselIds, onSelectionChange, disabled }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterFleet, setFilterFleet] = useState<string>('all');

  // Fetch all vessels
  const { data: allVessels = [], isLoading: vesselsLoading } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => api.vessels.getAll(),
  });

  // Fetch user's accessible vessels
  const { data: accessibleVessels = [], isLoading: accessibleLoading } = useQuery({
    queryKey: ['user-vessels', userId],
    queryFn: () => api.users.getVessels(userId),
  });

  // Fetch fleets for filtering
  const { data: fleets = [] } = useQuery({
    queryKey: ['fleets'],
    queryFn: () => fleetsAPI.getAll(),
  });

  const filteredVessels = allVessels.filter(vessel => {
    const matchesSearch = vessel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        vessel.imoNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'accessible' && accessibleVessels.some(av => av.id === vessel.id)) ||
      (filterType === 'selected' && selectedVesselIds.includes(vessel.id));
    
    const matchesFleet = filterFleet === 'all' || vessel.fleetId === filterFleet;
    
    return matchesSearch && matchesFilter && matchesFleet;
  });

  const handleVesselToggle = (vesselId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedVesselIds, vesselId]);
    } else {
      onSelectionChange(selectedVesselIds.filter(id => id !== vesselId));
    }
  };

  const handleSelectAll = () => {
    if (selectedVesselIds.length === filteredVessels.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredVessels.map(vessel => vessel.id));
    }
  };

  if (vesselsLoading) {
    return <div className="text-sm text-muted-foreground">Loading vessels...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vessels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              disabled={disabled}
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="accessible">Accessible</SelectItem>
            <SelectItem value="selected">Selected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterFleet} onValueChange={setFilterFleet}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fleets</SelectItem>
            {(fleets || []).map(fleet => (
              <SelectItem key={fleet.id} value={fleet.id}>
                {fleet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all-vessels"
            checked={selectedVesselIds.length === filteredVessels.length && filteredVessels.length > 0}
            onCheckedChange={handleSelectAll}
            disabled={disabled}
          />
          <Label htmlFor="select-all-vessels" className="text-sm">
            Select All ({filteredVessels.length})
          </Label>
        </div>
        <Badge variant="outline">
          {selectedVesselIds.length} selected
        </Badge>
      </div>

      <ScrollArea className="h-64 border rounded-md">
        <div className="p-2 space-y-2">
          {filteredVessels.map((vessel) => {
            const isAccessible = accessibleVessels.some(av => av.id === vessel.id);
            const isSelected = selectedVesselIds.includes(vessel.id);
            const fleet = fleets.find(f => f.id === vessel.fleetId);
            
            return (
              <div
                key={vessel.id}
                className={`flex items-center space-x-2 p-2 rounded-md border ${
                  isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
              >
                <Checkbox
                  id={`vessel-${vessel.id}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleVesselToggle(vessel.id, checked as boolean)}
                  disabled={disabled}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`vessel-${vessel.id}`} className="font-medium cursor-pointer">
                      {vessel.name}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {vessel.imoNumber}
                    </Badge>
                    {isAccessible && (
                      <Badge variant="secondary" className="text-xs">
                        Accessible
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {vessel.type} • {vessel.flag} • {fleet?.name || 'No Fleet'}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredVessels.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No vessels found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const FleetVesselSelector: React.FC<FleetVesselSelectorProps> = ({
  userId,
  currentFleetIds,
  currentVesselIds,
  onFleetChange,
  onVesselChange,
  disabled = false,
}) => {
  // ULTRA AGGRESSIVE CACHE BUSTER - force re-render
  console.log('🚨 ULTRA CACHE BUSTER: FleetVesselSelector component loaded at:', new Date().toISOString());
  console.log('🚨 Current fleet IDs:', currentFleetIds);
  console.log('🚨 Current vessel IDs:', currentVesselIds);
  console.log('🚨 User ID:', userId);
  
  const [selectedFleetIds, setSelectedFleetIds] = useState<string[]>(currentFleetIds);
  const [selectedVesselIds, setSelectedVesselIds] = useState<string[]>(currentVesselIds);

  // Fetch access info for summary
  const { data: accessInfo } = useQuery({
    queryKey: ['user-access-info', userId],
    queryFn: () => api.users.getAccessInfo(userId),
  });

  useEffect(() => {
    setSelectedFleetIds(currentFleetIds);
  }, [currentFleetIds]);

  useEffect(() => {
    setSelectedVesselIds(currentVesselIds);
  }, [currentVesselIds]);

  const handleFleetChange = (fleetIds: string[]) => {
    setSelectedFleetIds(fleetIds);
    onFleetChange(fleetIds);
  };

  const handleVesselChange = (vesselIds: string[]) => {
    setSelectedVesselIds(vesselIds);
    onVesselChange(vesselIds);
  };

  return (
    <div className="space-y-6">
      {/* ULTRA AGGRESSIVE CACHE BUSTER */}
      <div className="text-xs text-red-500 font-bold bg-yellow-200 p-2 border-2 border-red-500">
        🚨 ULTRA CACHE BUSTER: FleetVesselSelector loaded at {new Date().toISOString()} 🚨
        <br />
        FleetCount: {selectedFleetIds.length} | VesselCount: {selectedVesselIds.length}
        <br />
        FleetIds: {JSON.stringify(selectedFleetIds)}
        <br />
        VesselIds: {JSON.stringify(selectedVesselIds)}
      </div>
      
      <AccessSummary
        fleetCount={selectedFleetIds.length}
        vesselCount={selectedVesselIds.length}
        explicitFleetCount={selectedFleetIds.length}
        explicitVesselCount={selectedVesselIds.length}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Fleet Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FleetSelector
            userId={userId}
            selectedFleetIds={selectedFleetIds}
            onSelectionChange={handleFleetChange}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Vessel Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VesselSelector
            userId={userId}
            selectedVesselIds={selectedVesselIds}
            onSelectionChange={handleVesselChange}
            disabled={disabled}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetVesselSelector;


