import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import CurrencySelector from "./CurrencySelector";
import { UserSettingsService, UserVesselSettings } from "@/lib/userSettings";
import { Settings, Palette, Search } from "lucide-react";

interface UserPreferencesProps {
  userId: string;
  onPreferencesChange?: (preferences: UserVesselSettings) => void;
}

const UserPreferences: React.FC<UserPreferencesProps> = ({ userId, onPreferencesChange }) => {
  const [preferences, setPreferences] = useState<UserVesselSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const userPreferences = await UserSettingsService.getUserSettings(userId);
        setPreferences(userPreferences);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load user preferences:', error);
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  const handlePreferenceChange = async (key: keyof UserVesselSettings, value: any) => {
    if (!preferences) return;

    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);

    try {
      await UserSettingsService.saveUserSettings(updatedPreferences);
      onPreferencesChange?.(updatedPreferences);
    } catch (error) {
      console.error('Failed to save preference:', error);
    }
  };

  const handleCurrencyChange = async (currency: 'EUR' | 'USD' | 'GBP') => {
    await UserSettingsService.setCurrency(userId, currency);
    handlePreferenceChange('currency', currency);
  };

  const handleLanguageChange = async (language: 'en' | 'es' | 'fr' | 'de') => {
    await UserSettingsService.setLanguage(userId, language);
    handlePreferenceChange('language', language);
  };

  const handleTimezoneChange = async (timezone: string) => {
    await UserSettingsService.setTimezone(userId, timezone);
    handlePreferenceChange('timezone', timezone);
  };

  const handleViewModeChange = async (viewMode: 'tiles' | 'list') => {
    await UserSettingsService.setViewMode(userId, viewMode);
    handlePreferenceChange('viewMode', viewMode);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading preferences...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load preferences</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CurrencySelector
              value={preferences.currency}
              onValueChange={handleCurrencyChange}
              label="Currency"
            />

            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={preferences.language} onValueChange={handleLanguageChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={preferences.timezone} onValueChange={handleTimezoneChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                  <SelectItem value="America/New_York">New York (EST)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Los Angeles (PST)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Display Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="viewMode">Default View Mode</Label>
            <Select value={preferences.viewMode} onValueChange={handleViewModeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiles">Tiles View</SelectItem>
                <SelectItem value="list">List View</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vessel Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Vessel Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sortBy">Default Sort By</Label>
              <Select 
                value={preferences.sortBy} 
                onValueChange={(value) => handlePreferenceChange('sortBy', value)}
              >
                <SelectTrigger>
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
              <Label htmlFor="sortOrder">Default Sort Order</Label>
              <Select 
                value={preferences.sortOrder} 
                onValueChange={(value) => handlePreferenceChange('sortOrder', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>User Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{preferences.favorites.length}</div>
              <div className="text-sm text-muted-foreground">Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Object.keys(preferences.tags).length}
              </div>
              <div className="text-sm text-muted-foreground">Tagged Vessels</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{preferences.searchHistory.length}</div>
              <div className="text-sm text-muted-foreground">Search History</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Object.values(preferences.tags).flat().length}
              </div>
              <div className="text-sm text-muted-foreground">Total Tags</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPreferences;
