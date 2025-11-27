// API URL utilities for development and testing

/**
 * Get the current API base URL based on environment and deployment context
 */
export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    
    // If deployed on cybaemtech.net (production)
    if (hostname.includes('cybaemtech.net')) {
      // Detect if we're in /License subdirectory
      if (pathname.includes('/License')) {
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
  
  // Default - use /api which will be proxied to the Express backend
  return '/api';
};

/**
 * Check if we're using a local API server
 */
export const isLocalApi = (): boolean => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // Replit and localhost are considered local
    return hostname.includes('replit.dev') || 
           hostname.includes('repl.co') || 
           hostname === 'localhost' || 
           hostname === '127.0.0.1';
  }
  return true;
};

/**
 * Check if we're using the production API
 */
export const isProductionApi = (): boolean => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    return hostname.includes('cybaemtech.net');
  }
  return false;
};

/**
 * Get API health check URL
 */
export const getHealthCheckUrl = (): string => {
  return `${getApiBaseUrl()}/health`;
};

/**
 * Log current API configuration (development only)
 */
export const logApiConfig = (): void => {
  if (typeof window !== "undefined") {
    console.log('🌐 API Configuration:', {
      baseUrl: getApiBaseUrl(),
      isLocal: isLocalApi(),
      isProduction: isProductionApi(),
      hostname: window.location.hostname,
      origin: window.location.origin,
      pathname: window.location.pathname,
      environment: isProductionApi() ? 'Production (cybaemtech.net)' : 'Development'
    });
  }
};

// Log API config on module load
if (typeof window !== "undefined") {
  logApiConfig();
}
