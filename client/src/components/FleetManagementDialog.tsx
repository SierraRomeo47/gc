import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Edit, Trash2, Ship } from "lucide-react";
import { useVesselSelection } from '@/contexts/VesselSelectionContext';
import type { FleetViewModel } from "@shared/viewModels";

interface FleetManagementDialogProps {
  trigger?: React.ReactNode;
  fleetToEdit?: FleetViewModel;
  onFleetCreated?: (fleet: FleetViewModel) => void;
  onFleetUpdated?: (fleet: FleetViewModel) => void;
  onFleetDeleted?: (fleetId: string) => void;
}

const FleetManagementDialog: React.FC<FleetManagementDialogProps> = ({
  trigger,
  fleetToEdit,
  onFleetCreated,
  onFleetUpdated,
  onFleetDeleted,
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    orgId: '',
  });

  const {
    organizations,
    isLoading: orgsLoading,
    createFleet,
    updateFleet,
    deleteFleet,
    refreshOrganizations,
  } = useVesselSelection();

  // Load organizations when dialog opens
  useEffect(() => {
    if (open && organizations.length === 0) {
      refreshOrganizations();
    }
  }, [open, organizations.length, refreshOrganizations]);

  // Initialize form data
  useEffect(() => {
    if (fleetToEdit) {
      setFormData({
        name: fleetToEdit.name || '',
        description: fleetToEdit.description || '',
        orgId: fleetToEdit.orgId || (organizations.length > 0 ? organizations[0].id : ''),
      });
    } else {
      setFormData({
        name: '',
        description: '',
        orgId: organizations.length > 0 ? organizations[0].id : '',
      });
    }
  }, [fleetToEdit, organizations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Fleet name is required');
      return;
    }
    if (!formData.orgId) {
      setError('Organization is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (fleetToEdit) {
        const updatedFleet = await updateFleet(fleetToEdit.id, formData);
        onFleetUpdated?.(updatedFleet as FleetViewModel);
      } else {
        const newFleet = await createFleet(formData);
        onFleetCreated?.(newFleet as FleetViewModel);
      }
      setOpen(false);
      setFormData({ name: '', description: '', orgId: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!fleetToEdit) return;
    
    if (!confirm(`Are you sure you want to delete the fleet "${fleetToEdit.name}"?`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await deleteFleet(fleetToEdit.id);
      onFleetDeleted?.(fleetToEdit.id);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete fleet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Plus className="h-4 w-4 mr-2" />
      Add Fleet
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="fleet-management-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            {fleetToEdit ? 'Edit Fleet' : 'Create New Fleet'}
          </DialogTitle>
          <p id="fleet-management-description" className="sr-only">
            {fleetToEdit ? 'Edit fleet details and configuration' : 'Create a new fleet to organize and manage vessels'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Fleet Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter fleet name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter fleet description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgId">Organization *</Label>
            <Select
              value={formData.orgId || undefined}
              onValueChange={(value) => setFormData(prev => ({ ...prev, orgId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {orgsLoading ? (
                  <SelectItem value="loading" disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading organizations...
                  </SelectItem>
                ) : organizations.length === 0 ? (
                  <SelectItem value="no-orgs" disabled>
                    No organizations available
                  </SelectItem>
                ) : (
                  organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between pt-4">
            <div>
              {fleetToEdit && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Fleet
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {fleetToEdit ? 'Update Fleet' : 'Create Fleet'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FleetManagementDialog;
