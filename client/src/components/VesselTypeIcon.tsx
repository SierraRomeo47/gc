import React from 'react';
import { Ship, Container, Fuel, Package, Users, Zap } from 'lucide-react';

interface VesselTypeIconProps {
  vesselType?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const VesselTypeIcon: React.FC<VesselTypeIconProps> = ({ 
  vesselType, 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const getIconAndColor = (type: string) => {
    // Handle undefined or null type
    if (!type || typeof type !== 'string') {
      return { 
        icon: Ship, 
        color: 'text-gray-500', 
        bgColor: 'bg-gray-100',
        label: 'Unknown'
      };
    }
    
    const normalizedType = type.toLowerCase();
    
    if (normalizedType.includes('container')) {
      return { 
        icon: Container, 
        color: 'text-gray-500', 
        bgColor: 'bg-gray-100',
        label: ''
      };
    }
    if (normalizedType.includes('tanker')) {
      return { 
        icon: Fuel, 
        color: 'text-gray-500', 
        bgColor: 'bg-gray-100',
        label: ''
      };
    }
    if (normalizedType.includes('bulk')) {
      return { 
        icon: Package, 
        color: 'text-gray-500', 
        bgColor: 'bg-gray-100',
        label: ''
      };
    }
    if (normalizedType.includes('ro-ro') || normalizedType.includes('roro')) {
      return { 
        icon: Users, 
        color: 'text-gray-500', 
        bgColor: 'bg-gray-100',
        label: ''
      };
    }
    if (normalizedType.includes('electric') || normalizedType.includes('battery')) {
      return { 
        icon: Zap, 
        color: 'text-gray-500', 
        bgColor: 'bg-gray-100',
        label: ''
      };
    }
    
    // Default for general cargo and others
    return { 
      icon: Ship, 
      color: 'text-gray-500', 
      bgColor: 'bg-gray-100',
      label: ''
    };
  };

  const { icon: Icon, color, bgColor, label } = getIconAndColor(vesselType);

  return (
    <div className={`inline-flex items-center justify-center rounded-lg ${bgColor} ${className}`}>
      <Icon className={`${sizeClasses[size]} ${color}`} />
    </div>
  );
};

export default VesselTypeIcon;
