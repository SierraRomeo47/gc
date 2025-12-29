import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Ship, CheckCircle2, XCircle } from "lucide-react";
import { useVesselSelection } from '@/contexts/VesselSelectionContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { FleetViewModel, VesselViewModel } from "@shared/viewModels";

interface VesselAssignmentDialogProps {
  fleet?: FleetViewModel;
  vesselId?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAssignmentComplete?: (result: { fleet: FleetViewModel; vessels: VesselViewModel[] }) => void;
}

const VesselAssignmentDialog: React.FC<VesselAssignmentDialogProps> = ({
  fleet,
  vesselId,
  trigger,
  open,
  onOpenChange,
  onAssignmentComplete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVesselIds, setSelectedVesselIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { assignVesselsToFleet, removeVesselFromFleet } = useVesselSelection();
  const queryClient = useQueryClient();

  // Mutation for assigning vessel to fleet
  const assignVesselMutation = useMutation({
    mutationFn: async ({ vesselId, fleetId }: { vesselId: string; fleetId: string }) => {
      return api.vessels.update(vesselId, { fleetId });
    },
    onSuccess: () => {
      // Invalidate and refetch vessel queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      queryClient.invalidateQueries({ queryKey: ['fleets'] });
      queryClient.invalidateQueries({ queryKey: ['fleets', 'all'] });
      
      // Close the dialog
      if (onOpenChange) {
        onOpenChange(false);
      } else {
        setIsOpen(false);
      }
      
      // Call the completion callback if provided
      if (onAssignmentComplete) {
        const assignedFleet = allFleets.find(f => f.id === fleetId);
        if (assignedFleet) {
          onAssignmentComplete({ fleet: assignedFleet, vessels: [] });
        }
      }
    },
    onError: (error: any) => {
      console.error('Failed to assign vessel to fleet:', error);
      setError(error.message || 'Failed to assign vessel to fleet');
    }
  });

  // Fetch all vessels
  const { data: allVessels = [], isLoading: vesselsLoading } = useQuery({
    queryKey: ['vessels', 'all'],
    queryFn: () => api.vessels.getAll(),
  });

  // Fetch all fleets
  const { data: allFleets = [], isLoading: fleetsLoading } = useQuery({
    queryKey: ['fleets', 'all'],
    queryFn: () => api.fleets.getAll(),
  });

  // Filter vessels based on search term
  const filteredVessels = allVessels.filter(vessel =>
    vessel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vessel.imoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vessel.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate vessels by assignment status
  const assignedVessels = filteredVessels.filter(vessel => vessel.fleetId === fleet?.id);
  const unassignedVessels = filteredVessels.filter(vessel => !vessel.fleetId || vessel.fleetId !== fleet?.id);

  const handleVesselToggle = (vesselId: string, isAssigned: boolean) => {
    if (isAssigned) {
      setSelectedVesselIds(prev => prev.filter(id => id !== vesselId));
    } else {
      setSelectedVesselIds(prev => [...prev, vesselId]);
    }
  };

  const handleAssignSelected = async () => {
    if (selectedVesselIds.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await assignVesselsToFleet(fleet?.id || '', selectedVesselIds);
      onAssignmentComplete?.(result);
      setSelectedVesselIds([]);
      if (onOpenChange) {
        onOpenChange(false);
      } else {
        setIsOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign vessels');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveVessel = async (vesselId: string) => {
    if (!confirm('Are you sure you want to remove this vessel from the fleet?')) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await removeVesselFromFleet(fleet?.id || '', vesselId);
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      queryClient.invalidateQueries({ queryKey: ['fleets'] });
      queryClient.invalidateQueries({ queryKey: ['fleets', 'all'] });
      
      console.log('Vessel removed from fleet successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove vessel');
      console.error('Error removing vessel from fleet:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Users className="h-4 w-4 mr-2" />
      Manage Vessels
    </Button>
  );

  const dialogOpen = open !== undefined ? open : isOpen;
  const dialogOnOpenChange = onOpenChange || setIsOpen;

  return (
    <Dialog open={dialogOpen} onOpenChange={dialogOnOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col" aria-describedby="vessel-assignment-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {vesselId ? 'Assign Vessel to Fleet' : `Manage Vessels - ${fleet?.name}`}
          </DialogTitle>
          <p id="vessel-assignment-description" className="sr-only">
            {vesselId ? 'Assign a vessel to a fleet for better organization and management' : `Manage vessels in the ${fleet?.name} fleet`}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {vesselId ? (
            // Individual vessel assignment mode
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Select a fleet to assign this vessel to:
              </div>
              {fleetsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading fleets...</span>
                </div>
              ) : (
                <div className="grid gap-2">
                  {allFleets.map((fleetOption: FleetViewModel) => (
                    <Button
                      key={fleetOption.id}
                      variant="outline"
                      className="justify-start h-auto p-4"
                      disabled={assignVesselMutation.isPending}
                      onClick={() => {
                        if (vesselId) {
                          assignVesselMutation.mutate({ 
                            vesselId, 
                            fleetId: fleetOption.id 
                          });
                        }
                      }}
                    >
                      <div className="text-left">
                        <div className="font-medium flex items-center gap-2">
                          {assignVesselMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                          {fleetOption.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {fleetOption.description || 'No description'}
                        </div>
                      </div>
                    </Button>
                  ))}
                  {allFleets.length === 0 && (
                    <div className="text-center p-4 text-muted-foreground">
                      No fleets available. Create a fleet first.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Fleet management mode (existing code)
            <>
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Vessels</Label>
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, IMO, or type..."
            />
          </div>

          {/* Action Bar */}
          {selectedVesselIds.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedVesselIds.length} vessel(s) selected
              </span>
              <Button
                onClick={handleAssignSelected}
                disabled={isSubmitting}
                size="sm"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Assign to Fleet
              </Button>
            </div>
          )}

          {/* Vessels List */}
          <div className="flex-1 overflow-auto space-y-4">
            {/* Assigned Vessels */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Assigned Vessels ({assignedVessels.length})
              </h3>
              <div className="space-y-2">
                {(assignedVessels || []).map((vessel) => (
                  <div
                    key={vessel.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                  >
                    <div className="flex items-center space-x-3">
                      <Ship className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-medium">{vessel.name}</div>
                        <div className="text-sm text-gray-600">
                          {vessel.imoNumber} • {vessel.type} • {vessel.flag}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveVessel(vessel.id)}
                      disabled={isSubmitting}
                      className="text-red-600 hover:text-red-700"
                    >
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      <XCircle className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
                {assignedVessels.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No vessels assigned to this fleet
                  </div>
                )}
              </div>
            </div>

            {/* Available Vessels */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Ship className="h-5 w-5 text-blue-600" />
                Available Vessels ({unassignedVessels.length})
              </h3>
              <div className="space-y-2">
                {(unassignedVessels || []).map((vessel) => (
                  <div
                    key={vessel.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedVesselIds.includes(vessel.id)}
                        onCheckedChange={(checked) => 
                          handleVesselToggle(vessel.id, !checked)
                        }
                      />
                      <Ship className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">{vessel.name}</div>
                        <div className="text-sm text-gray-600">
                          {vessel.imoNumber} • {vessel.type} • {vessel.flag}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {vessel.complianceStatus}
                    </Badge>
                  </div>
                ))}
                {unassignedVessels.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No available vessels to assign
                  </div>
                )}
              </div>
            </div>
          </div>

            </>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (onOpenChange) {
                  onOpenChange(false);
                } else {
                  setIsOpen(false);
                }
              }}
              disabled={isSubmitting}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VesselAssignmentDialog;
