import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VesselSelectionProvider } from "@/contexts/VesselSelectionContext";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import { EnvironmentBanner } from "@/components/EnvironmentBanner";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <VesselSelectionProvider>
          <div className="min-h-screen bg-background">
            <EnvironmentBanner />
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
            <Dashboard activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
          <Toaster />
        </VesselSelectionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
