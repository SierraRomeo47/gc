import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Vessel } from '@/lib/api';

interface Fleet {
  id: string;
  name: string;
  description?: string;
  orgId: string;
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  createdAt: string;
}

interface VesselSelectionContextType {
  // Selected vessel state
  selectedVessel: Vessel | null;
  setSelectedVessel: (vessel: Vessel | null) => void;
  
  // Selected fleet state
  selectedFleet: Fleet | null;
  setSelectedFleet: (fleet: Fleet | null) => void;
  
  // Fleet management state
  fleets: Fleet[];
  organizations: Organization[];
  isLoading: boolean;
  error: string | null;
  
  // Fleet operations
  createFleet: (fleetData: Partial<Fleet>) => Promise<Fleet>;
  updateFleet: (id: string, fleetData: Partial<Fleet>) => Promise<Fleet>;
  deleteFleet: (id: string) => Promise<boolean>;
  assignVesselsToFleet: (fleetId: string, vesselIds: string[]) => Promise<any>;
  removeVesselFromFleet: (fleetId: string, vesselId: string) => Promise<boolean>;
  
  // Refresh data
  refreshFleets: () => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

const VesselSelectionContext = createContext<VesselSelectionContextType | undefined>(undefined);

interface VesselSelectionProviderProps {
  children: ReactNode;
}

export const VesselSelectionProvider: React.FC<VesselSelectionProviderProps> = ({ children }) => {
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [selectedFleet, setSelectedFleet] = useState<Fleet | null>(null);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantId = 'dfa5de92-6ab2-47d4-b19c-87c01b692c94'; // Use the seeded tenant ID

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await refreshFleets();
        await refreshOrganizations();
      } catch (error) {
        console.error('Failed to load initial data:', error);
        // Set empty arrays as fallback
        setFleets([]);
        setOrganizations([]);
      }
    };
    
    loadData();
  }, []);

  // Persist selected vessel to localStorage
  useEffect(() => {
    if (selectedVessel) {
      localStorage.setItem('selectedVessel', JSON.stringify(selectedVessel));
    } else {
      localStorage.removeItem('selectedVessel');
    }
  }, [selectedVessel]);

  // Persist selected fleet to localStorage
  useEffect(() => {
    if (selectedFleet) {
      localStorage.setItem('selectedFleet', JSON.stringify(selectedFleet));
    } else {
      localStorage.removeItem('selectedFleet');
    }
  }, [selectedFleet]);

  // Load persisted selections on mount
  useEffect(() => {
    const savedVessel = localStorage.getItem('selectedVessel');
    if (savedVessel) {
      try {
        setSelectedVessel(JSON.parse(savedVessel));
      } catch (error) {
        console.error('Failed to parse saved vessel:', error);
      }
    }

    const savedFleet = localStorage.getItem('selectedFleet');
    if (savedFleet) {
      try {
        setSelectedFleet(JSON.parse(savedFleet));
      } catch (error) {
        console.error('Failed to parse saved fleet:', error);
      }
    }
  }, []);

  const refreshFleets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching fleets from:', 'http://localhost:5000/api/fleets');
      const response = await fetch('http://localhost:5000/api/fleets');
      console.log('Fleets response status:', response.status);
      if (!response.ok) throw new Error('Failed to fetch fleets');
      const data = await response.json();
      console.log('Fleets data received:', data);
      // Handle the specific response format: {success: true, data: [...]}
      const fleetsData = data?.data || data?.fleets || [];
      console.log('Processed fleets data:', fleetsData);
      setFleets(Array.isArray(fleetsData) ? fleetsData : []);
    } catch (err) {
      console.error('Error fetching fleets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch fleets');
      setFleets([]); // Ensure fleets is always an array
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:5000/api/organizations?tenantId=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch organizations');
      const data = await response.json();
      console.log('Organizations data received:', data);
      // Handle both direct array response and wrapped response formats
      const orgsData = Array.isArray(data) ? data : (data?.data || data?.organizations || []);
      console.log('Processed organizations data:', orgsData);
      setOrganizations(Array.isArray(orgsData) ? orgsData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
      console.error('Error fetching organizations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createFleet = async (fleetData: Partial<Fleet>): Promise<Fleet> => {
    try {
      const response = await fetch('http://localhost:5000/api/fleets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...fleetData,
          tenantId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create fleet');
      }

      const newFleet = await response.json();
      setFleets(prev => [...prev, newFleet]);
      return newFleet;
    } catch (err) {
      console.error('Error creating fleet:', err);
      throw err;
    }
  };

  const updateFleet = async (id: string, fleetData: Partial<Fleet>): Promise<Fleet> => {
    try {
      const response = await fetch(`/api/fleets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fleetData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update fleet');
      }

      const updatedFleet = await response.json();
      setFleets(prev => prev.map(fleet => fleet.id === id ? updatedFleet : fleet));
      
      // Update selected fleet if it's the one being updated
      if (selectedFleet?.id === id) {
        setSelectedFleet(updatedFleet);
      }
      
      return updatedFleet;
    } catch (err) {
      console.error('Error updating fleet:', err);
      throw err;
    }
  };

  const deleteFleet = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:5000/api/fleets/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete fleet');
      }

      setFleets(prev => prev.filter(fleet => fleet.id !== id));
      
      // Clear selected fleet if it's the one being deleted
      if (selectedFleet?.id === id) {
        setSelectedFleet(null);
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting fleet:', err);
      throw err;
    }
  };

  const assignVesselsToFleet = async (fleetId: string, vesselIds: string[]): Promise<any> => {
    try {
      const response = await fetch(`http://localhost:5000/api/fleets/${fleetId}/vessels/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vesselIds,
          tenantId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign vessels to fleet');
      }

      return await response.json();
    } catch (err) {
      console.error('Error assigning vessels to fleet:', err);
      throw err;
    }
  };

  const removeVesselFromFleet = async (fleetId: string, vesselId: string): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:5000/api/fleets/${fleetId}/vessels/${vesselId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove vessel from fleet');
      }

      return true;
    } catch (err) {
      console.error('Error removing vessel from fleet:', err);
      throw err;
    }
  };

  const value: VesselSelectionContextType = {
    selectedVessel,
    setSelectedVessel,
    selectedFleet,
    setSelectedFleet,
    fleets: Array.isArray(fleets) ? fleets : [],
    organizations: Array.isArray(organizations) ? organizations : [],
    isLoading,
    error,
    createFleet,
    updateFleet,
    deleteFleet,
    assignVesselsToFleet,
    removeVesselFromFleet,
    refreshFleets,
    refreshOrganizations,
  };

  return (
    <VesselSelectionContext.Provider value={value}>
      {children}
    </VesselSelectionContext.Provider>
  );
};

export const useVesselSelection = (): VesselSelectionContextType => {
  const context = useContext(VesselSelectionContext);
  if (context === undefined) {
    throw new Error('useVesselSelection must be used within a VesselSelectionProvider');
  }
  return context;
};

