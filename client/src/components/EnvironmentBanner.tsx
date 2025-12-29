import { useEffect, useState } from 'react';
import { AlertCircle, Settings, FlaskConical } from 'lucide-react';

interface EnvironmentInfo {
  mode: string;
  database: string;
  isProduction: boolean;
}

export function EnvironmentBanner() {
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fetch environment info from backend
    fetch('/api/environment')
      .then((res) => res.json())
      .then((data) => setEnvInfo(data))
      .catch((err) => console.error('Failed to fetch environment info:', err));
  }, []);

  if (!envInfo || !isVisible) {
    return null;
  }

  // Don't show banner if explicitly hidden
  if (envInfo.mode === 'production' && typeof window !== 'undefined') {
    const hideProductionBanner = localStorage.getItem('hideProductionBanner');
    if (hideProductionBanner === 'true') {
      return null;
    }
  }

  const getBannerConfig = () => {
    switch (envInfo.mode) {
      case 'production':
        return {
          bg: 'bg-red-600',
          border: 'border-red-700',
          text: 'text-white',
          icon: AlertCircle,
          label: '⚠️ PRODUCTION MODE',
          description: `Connected to: ${envInfo.database}`,
          showClose: false,
        };
      case 'test':
        return {
          bg: 'bg-yellow-500',
          border: 'border-yellow-600',
          text: 'text-gray-900',
          icon: FlaskConical,
          label: '🧪 TEST MODE',
          description: `Connected to: ${envInfo.database}`,
          showClose: true,
        };
      default: // development
        return {
          bg: 'bg-green-600',
          border: 'border-green-700',
          text: 'text-white',
          icon: Settings,
          label: '🔧 DEVELOPMENT MODE',
          description: `Connected to: ${envInfo.database}`,
          showClose: true,
        };
    }
  };

  const config = getBannerConfig();
  const Icon = config.icon;

  return (
    <div
      className={`${config.bg} ${config.border} ${config.text} border-b-2 py-2 px-4 flex items-center justify-between shadow-md`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
          <span className="font-bold text-sm">{config.label}</span>
          <span className="text-xs opacity-90">{config.description}</span>
        </div>
      </div>
      
      {config.showClose && (
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:opacity-75 transition-opacity ml-4"
          aria-label="Close banner"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      )}

      {envInfo.isProduction && (
        <div className="hidden sm:block text-xs opacity-75 ml-4">
          BE CAREFUL: Changes affect live data
        </div>
      )}
    </div>
  );
}




