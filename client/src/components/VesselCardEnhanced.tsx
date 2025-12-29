import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Tag, MoreHorizontal, Star, AlertCircle, CheckCircle2, Users, UserPlus } from "lucide-react";
import type { VesselViewModel } from "@shared/viewModels";
import VesselTypeIcon from "./VesselTypeIcon";
import { UserSettingsService } from "@/lib/userSettings";
import VesselAssignmentDialog from "./VesselAssignmentDialog";

interface VesselCardProps extends VesselViewModel {
  onViewDetails: (vesselId: string) => void;
  userId: string;
  isFavorite?: boolean;
  tags?: string[];
  onToggleFavorite?: (vesselId: string) => void;
  onAddTag?: (vesselId: string, tag: string) => void;
  onRemoveTag?: (vesselId: string, tag: string) => void;
  onAssignToFleet?: (vesselId: string) => void;
}

const VesselCard: React.FC<VesselCardProps> = ({
  id,
  name,
  imoNumber,
  type,
  flag,
  grossTonnage,
  iceClass,
  mainEngineType,
  voyageType,
  complianceStatus,
  ghgIntensity,
  targetIntensity,
  fuelConsumption,
  creditBalance,
  onViewDetails,
  userId,
  isFavorite = false,
  tags = [],
  onToggleFavorite,
  onAddTag,
  onRemoveTag,
  onAssignToFleet,
}) => {
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(id);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && onAddTag) {
      onAddTag(id, newTag.trim());
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (onRemoveTag) {
      onRemoveTag(id, tag);
    }
  };

  const getComplianceBadgeVariant = (status: string) => {
    switch (status) {
      case 'compliant': return 'default';
      case 'warning': return 'secondary';
      case 'non-compliant': return 'destructive';
      default: return 'outline';
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle2 className="h-3 w-3" />;
      case 'warning': return <AlertCircle className="h-3 w-3" />;
      case 'non-compliant': return <AlertCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <VesselTypeIcon vesselType={type} size="md" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold truncate">{name}</CardTitle>
              <p className="text-sm text-muted-foreground font-mono">{imoNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleFavorite}
              className={`p-1 h-8 w-8 ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8 text-gray-400 hover:text-gray-600"
              onClick={() => setShowTagInput(!showTagInput)}
            >
              <Tag className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleRemoveTag(tag)}
            >
              {tag} ×
            </Badge>
          ))}
          {showTagInput && (
            <div className="flex items-center space-x-1">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag..."
                className="text-xs px-2 py-1 border rounded"
                autoFocus
              />
              <Button size="sm" variant="outline" onClick={handleAddTag} className="h-6 px-2">
                Add
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Vessel Details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Type:</span>
            <span className="ml-1 font-medium">{type}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Flag:</span>
            <span className="ml-1 font-medium">{flag}</span>
          </div>
          <div>
            <span className="text-muted-foreground">GT:</span>
            <span className="ml-1 font-medium">{grossTonnage?.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Engine:</span>
            <span className="ml-1 font-medium text-xs">{mainEngineType || 'Diesel'}</span>
          </div>
        </div>

        {/* Special Features */}
        <div className="flex flex-wrap gap-1">
          {iceClass && iceClass !== 'none' && (
            <Badge variant="outline" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              {iceClass}
            </Badge>
          )}
          {mainEngineType?.includes('LNG') && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              LNG Dual-Fuel
            </Badge>
          )}
          {mainEngineType?.includes('Hydrogen') && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
              Hydrogen
            </Badge>
          )}
          {mainEngineType?.includes('Methanol') && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
              Methanol
            </Badge>
          )}
          {mainEngineType?.includes('Electric') && (
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
              Electric
            </Badge>
          )}
          {voyageType === 'omr' && (
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
              OMR Route
            </Badge>
          )}
        </div>

        {/* Compliance Status */}
        <div className="flex items-center justify-between">
          <Badge variant={getComplianceBadgeVariant(complianceStatus)} className="flex items-center gap-1">
            {getComplianceIcon(complianceStatus)}
            {complianceStatus}
          </Badge>
          <div className="text-right">
            <div className="text-sm font-medium">
              {ghgIntensity} / {targetIntensity} gCO2e/MJ
            </div>
            <div className={`text-xs ${creditBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {creditBalance >= 0 ? '+' : ''}{creditBalance.toFixed(1)} credits
            </div>
          </div>
        </div>

        {/* Fuel Consumption */}
        <div className="text-sm">
          <span className="text-muted-foreground">Fuel:</span>
          <span className="ml-1 font-medium">{fuelConsumption.toFixed(1)} MT</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <Button 
            onClick={() => {
              onViewDetails(id);
            }} 
            className="flex-1"
            variant="outline"
          >
            View Details
          </Button>
          
          <Button 
            onClick={() => {
              if (onAssignToFleet) {
                onAssignToFleet(id);
              }
            }} 
            className="flex-1"
            variant="default"
            size="sm"
          >
            <Users className="h-4 w-4 mr-1" />
            Fleet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VesselCard;
