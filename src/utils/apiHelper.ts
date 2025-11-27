/**
 * API Helper Utilities
 * Handles endpoint formatting for both development and production (cPanel)
 */

import { getApiBaseUrl } from './api';

/**
 * Check if we're running on production (cPanel)
 */
export const isProduction = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('cybaemtech.net');
};

/**
 * Format endpoint for production (adds index.php routing)
 * On cPanel, all API calls go through index.php which routes to correct PHP files
 */
export const formatApiEndpoint = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  
  if (isProduction()) {
    // On production cPanel, routes go through index.php
    // e.g., /License/api/index.php/notification-settings
    return `${baseUrl}/index.php${endpoint}`;
  }
  
  // Development - direct endpoint
  return `${baseUrl}${endpoint}`;
};

/**
 * Make an API request with proper formatting and timeout
 */
export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const url = formatApiEndpoint(endpoint);
  
  console.log('🌐 API Request:', {
    endpoint,
    url,
    method: options.method || 'GET',
    environment: isProduction() ? 'Production (cPanel)' : 'Development'
  });
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - database connection is slow. Please try again.');
    }
    throw error;
  }
};

/**
 * Make an API request - alias for fetchApi for consistency
 */
export const apiRequest = fetchApi;
