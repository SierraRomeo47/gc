import Dashboard from '../Dashboard';
import Navigation from '../Navigation';
import { useState } from 'react';

export default function DashboardExample() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <Dashboard activeTab={activeTab} />
    </div>
  );
}