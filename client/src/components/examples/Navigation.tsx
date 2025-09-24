import Navigation from '../Navigation';
import { useState } from 'react';

export default function NavigationExample() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Active Tab: {activeTab}</h2>
          <p className="text-muted-foreground">Click on different navigation items to see the active tab change.</p>
        </div>
      </div>
    </div>
  );
}