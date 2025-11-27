// Environment configuration for the application
interface Config {
  API_BASE_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

// Get API base URL based on environment
const getApiUrl = () => {
  // For browser environment, detect based on hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    
    // If deployed on cybaemtech.net (production)
    if (hostname.includes('cybaemtech.net')) {
      // Detect if we're in /License subdirectory
      if (pathname.includes('/License')) {
        // API is in /License/api/ folder
        return `${origin}/License/api`;
      }
      // Fallback for root deployment
      return `${origin}/api`;
    }
    
    // For Replit development environment
    if (hostname.includes('replit.dev') || hostname.includes('repl.co')) {
      return '/api';
    }
  }
  
  // For Replit and local development, use relative /api (proxied to Express)
  return '/api';
};

const config: Config = {
  // API Configuration
  API_BASE_URL: getApiUrl(),
  
  // App Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'License Management System',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Environment flags
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Log configuration for debugging
if (typeof window !== 'undefined') {
  console.log('🔧 App Configuration:', {
    API_BASE_URL: config.API_BASE_URL,
    APP_NAME: config.APP_NAME,
    APP_VERSION: config.APP_VERSION,
    Environment: config.isDevelopment ? 'Development' : 'Production',
    Hostname: window.location.hostname,
    Origin: window.location.origin,
    Pathname: window.location.pathname
  });
}

export default config;
