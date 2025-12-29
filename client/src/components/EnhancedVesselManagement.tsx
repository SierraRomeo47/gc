import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Ship, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Heart, 
  Tag, 
  Settings, 
  RotateCcw,
  Star,
  X,
  Plus,
  Users,
  Edit
} from "lucide-react";
import VesselAssignmentDialog from './VesselAssignmentDialog';
import VesselDetailsModal from './VesselDetailsModal';
import FuelEUReport from './FuelEUReport';
import EUETSReport from './EUETSReport';
import IMODCSCIIReport from './IMODCSCIIReport';
import { api } from "@/lib/api";
import { UserSettingsService, UserVesselSettings } from "@/lib/userSettings";
import { useVesselSelection } from '@/contexts/VesselSelectionContext';
import VesselCardEnhanced from "./VesselCardEnhanced";
import VesselTypeIcon from "./VesselTypeIcon";
import FleetManagementDialog from "./FleetManagementDialog";
import type { UserViewModel, VesselViewModel } from "@shared/viewModels";

interface EnhancedVesselManagementProps {
  currentUser: UserViewModel;
  onViewDetails?: (vesselOrId: VesselViewModel | string) => void;
  onTabChange?: (tab: string) => void;
}

const EnhancedVesselManagement: React.FC<EnhancedVesselManagementProps> = ({ currentUser, onViewDetails, onTabChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showTaggedOnly, setShowTaggedOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [userSettings, setUserSettings] = useState<UserVesselSettings | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedFleetFilter, setSelectedFleetFilter] = useState<string>('all');
  const [selectedVesselForAssignment, setSelectedVesselForAssignment] = useState<string | null>(null);
  const [isVesselAssignmentDialogOpen, setIsVesselAssignmentDialogOpen] = useState(false);
  const [selectedVesselForDetails, setSelectedVesselForDetails] = useState<VesselViewModel | null>(null);
  const [isVesselDetailsModalOpen, setIsVesselDetailsModalOpen] = useState(false);

  // Use vessel selection context
  const vesselSelectionContext = useVesselSelection();
  const { 
    selectedVessel, 
    setSelectedVessel, 
    selectedFleet, 
    setSelectedFleet,
    fleets,
    organizations,
    isLoading: contextLoading 
  } = vesselSelectionContext || {};

  // Fetch vessels - MOVED BEFORE conditional return to fix hooks rule violation
  const { data: allVessels = [], isLoading } = useQuery({
    queryKey: ['vessels', 'all'],
    queryFn: () => api.vessels.getAll(),
  });

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Additional state hooks - MOVED BEFORE conditional return to fix hooks rule violation
  const [allTags, setAllTags] = useState<string[]>([]);

  // Load user settings and tags - MOVED BEFORE conditional return to fix hooks rule violation
  useEffect(() => {
    const loadSettings = async () => {
      if (currentUser?.id) {
        const settings = await UserSettingsService.getUserSettings(currentUser.id);
        setUserSettings(settings);
        setSearchTerm('');
        
        const tags = await UserSettingsService.getAllTags(currentUser.id);
        setAllTags(tags);
      }
    };
    loadSettings();
  }, [currentUser?.id]);

  // Get unique values for filters - MOVED BEFORE conditional return to fix hooks rule violation
  const uniqueValues = useMemo(() => {
    const types = Array.from(new Set(allVessels.map(v => v.type)));
    const flags = Array.from(new Set(allVessels.map(v => v.flag)));
    const complianceStatuses = Array.from(new Set(allVessels.map(v => v.complianceStatus)));
    const engineTypes = Array.from(new Set(allVessels.map(v => v.mainEngineType).filter(Boolean)));
    const iceClasses = Array.from(new Set(allVessels.map(v => v.iceClass).filter(Boolean)));
    
    return { types, flags, complianceStatuses, engineTypes, iceClasses };
  }, [allVessels]);

  // Filter and sort vessels - MOVED BEFORE conditional return to fix hooks rule violation
  const filteredVessels = useMemo(() => {
    if (!userSettings) return allVessels;

    let filtered = allVessels;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(vessel =>
        vessel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vessel.imoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vessel.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vessel.flag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(vessel => userSettings.favorites.includes(vessel.id));
    }

    // Tagged filter
    if (showTaggedOnly) {
      filtered = filtered.filter(vessel => 
        userSettings.tags[vessel.id] && userSettings.tags[vessel.id].length > 0
      );
    }

    // Tag filter
    if (selectedTag !== 'all') {
      filtered = filtered.filter(vessel => 
        userSettings.tags[vessel.id]?.includes(selectedTag)
      );
    }

    // Advanced filters
    if (userSettings.filters.vesselType.length > 0) {
      filtered = filtered.filter(vessel => 
        userSettings.filters.vesselType.includes(vessel.type)
      );
    }
    if (userSettings.filters.flag.length > 0) {
      filtered = filtered.filter(vessel => 
        userSettings.filters.flag.includes(vessel.flag)
      );
    }
    if (userSettings.filters.complianceStatus.length > 0) {
      filtered = filtered.filter(vessel => 
        userSettings.filters.complianceStatus.includes(vessel.complianceStatus)
      );
    }
    if (userSettings.filters.engineType.length > 0) {
      filtered = filtered.filter(vessel => 
        userSettings.filters.engineType.includes(vessel.mainEngineType || 'Diesel')
      );
    }
    if (userSettings.filters.iceClass.length > 0) {
      filtered = filtered.filter(vessel => 
        userSettings.filters.iceClass.includes(vessel.iceClass || 'none')
      );
    }

    // Fleet filter
    if (selectedFleetFilter !== 'all') {
      if (selectedFleetFilter === 'unassigned') {
        filtered = filtered.filter(vessel => !vessel.fleetId);
      } else {
        filtered = filtered.filter(vessel => vessel.fleetId === selectedFleetFilter);
      }
    }

    // Sort vessels
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (userSettings.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'imo':
          aValue = a.imoNumber;
          bValue = b.imoNumber;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'flag':
          aValue = a.flag;
          bValue = b.flag;
          break;
        case 'compliance':
          const complianceOrder = { 'compliant': 0, 'warning': 1, 'non-compliant': 2 };
          aValue = complianceOrder[a.complianceStatus];
          bValue = complianceOrder[b.complianceStatus];
          break;
        case 'ghgIntensity':
          aValue = a.ghgIntensity;
          bValue = b.ghgIntensity;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (userSettings.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [allVessels, userSettings, searchTerm, showFavoritesOnly, showTaggedOnly, selectedTag, selectedFleetFilter]);

  // Ensure fleets is always an array
  const safeFleets = Array.isArray(fleets) ? fleets : [];
  const safeOrganizations = Array.isArray(organizations) ? organizations : [];

  // Synchronize selectedFleet with selectedFleetFilter on initial load and when fleets change
  useEffect(() => {
    if (selectedFleetFilter && selectedFleetFilter !== 'all' && selectedFleetFilter !== 'unassigned') {
      const fleet = safeFleets.find(f => f.id === selectedFleetFilter);
      if (fleet && (!selectedFleet || selectedFleet.id !== fleet.id)) {
        console.log('Synchronizing selectedFleet on load:', fleet);
        setSelectedFleet(fleet);
      }
    } else if (selectedFleetFilter === 'all' || selectedFleetFilter === 'unassigned') {
      if (selectedFleet !== null) {
        console.log('Clearing selectedFleet for all/unassigned');
        setSelectedFleet(null);
      }
    }
  }, [selectedFleetFilter, safeFleets, selectedFleet]);

  // Show loading state while context is initializing
  if (!vesselSelectionContext || contextLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading vessel management data...</p>
        </div>
      </div>
    );
  }

  // Debug logging - now after isLoading is defined
  console.log('EnhancedVesselManagement render:', {
    fleets: safeFleets,
    organizations: safeOrganizations,
    fleetsIsArray: Array.isArray(safeFleets),
    fleetsLength: safeFleets.length,
    contextLoading,
    isLoading,
    selectedFleetFilter,
    selectedFleet: selectedFleet,
    selectedFleetId: selectedFleet?.id,
    selectedFleetName: selectedFleet?.name
  });

  // Handle fleet creation - invalidate cache to refresh fleet lists
  const handleFleetCreated = async (newFleet: any) => {
    console.log('Fleet created:', newFleet);
    // Invalidate fleet queries to refresh all fleet lists
    queryClient.invalidateQueries({ queryKey: ['fleets'] });
    queryClient.invalidateQueries({ queryKey: ['fleets', 'all'] });
    
    // Also refresh the context fleet data
    if (vesselSelectionContext?.refreshFleets) {
      await vesselSelectionContext.refreshFleets();
    }
  };

  // Handle vessel selection
  const handleVesselSelect = (vessel: VesselViewModel) => {
    setSelectedVessel(vessel);
    setSelectedVesselForDetails(vessel);
    setIsVesselDetailsModalOpen(true);
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (vesselId: string) => {
    if (!userSettings) return;
    
    const newIsFavorite = await UserSettingsService.toggleFavorite(userSettings.userId, vesselId);
    const updatedSettings = await UserSettingsService.getUserSettings(userSettings.userId);
    setUserSettings(updatedSettings);
  };

  // Handle tag operations
  const handleAddTag = async (vesselId: string, tag: string) => {
    if (!userSettings) return;
    
    await UserSettingsService.addTag(userSettings.userId, vesselId, tag);
    const updatedSettings = await UserSettingsService.getUserSettings(userSettings.userId);
    setUserSettings(updatedSettings);
    
    // Refresh tags list
    const tags = await UserSettingsService.getAllTags(userSettings.userId);
    setAllTags(tags);
  };

  const handleRemoveTag = async (vesselId: string, tag: string) => {
    if (!userSettings) return;
    
    await UserSettingsService.removeTag(userSettings.userId, vesselId, tag);
    const updatedSettings = await UserSettingsService.getUserSettings(userSettings.userId);
    setUserSettings(updatedSettings);
    
    // Refresh tags list
    const tags = await UserSettingsService.getAllTags(userSettings.userId);
    setAllTags(tags);
  };

  // Handle view mode change
  const handleViewModeChange = async (mode: 'tiles' | 'list') => {
    if (!userSettings) return;
    
    await UserSettingsService.setViewMode(userSettings.userId, mode);
    const updatedSettings = await UserSettingsService.getUserSettings(userSettings.userId);
    setUserSettings(updatedSettings);
  };

  // Handle search
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim() && userSettings) {
      await UserSettingsService.addToSearchHistory(userSettings.userId, term);
    }
  };

  // Handle filter changes
  const handleFilterChange = async (filterType: keyof UserVesselSettings['filters'], value: string, checked: boolean) => {
    if (!userSettings) return;
    
    const currentFilters = userSettings.filters[filterType];
    const newFilters = checked 
      ? [...currentFilters, value]
      : currentFilters.filter(f => f !== value);
    
    await UserSettingsService.setFilters(userSettings.userId, { [filterType]: newFilters });
    const updatedSettings = await UserSettingsService.getUserSettings(userSettings.userId);
    setUserSettings(updatedSettings);
  };

  // Handle sort change
  const handleSortChange = async (sortBy: UserVesselSettings['sortBy']) => {
    if (!userSettings) return;
    
    const newSortOrder = userSettings.sortBy === sortBy && userSettings.sortOrder === 'asc' ? 'desc' : 'asc';
    await UserSettingsService.setSortOptions(userSettings.userId, sortBy, newSortOrder);
    const updatedSettings = await UserSettingsService.getUserSettings(userSettings.userId);
    setUserSettings(updatedSettings);
  };

  // Reset settings
  const handleResetSettings = async () => {
    if (!userSettings) return;
    
    await UserSettingsService.resetSettings(userSettings.userId);
    const updatedSettings = await UserSettingsService.getUserSettings(userSettings.userId);
    setUserSettings(updatedSettings);
    setSearchTerm('');
    setShowFavoritesOnly(false);
    setShowTaggedOnly(false);
    setSelectedTag('all');
    
    // Refresh tags list
    const tags = await UserSettingsService.getAllTags(userSettings.userId);
    setAllTags(tags);
  };

  if (!userSettings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Vessel Management</h2>
          <p className="text-muted-foreground">
            Manage vessels with favorites, tags, and personalized views
          </p>
        </div>
        <div className="flex gap-2">
          <FleetManagementDialog onFleetCreated={handleFleetCreated} />
          <VesselAssignmentDialog 
            fleet={selectedFleet}
            trigger={
              <Button variant="outline" disabled={!selectedFleet}>
                <Users className="h-4 w-4 mr-2" />
                Manage Fleet Vessels
              </Button>
            }
          />
          
          {/* Individual Vessel Assignment Dialog */}
          {selectedVesselForAssignment && (
            <VesselAssignmentDialog 
              vesselId={selectedVesselForAssignment}
              trigger={<div />}
              open={isVesselAssignmentDialogOpen}
              onOpenChange={setIsVesselAssignmentDialogOpen}
            />
          )}
          <Button variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" onClick={handleResetSettings}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="vessels" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vessels">Vessel Management</TabsTrigger>
          <TabsTrigger value="fuel-eu">FuelEU Maritime</TabsTrigger>
          <TabsTrigger value="eu-ets">EU ETS</TabsTrigger>
          <TabsTrigger value="imo-cii">IMO DCS CII</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vessels" className="space-y-6">
          {/* Existing vessel management content */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vessels..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="fleet-filter" className="text-sm font-medium">Fleet:</Label>
                <Select value={selectedFleetFilter} onValueChange={(value) => {
                  console.log('Fleet dropdown changed:', { value, safeFleets });
                  setSelectedFleetFilter(value);
                  // Synchronize with context selectedFleet for "Manage Fleet Vessels" button
                  if (value === 'all' || value === 'unassigned') {
                    console.log('Setting selectedFleet to null');
                    setSelectedFleet(null);
                  } else {
                    const fleet = safeFleets.find(f => f.id === value);
                    console.log('Found fleet:', fleet);
                    setSelectedFleet(fleet || null);
                  }
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Fleets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Fleets</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {safeFleets.map(fleet => (
                      <SelectItem key={fleet.id} value={fleet.id}>
                        {fleet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Heart className="h-4 w-4 mr-1" />
                Favorites ({userSettings.favorites.length})
              </Button>
              <Button
                variant={showTaggedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowTaggedOnly(!showTaggedOnly)}
              >
                <Tag className="h-4 w-4 mr-1" />
                Tagged
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={userSettings.viewMode === 'tiles' ? "default" : "outline"}
                size="sm"
                onClick={() => handleViewModeChange('tiles')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={userSettings.viewMode === 'list' ? "default" : "outline"}
                size="sm"
                onClick={() => handleViewModeChange('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Advanced Filters & Sorting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div>
                <Label>Filter by Tag</Label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {allTags.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Sort Options */}
            <div className="flex gap-4">
              <div>
                <Label>Sort by</Label>
                <Select value={userSettings.sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="imo">IMO Number</SelectItem>
                    <SelectItem value="type">Vessel Type</SelectItem>
                    <SelectItem value="flag">Flag State</SelectItem>
                    <SelectItem value="compliance">Compliance Status</SelectItem>
                    <SelectItem value="ghgIntensity">GHG Intensity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Order</Label>
                <Select 
                  value={userSettings.sortOrder} 
                  onValueChange={(order) => handleSortChange(userSettings.sortBy)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Options */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <Label>Vessel Types</Label>
                <div className="space-y-2 mt-2">
                  {uniqueValues.types.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <Switch
                        checked={userSettings.filters.vesselType.includes(type)}
                        onCheckedChange={(checked) => handleFilterChange('vesselType', type, checked)}
                      />
                      <Label className="text-sm">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Flag States</Label>
                <div className="space-y-2 mt-2">
                  {uniqueValues.flags.map(flag => (
                    <div key={flag} className="flex items-center space-x-2">
                      <Switch
                        checked={userSettings.filters.flag.includes(flag)}
                        onCheckedChange={(checked) => handleFilterChange('flag', flag, checked)}
                      />
                      <Label className="text-sm">{flag}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Compliance Status</Label>
                <div className="space-y-2 mt-2">
                  {uniqueValues.complianceStatuses.map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Switch
                        checked={userSettings.filters.complianceStatus.includes(status)}
                        onCheckedChange={(checked) => handleFilterChange('complianceStatus', status, checked)}
                      />
                      <Label className="text-sm">{status}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Engine Types</Label>
                <div className="space-y-2 mt-2">
                  {uniqueValues.engineTypes.map(engine => (
                    <div key={engine} className="flex items-center space-x-2">
                      <Switch
                        checked={userSettings.filters.engineType.includes(engine || '')}
                        onCheckedChange={(checked) => handleFilterChange('engineType', engine || '', checked)}
                      />
                      <Label className="text-sm">{engine}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Ice Classes</Label>
                <div className="space-y-2 mt-2">
                  {uniqueValues.iceClasses.map(iceClass => (
                    <div key={iceClass} className="flex items-center space-x-2">
                      <Switch
                        checked={userSettings.filters.iceClass.includes(iceClass || '')}
                        onCheckedChange={(checked) => handleFilterChange('iceClass', iceClass || '', checked)}
                      />
                      <Label className="text-sm">{iceClass}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">
            {filteredVessels.length} vessels found
            {searchTerm && ` for "${searchTerm}"`}
            {showFavoritesOnly && ' (favorites only)'}
            {showTaggedOnly && ' (tagged only)'}
          </h3>
        </div>
        <div className="flex gap-2">
          {userSettings.favorites.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {userSettings.favorites.length} favorites
            </Badge>
          )}
          {allTags.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {allTags.length} tags
            </Badge>
          )}
        </div>
      </div>

      {/* Vessels Display */}
      {userSettings.viewMode === 'tiles' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVessels.map((vessel) => (
            <VesselCardEnhanced
              key={vessel.id}
              {...vessel}
              userId={userSettings.userId}
              isFavorite={userSettings.favorites.includes(vessel.id)}
              tags={userSettings.tags[vessel.id] || []}
              onViewDetails={(vesselId) => {
                const vessel = filteredVessels.find(v => v.id === vesselId);
                if (vessel) {
                  handleVesselSelect(vessel);
                }
              }}
              onToggleFavorite={handleToggleFavorite}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onAssignToFleet={(vesselId) => {
                setSelectedVesselForAssignment(vesselId);
                setIsVesselAssignmentDialogOpen(true);
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {filteredVessels.map((vessel) => (
                <div key={vessel.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center space-x-4">
                    <VesselTypeIcon vesselType={vessel.type} size="md" />
                    <div>
                      <h4 className="font-semibold">{vessel.name}</h4>
                      <p className="text-sm text-muted-foreground">{vessel.imoNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{vessel.type}</p>
                      <p className="text-xs text-muted-foreground">{vessel.flag}</p>
                    </div>
                    <Badge variant={vessel.complianceStatus === 'compliant' ? 'default' : vessel.complianceStatus === 'warning' ? 'secondary' : 'destructive'}>
                      {vessel.complianceStatus}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFavorite(vessel.id)}
                      className={userSettings.favorites.includes(vessel.id) ? 'text-red-500' : 'text-gray-400'}
                    >
                      <Heart className={`h-4 w-4 ${userSettings.favorites.includes(vessel.id) ? 'fill-current' : ''}`} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const foundVessel = filteredVessels.find(v => v.id === vessel.id);
                        if (foundVessel) {
                          handleVesselSelect(foundVessel);
                        }
                      }}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => {
                        setSelectedVesselForAssignment(vessel.id);
                        setIsVesselAssignmentDialogOpen(true);
                      }}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Fleet
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredVessels.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No vessels found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </CardContent>
        </Card>
      )}

        </TabsContent>
        
        <TabsContent value="fuel-eu" className="space-y-6">
          <FuelEUReport selectedFleetId={selectedFleetFilter !== 'all' ? selectedFleetFilter : undefined} />
        </TabsContent>
        
        <TabsContent value="eu-ets" className="space-y-6">
          <EUETSReport selectedFleetId={selectedFleetFilter !== 'all' ? selectedFleetFilter : undefined} />
        </TabsContent>
        
        <TabsContent value="imo-cii" className="space-y-6">
          <IMODCSCIIReport selectedFleetId={selectedFleetFilter !== 'all' ? selectedFleetFilter : undefined} />
        </TabsContent>
      </Tabs>

      {/* Vessel Details Modal */}
      <VesselDetailsModal
        vessel={selectedVesselForDetails}
        isOpen={isVesselDetailsModalOpen}
        onClose={() => {
          setIsVesselDetailsModalOpen(false);
          setSelectedVesselForDetails(null);
        }}
        onViewInCompliance={(vessel: VesselViewModel) => {
          console.log('View in compliance:', vessel);
          // Close the modal and navigate to compliance page
          setIsVesselDetailsModalOpen(false);
          setSelectedVesselForDetails(null);
          if (onTabChange) {
            onTabChange('compliance');
          } else {
            alert(`Navigate to compliance page for vessel: ${vessel.name}`);
          }
        }}
        onViewInCalculator={(vessel: VesselViewModel) => {
          console.log('View in calculator:', vessel);
          // Close the modal and navigate to calculator page
          setIsVesselDetailsModalOpen(false);
          setSelectedVesselForDetails(null);
          if (onTabChange) {
            onTabChange('calculator');
          } else {
            alert(`Navigate to calculator page for vessel: ${vessel.name}`);
          }
        }}
        onViewVesselDetails={(vessel: VesselViewModel) => {
          console.log('View vessel details:', vessel);
          // Close the modal and navigate to vessel details page
          setIsVesselDetailsModalOpen(false);
          setSelectedVesselForDetails(null);
          if (onTabChange) {
            onTabChange('vessel-details');
          } else {
            alert(`Navigate to vessel details page for vessel: ${vessel.name}`);
          }
        }}
      />
    </div>
  );
};

export default EnhancedVesselManagement;
