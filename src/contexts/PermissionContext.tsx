import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserPermissions, UserPermissions, hasPermission as checkPermission } from '../utils/permissionHelper';
import { getSession } from '../utils/session';
import { getApiBaseUrl } from '../utils/api';

interface PermissionContextType {
  permissions: UserPermissions | null;
  hasModuleAccess: (module: string) => boolean;
  hasActionAccess: (module: string, action: string) => boolean;
  refreshPermissions: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const navigate = useNavigate();

  const loadPermissions = async () => {
    const session = getSession();
    if (!session) {
      setPermissions(null);
      return;
    }

    try {
      // Validate session and get fresh permissions from server
      const response = await fetch(`${getApiBaseUrl()}/validate-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.id })
      });

      if (!response.ok) {
        console.warn('Session validation failed, user needs to re-login');
        setPermissions(null);
        localStorage.removeItem('auth_session');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (data.success && data.user && data.user.permissions) {
        // Update permissions in state
        setPermissions(data.user.permissions);

        // Update permissions in localStorage for offline access
        const updatedSession = { ...session, permissions: data.user.permissions };
        localStorage.setItem('auth_session', JSON.stringify(updatedSession));
      } else {
        console.warn('Invalid session response, clearing session');
        setPermissions(null);
        localStorage.removeItem('auth_session');
      }
    } catch (error) {
      console.error('Error validating session:', error);
      // Fallback to cached permissions on network error
      const userPerms = getUserPermissions();
      setPermissions(userPerms);
    }
  };

  useEffect(() => {
    // Load initial permissions from server
    loadPermissions();

    // Listen for auth changes
    const handleAuthChange = () => {
      loadPermissions();
    };

    // Listen for permission updates (when admin changes permissions)
    const handlePermissionUpdate = () => {
      loadPermissions();
    };

    window.addEventListener('authchange', handleAuthChange);
    window.addEventListener('permissionsUpdated', handlePermissionUpdate);

    // Periodic permission refresh (every 5 minutes) to detect revocations
    const refreshInterval = setInterval(() => {
      const session = getSession();
      if (session) {
        loadPermissions();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      window.removeEventListener('authchange', handleAuthChange);
      window.removeEventListener('permissionsUpdated', handlePermissionUpdate);
      clearInterval(refreshInterval);
    };
  }, []);

  const hasModuleAccess = (module: string) => {
    if (!permissions) return false;
    return checkPermission(permissions, module as keyof UserPermissions);
  };

  const hasActionAccess = (module: string, action: string) => {
    if (!permissions) return false;
    return checkPermission(permissions, module as keyof UserPermissions, action as any);
  };

  const refreshPermissions = () => {
    loadPermissions();
  };

  return (
    <PermissionContext.Provider value={{ permissions, hasModuleAccess, hasActionAccess, refreshPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
