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
import { UserPlus, Users, Settings, Eye, Shield, Edit, Trash2, EyeOff, Ship, Users as UsersIcon } from "lucide-react";
import { UserRole, SubscriptionTier, Permission, hasPermission, ROLE_DISPLAY_NAMES, SUBSCRIPTION_DISPLAY_NAMES, getAllRoles } from "@/lib/userRoles";
import { api } from "@/lib/api";
import type { UserViewModel } from "@shared/viewModels";
import UserPreferences from "./UserPreferences";
import FleetVesselSelector from "./FleetVesselSelector";

interface UserManagementProps {
  currentUser: UserViewModel; // Current logged-in user
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserViewModel | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: UserRole.EMISSION_ANALYST,
    subscriptionTier: SubscriptionTier.PROFESSIONAL,
    fleetIds: [] as string[],
    vesselIds: [] as string[]
  });

  const [selectedUserFleetIds, setSelectedUserFleetIds] = useState<string[]>([]);
  const [selectedUserVesselIds, setSelectedUserVesselIds] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(),
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: Partial<UserViewModel>) => api.users.create(userData),
    onSuccess: () => {
      console.log('✅ User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateDialogOpen(false);
      setNewUser({ 
        username: '', 
        email: '', 
        password: '', 
        role: UserRole.EMISSION_ANALYST, 
        subscriptionTier: SubscriptionTier.PROFESSIONAL, 
        fleetIds: [], 
        vesselIds: [] 
      });
    },
    onError: (error: any) => {
      console.error('❌ Failed to create user:', error);
      
      // Extract the actual error message from the backend response
      let errorMessage = 'Unknown error';
      
      // Check if it's an Error object with message
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.data?.error) {
        errorMessage = error.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Show user-friendly error message
      alert(`Failed to create user: ${errorMessage}`);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<UserViewModel> }) => api.users.update(id, data),
    onSuccess: () => {
      console.log('✅ User basic info updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      console.error('❌ Failed to update user basic info:', error);
    },
  });

  // Grant fleet access mutation
  const grantFleetAccessMutation = useMutation({
    mutationFn: ({ userId, fleetId }: { userId: string, fleetId: string }) => {
      console.log('grantFleetAccessMutation called with:', { userId, fleetId });
      return fetch(`/api/users/${userId}/fleets/${fleetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresAt: null })
      }).then(res => {
        console.log('Fleet access response:', res.status, res.statusText);
        return res.json();
      });
    },
  });

  // Grant vessel access mutation
  const grantVesselAccessMutation = useMutation({
    mutationFn: ({ userId, vesselId }: { userId: string, vesselId: string }) => {
      console.log('grantVesselAccessMutation called with:', { userId, vesselId });
      return fetch(`/api/users/${userId}/vessels/${vesselId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresAt: null })
      }).then(res => {
        console.log('Vessel access response:', res.status, res.statusText);
        return res.json();
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => {
      console.log('Mutation function called with ID:', id);
      return api.users.delete(id);
    },
    onSuccess: (data, variables) => {
      console.log('Delete mutation successful for ID:', variables);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error, variables) => {
      console.error('Delete mutation failed for ID:', variables, error);
    },
  });

  const handleCreateUser = () => {
    createUserMutation.mutate(newUser);
  };

  const handleUpdateUser = async () => {
    try {
      console.log('🚀 handleUpdateUser called!');
      console.log('🚀 selectedUser:', selectedUser);
      console.log('🚀 selectedUserFleetIds:', selectedUserFleetIds);
      console.log('🚀 selectedUserVesselIds:', selectedUserVesselIds);
      
      if (!selectedUser) {
        console.log('❌ No selectedUser, returning');
        return;
      }

      console.log('Selected user:', selectedUser.id);
      console.log('Selected fleet IDs:', selectedUserFleetIds);
      console.log('Selected vessel IDs:', selectedUserVesselIds);

      // First, update the basic user information
      console.log('Updating basic user information...');
      await updateUserMutation.mutateAsync({ id: selectedUser.id, data: selectedUser });
      console.log('✅ Basic user information updated successfully');
      
      // Then, update fleet access
      console.log('Saving fleet access:', selectedUserFleetIds);
      for (const fleetId of selectedUserFleetIds) {
        try {
          console.log(`Granting fleet access for fleet ${fleetId}...`);
          const result = await grantFleetAccessMutation.mutateAsync({ userId: selectedUser.id, fleetId });
          console.log(`✅ Fleet access granted successfully for ${fleetId}:`, result);
        } catch (error) {
          console.error(`❌ Failed to grant fleet access for fleet ${fleetId}:`, error);
        }
      }
      
      // Then, update vessel access  
      console.log('Saving vessel access:', selectedUserVesselIds);
      for (const vesselId of selectedUserVesselIds) {
        try {
          console.log(`Granting vessel access for vessel ${vesselId}...`);
          const result = await grantVesselAccessMutation.mutateAsync({ userId: selectedUser.id, vesselId });
          console.log(`✅ Vessel access granted successfully for ${vesselId}:`, result);
        } catch (error) {
          console.error(`❌ Failed to grant vessel access for vessel ${vesselId}:`, error);
        }
      }
      
      // Invalidate queries to refresh the data
      console.log('Invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', selectedUser.id, 'access'] });
      
      // Close the dialog
      console.log('Closing dialog...');
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      console.log('✅ Update completed successfully!');
    } catch (error) {
      console.error('❌ Failed to update user:', error);
      // Don't close dialog on error so user can see what went wrong
    }
  };

  const handleDeleteUser = (userId: string) => {
    console.log('Delete user requested for ID:', userId);
    if (confirm('Are you sure you want to delete this user?')) {
      console.log('User confirmed deletion, calling mutation...');
      deleteUserMutation.mutate(userId);
    } else {
      console.log('User cancelled deletion');
    }
  };

  const handleEditUser = async (user: any) => {
    console.log('🔍 handleEditUser called with user:', user);
    console.log('🔍 user.fleetIds:', user.fleetIds);
    console.log('🔍 user.vesselIds:', user.vesselIds);
    
    try {
      // Load user's current access permissions
      console.log('🔍 Loading user access permissions...');
      const [fleetAccess, vesselAccess] = await Promise.all([
        fetch(`/api/users/${user.id}/fleets`).then(res => res.json()),
        fetch(`/api/users/${user.id}/vessels`).then(res => res.json())
      ]);
      
      console.log('🔍 Fleet access loaded:', fleetAccess);
      console.log('🔍 Vessel access loaded:', vesselAccess);
      
      // Extract IDs from the access arrays
      const currentFleetIds = Array.isArray(fleetAccess) ? fleetAccess.map(f => f.id) : [];
      const currentVesselIds = Array.isArray(vesselAccess) ? vesselAccess.map(v => v.id) : [];
      
      console.log('🔍 Current fleet IDs:', currentFleetIds);
      console.log('🔍 Current vessel IDs:', currentVesselIds);
      
      // Set the user data with current access permissions
      setSelectedUser({ ...user, fleetIds: currentFleetIds, vesselIds: currentVesselIds });
      setSelectedUserFleetIds(currentFleetIds);
      setSelectedUserVesselIds(currentVesselIds);
      setIsEditDialogOpen(true);
      
      console.log('✅ User edit modal opened with current access permissions');
    } catch (error) {
      console.error('❌ Failed to load user access permissions:', error);
      // Fallback to empty arrays if loading fails
      setSelectedUser({ ...user, fleetIds: [], vesselIds: [] });
      setSelectedUserFleetIds([]);
      setSelectedUserVesselIds([]);
      setIsEditDialogOpen(true);
    }
  };

  const handleFleetChange = (fleetIds: string[]) => {
    console.log('handleFleetChange called with:', fleetIds);
    setSelectedUserFleetIds(fleetIds);
    if (selectedUser) {
      setSelectedUser({ ...selectedUser, fleetIds });
    }
  };

  const handleVesselChange = (vesselIds: string[]) => {
    console.log('handleVesselChange called with:', vesselIds);
    setSelectedUserVesselIds(vesselIds);
    if (selectedUser) {
      setSelectedUser({ ...selectedUser, vesselIds });
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'destructive';
      case UserRole.FLEET_MANAGER: return 'default';
      case UserRole.COMMERCIAL_MANAGER: return 'secondary';
      case UserRole.EMISSION_ANALYST: return 'outline';
      case UserRole.TECH_SUPERINTENDENT: return 'outline';
      case UserRole.OPERATIONS_MANAGER: return 'secondary';
      case UserRole.COMPLIANCE_OFFICER: return 'outline';
      default: return 'outline';
    }
  };

  const getSubscriptionBadgeVariant = (tier: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.PREMIUM: return 'default';
      case SubscriptionTier.ENTERPRISE: return 'secondary';
      case SubscriptionTier.PROFESSIONAL: return 'outline';
      case SubscriptionTier.BASIC: return 'outline';
      default: return 'outline';
    }
  };

  // Check if current user can manage users
  const canManageUsers = hasPermission(currentUser, Permission.MANAGE_ROLES);

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to manage users.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="preferences">User Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Add User Button */}
          <div className="flex justify-end">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" aria-describedby="create-user-description">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <p id="create-user-description" className="sr-only">
                Create a new user account with role-based access permissions
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value as UserRole })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(UserRole).map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_DISPLAY_NAMES[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subscription">Subscription Tier</Label>
                <Select value={newUser.subscriptionTier} onValueChange={(value) => setNewUser({ ...newUser, subscriptionTier: value as SubscriptionTier })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SubscriptionTier).map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {SUBSCRIPTION_DISPLAY_NAMES[tier]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateUser} className="flex-1" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {ROLE_DISPLAY_NAMES[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSubscriptionBadgeVariant(user.subscriptionTier)}>
                      {SUBSCRIPTION_DISPLAY_NAMES[user.subscriptionTier]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.isActive ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-red-600" />
                      )}
                      <span className={user.isActive ? 'text-green-600' : 'text-red-600'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === currentUser.id}
                      >
                        <Trash2 className="h-3 w-3" />
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

        <TabsContent value="preferences" className="space-y-6">
          <UserPreferences userId={currentUser.id} />
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-user-description">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <p id="edit-user-description" className="sr-only">
              Edit user account details, permissions, and access settings
            </p>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Basic User Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <Select value={selectedUser.role} onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value as UserRole })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UserRole).map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_DISPLAY_NAMES[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-subscription">Subscription Tier</Label>
                  <Select value={selectedUser.subscriptionTier} onValueChange={(value) => setSelectedUser({ ...selectedUser, subscriptionTier: value as SubscriptionTier })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SubscriptionTier).map((tier) => (
                        <SelectItem key={tier} value={tier}>
                          {SUBSCRIPTION_DISPLAY_NAMES[tier]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={selectedUser.isActive}
                  onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, isActive: checked })}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>

              {/* Fleet and Vessel Access */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Ship className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Fleet & Vessel Access</h3>
                </div>
                <FleetVesselSelector
                  userId={selectedUser.id}
                  currentFleetIds={selectedUserFleetIds}
                  currentVesselIds={selectedUserVesselIds}
                  onFleetChange={handleFleetChange}
                  onVesselChange={handleVesselChange}
                />
                {/* Debug info */}
                <div className="text-xs text-gray-500 mt-2">
                  Debug: selectedUserFleetIds = {JSON.stringify(selectedUserFleetIds)}
                  <br />
                  Debug: selectedUserVesselIds = {JSON.stringify(selectedUserVesselIds)}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => {
                  console.log('🔴 Update User button clicked!');
                  console.log('🔴 Button is not disabled, proceeding...');
                  console.log('🔴 updateUserMutation.isPending:', updateUserMutation.isPending);
                  console.log('🔴 selectedUser:', selectedUser);
                  console.log('🔴 About to call handleUpdateUser');
                  try {
                    handleUpdateUser().catch(error => {
                      console.error('🔴 Error in handleUpdateUser:', error);
                    });
                  } catch (error) {
                    console.error('🔴 Error calling handleUpdateUser:', error);
                  }
                }} className="flex-1" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
