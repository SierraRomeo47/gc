import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ship, Plus, Edit, Trash2, Users, Filter, Search } from "lucide-react";
import { api, fleetsAPI } from "@/lib/api";
import { UserRole, Permission, hasPermission } from "@/lib/userRoles";
import type { UserViewModel } from "@shared/viewModels";

interface VesselFleetManagementProps {
  currentUser: UserViewModel;
}

const VesselFleetManagement: React.FC<VesselFleetManagementProps> = ({ currentUser }) => {
  const [isCreateVesselDialogOpen, setIsCreateVesselDialogOpen] = useState(false);
  const [isCreateFleetDialogOpen, setIsCreateFleetDialogOpen] = useState(false);
  const [isEditVesselDialogOpen, setIsEditVesselDialogOpen] = useState(false);
  const [isEditFleetDialogOpen, setIsEditFleetDialogOpen] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<any>(null);
  const [selectedFleet, setSelectedFleet] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterFleet, setFilterFleet] = useState<string>('all');

  const queryClient = useQueryClient();

  // Fetch data
  const { data: vessels = [], isLoading: vesselsLoading } = useQuery({
    queryKey: ['vessels', 'all'],
    queryFn: () => api.vessels.getAll(),
  });

  const { data: fleets = [] } = useQuery({
    queryKey: ['fleets'],
    queryFn: () => fleetsAPI.getAll(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(),
  });

  // New vessel state
  const [newVessel, setNewVessel] = useState({
    name: '',
    imoNumber: '',
    type: 'Container Ship',
    flag: '',
    grossTonnage: 0,
    deadweightTonnage: 0,
    mainEngineType: 'Diesel',
    iceClass: 'none',
    fleetId: '',
    ownerId: currentUser.id,
    managerId: '',
    chartererId: ''
  });

  // New fleet state
  const [newFleet, setNewFleet] = useState({
    name: '',
    description: '',
    ownerId: currentUser.id,
    managerId: '',
    vesselIds: []
  });

  // Mutations
  const createVesselMutation = useMutation({
    mutationFn: (vesselData: any) => api.vessels.create(vesselData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      setIsCreateVesselDialogOpen(false);
      setNewVessel({ name: '', imoNumber: '', type: 'Container Ship', flag: '', grossTonnage: 0, deadweightTonnage: 0, mainEngineType: 'Diesel', iceClass: '', fleetId: '', ownerId: currentUser.id, managerId: '', chartererId: '' });
    },
  });

  const createFleetMutation = useMutation({
    mutationFn: (fleetData: any) => fleetsAPI.create(fleetData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fleets'] });
      setIsCreateFleetDialogOpen(false);
      setNewFleet({ name: '', description: '', ownerId: currentUser.id, managerId: '', vesselIds: [] });
    },
  });

  const updateVesselMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.vessels.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      setIsEditVesselDialogOpen(false);
      setSelectedVessel(null);
    },
  });

  const deleteVesselMutation = useMutation({
    mutationFn: (id: string) => api.vessels.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
    },
  });

  // Filter vessels based on user role and permissions
  const getFilteredVessels = () => {
    let filtered = vessels;

    // Filter by user permissions
    if (currentUser.role !== UserRole.ADMIN) {
      filtered = vessels.filter(vessel => 
        currentUser.vesselIds.includes(vessel.id) || 
        currentUser.fleetIds.includes(vessel.fleetId)
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(vessel =>
        vessel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vessel.imoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vessel.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by fleet
    if (filterFleet !== 'all') {
      filtered = filtered.filter(vessel => vessel.fleetId === filterFleet);
    }

    return filtered;
  };

  const filteredVessels = getFilteredVessels();

  const handleCreateVessel = () => {
    createVesselMutation.mutate(newVessel);
  };

  const handleCreateFleet = () => {
    createFleetMutation.mutate(newFleet);
  };

  const handleUpdateVessel = () => {
    if (selectedVessel) {
      updateVesselMutation.mutate({ id: selectedVessel.id, data: selectedVessel });
    }
  };

  const handleDeleteVessel = (vesselId: string) => {
    if (confirm('Are you sure you want to delete this vessel?')) {
      deleteVesselMutation.mutate(vesselId);
    }
  };

  const handleEditVessel = (vessel: any) => {
    setSelectedVessel({ ...vessel });
    setIsEditVesselDialogOpen(true);
  };

  const getComplianceBadgeVariant = (status: string) => {
    switch (status) {
      case 'compliant': return 'default';
      case 'warning': return 'secondary';
      case 'non-compliant': return 'destructive';
      default: return 'outline';
    }
  };

  const canManageVessels = hasPermission(currentUser, Permission.MANAGE_FLEET);
  const canCreateVessels = hasPermission(currentUser, Permission.CREATE_VESSELS);
  const canDeleteVessels = hasPermission(currentUser, Permission.DELETE_VESSELS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Vessel & Fleet Management</h2>
          <p className="text-muted-foreground">
            Manage vessels and fleets with role-based access control
          </p>
        </div>
        <div className="flex gap-2">
          {canCreateVessels && (
            <>
              <Dialog open={isCreateVesselDialogOpen} onOpenChange={setIsCreateVesselDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Ship className="h-4 w-4 mr-2" />
                    Add Vessel
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Dialog open={isCreateFleetDialogOpen} onOpenChange={setIsCreateFleetDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Fleet
                  </Button>
                </DialogTrigger>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vessels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={filterFleet} onValueChange={setFilterFleet}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by fleet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fleets</SelectItem>
                  {(fleets || []).map((fleet: any) => (
                    <SelectItem key={fleet.id} value={fleet.id}>
                      {fleet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="vessels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vessels">Vessels ({filteredVessels.length})</TabsTrigger>
          <TabsTrigger value="fleets">Fleets ({fleets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="vessels" className="space-y-4">
          {/* Vessels Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5" />
                Vessels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>IMO</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Flag</TableHead>
                    <TableHead>GT</TableHead>
                    <TableHead>Fleet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVessels.map((vessel: any) => (
                    <TableRow key={vessel.id}>
                      <TableCell className="font-medium">{vessel.name}</TableCell>
                      <TableCell className="font-mono text-sm">{vessel.imoNumber}</TableCell>
                      <TableCell>{vessel.type}</TableCell>
                      <TableCell>{vessel.flag}</TableCell>
                      <TableCell>{vessel.grossTonnage?.toLocaleString()}</TableCell>
                      <TableCell>
                        {fleets.find((f: any) => f.id === vessel.fleetId)?.name || 'No Fleet'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getComplianceBadgeVariant(vessel.complianceStatus)}>
                          {vessel.complianceStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {canManageVessels && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditVessel(vessel)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          {canDeleteVessels && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteVessel(vessel.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fleets" className="space-y-4">
          {/* Fleets Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Fleets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Vessels</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(fleets || []).map((fleet: any) => (
                    <TableRow key={fleet.id}>
                      <TableCell className="font-medium">{fleet.name}</TableCell>
                      <TableCell>{fleet.description || '-'}</TableCell>
                      <TableCell>
                        {users.find((u: any) => u.id === fleet.ownerId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {fleet.managerId ? users.find((u: any) => u.id === fleet.managerId)?.name || 'Unknown' : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {fleet.vesselIds?.length || 0} vessels
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${fleet.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className={fleet.isActive ? 'text-green-600' : 'text-red-600'}>
                            {fleet.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Vessel Dialog */}
      <Dialog open={isCreateVesselDialogOpen} onOpenChange={setIsCreateVesselDialogOpen}>
        <DialogContent className="max-w-2xl" aria-describedby="create-vessel-description">
          <DialogHeader>
            <DialogTitle>Create New Vessel</DialogTitle>
            <p id="create-vessel-description" className="sr-only">
              Create a new vessel with specifications and compliance settings
            </p>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vessel-name">Vessel Name</Label>
              <Input
                id="vessel-name"
                value={newVessel.name}
                onChange={(e) => setNewVessel({ ...newVessel, name: e.target.value })}
                placeholder="Enter vessel name"
              />
            </div>
            <div>
              <Label htmlFor="vessel-imo">IMO Number</Label>
              <Input
                id="vessel-imo"
                value={newVessel.imoNumber}
                onChange={(e) => setNewVessel({ ...newVessel, imoNumber: e.target.value })}
                placeholder="Enter IMO number"
              />
            </div>
            <div>
              <Label htmlFor="vessel-type">Vessel Type</Label>
              <Select value={newVessel.type} onValueChange={(value) => setNewVessel({ ...newVessel, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Container Ship">Container Ship</SelectItem>
                  <SelectItem value="Tanker">Tanker</SelectItem>
                  <SelectItem value="Bulk Carrier">Bulk Carrier</SelectItem>
                  <SelectItem value="Ro-Ro Cargo">Ro-Ro Cargo</SelectItem>
                  <SelectItem value="Ro-Ro Passenger">Ro-Ro Passenger</SelectItem>
                  <SelectItem value="General Cargo">General Cargo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vessel-flag">Flag State</Label>
              <Input
                id="vessel-flag"
                value={newVessel.flag}
                onChange={(e) => setNewVessel({ ...newVessel, flag: e.target.value })}
                placeholder="Enter flag state"
              />
            </div>
            <div>
              <Label htmlFor="vessel-gt">Gross Tonnage</Label>
              <Input
                id="vessel-gt"
                type="number"
                value={newVessel.grossTonnage}
                onChange={(e) => setNewVessel({ ...newVessel, grossTonnage: parseInt(e.target.value) || 0 })}
                placeholder="Enter gross tonnage"
              />
            </div>
            <div>
              <Label htmlFor="vessel-dwt">Deadweight Tonnage</Label>
              <Input
                id="vessel-dwt"
                type="number"
                value={newVessel.deadweightTonnage}
                onChange={(e) => setNewVessel({ ...newVessel, deadweightTonnage: parseInt(e.target.value) || 0 })}
                placeholder="Enter deadweight tonnage"
              />
            </div>
            <div>
              <Label htmlFor="vessel-engine">Main Engine Type</Label>
              <Select value={newVessel.mainEngineType} onValueChange={(value) => setNewVessel({ ...newVessel, mainEngineType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="LNG Dual-Fuel">LNG Dual-Fuel</SelectItem>
                  <SelectItem value="Methanol Dual-Fuel">Methanol Dual-Fuel</SelectItem>
                  <SelectItem value="Hydrogen">Hydrogen</SelectItem>
                  <SelectItem value="Battery-Electric">Battery-Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vessel-ice">Ice Class</Label>
              <Select value={newVessel.iceClass} onValueChange={(value) => setNewVessel({ ...newVessel, iceClass: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ice class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Ice Class</SelectItem>
                  <SelectItem value="1A Super">1A Super</SelectItem>
                  <SelectItem value="1A">1A</SelectItem>
                  <SelectItem value="1B">1B</SelectItem>
                  <SelectItem value="1C">1C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vessel-fleet">Fleet</Label>
              <Select value={newVessel.fleetId} onValueChange={(value) => setNewVessel({ ...newVessel, fleetId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fleet" />
                </SelectTrigger>
                <SelectContent>
                  {(fleets || []).map((fleet: any) => (
                    <SelectItem key={fleet.id} value={fleet.id}>
                      {fleet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleCreateVessel} className="flex-1" disabled={createVesselMutation.isPending}>
              {createVesselMutation.isPending ? 'Creating...' : 'Create Vessel'}
            </Button>
            <Button variant="outline" onClick={() => setIsCreateVesselDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Fleet Dialog */}
      <Dialog open={isCreateFleetDialogOpen} onOpenChange={setIsCreateFleetDialogOpen}>
        <DialogContent className="max-w-md" aria-describedby="create-fleet-description">
          <DialogHeader>
            <DialogTitle>Create New Fleet</DialogTitle>
            <p id="create-fleet-description" className="sr-only">
              Create a new fleet to organize and manage multiple vessels
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fleet-name">Fleet Name</Label>
              <Input
                id="fleet-name"
                value={newFleet.name}
                onChange={(e) => setNewFleet({ ...newFleet, name: e.target.value })}
                placeholder="Enter fleet name"
              />
            </div>
            <div>
              <Label htmlFor="fleet-description">Description</Label>
              <Input
                id="fleet-description"
                value={newFleet.description}
                onChange={(e) => setNewFleet({ ...newFleet, description: e.target.value })}
                placeholder="Enter fleet description"
              />
            </div>
            <div>
              <Label htmlFor="fleet-manager">Manager</Label>
              <Select value={newFleet.managerId} onValueChange={(value) => setNewFleet({ ...newFleet, managerId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter((u: any) => u.role === UserRole.FLEET_MANAGER || u.role === UserRole.OPERATIONS_MANAGER).map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateFleet} className="flex-1" disabled={createFleetMutation.isPending}>
                {createFleetMutation.isPending ? 'Creating...' : 'Create Fleet'}
              </Button>
              <Button variant="outline" onClick={() => setIsCreateFleetDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VesselFleetManagement;
