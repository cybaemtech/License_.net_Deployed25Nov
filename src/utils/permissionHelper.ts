// Permission Helper for Frontend
// Handles granular permission checking for modules and actions

export interface ModulePermissions {
  access: boolean;
  actions?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
    add?: boolean;
    import_csv?: boolean;
  };
}

export interface UserPermissions {
  dashboard?: ModulePermissions | boolean;
  licenses?: ModulePermissions | boolean;
  purchase_licenses?: ModulePermissions | boolean;
  selling_licenses?: ModulePermissions | boolean;
  sales?: ModulePermissions | boolean;
  clients?: ModulePermissions | boolean;
  vendors?: ModulePermissions | boolean;
  reports?: ModulePermissions | boolean;
  teams?: ModulePermissions | boolean;
  settings?: ModulePermissions | boolean;
  notifications?: ModulePermissions | boolean;
}

/**
 * Check if user has permission for a specific module and action
 */
export function hasPermission(
  permissions: UserPermissions | null | undefined,
  module: keyof UserPermissions,
  action?: 'create' | 'read' | 'update' | 'delete' | 'add' | 'import_csv'
): boolean {
  if (!permissions) return false;

  const modulePerms = permissions[module];

  // Handle old boolean format (backward compatibility)
  if (typeof modulePerms === 'boolean') {
    return modulePerms;
  }

  // Check if module permission object exists
  if (!modulePerms || typeof modulePerms !== 'object') {
    return false;
  }

  // Check module access
  if (!modulePerms.access) {
    return false;
  }

  // If no specific action requested, just check module access
  if (!action) {
    return true;
  }

  // Check specific action permission
  if (modulePerms.actions && typeof modulePerms.actions[action] === 'boolean') {
    return modulePerms.actions[action];
  }

  // Default: if actions not defined, grant access (for modules without actions)
  return true;
}

/**
 * Get user permissions from session storage with defensive handling
 */
export function getUserPermissions(): UserPermissions | null {
  try {
    const sessionData = localStorage.getItem('auth_session');
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);
    
    // If permissions exist and are valid, return them
    if (session.permissions && typeof session.permissions === 'object') {
      return session.permissions as UserPermissions;
    }

    // Security: If permissions are missing, force re-login instead of falling back
    // This prevents potential privilege escalation from default role permissions
    console.warn('Session missing permissions - user needs to re-login');
    return null;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return null;
  }
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissions(role: string): UserPermissions {
  const defaultPerms: Record<string, UserPermissions> = {
    admin: {
      dashboard: { access: true },
      licenses: {
        access: true,
        actions: { create: true, read: true, update: true, delete: true }
      },
      purchase_licenses: {
        access: true,
        actions: { add: true, read: true, update: true, delete: true, import_csv: true }
      },
      selling_licenses: {
        access: true,
        actions: { add: true, read: true, update: true, delete: true, import_csv: true }
      },
      sales: {
        access: true,
        actions: { create: true, read: true, update: true, delete: true }
      },
      clients: {
        access: true,
        actions: { create: true, read: true, update: true, delete: true }
      },
      vendors: {
        access: true,
        actions: { create: true, read: true, update: true, delete: true }
      },
      reports: { access: true },
      teams: { access: true },
      settings: { access: true },
      notifications: { access: true }
    },
    accounts: {
      dashboard: { access: true },
      licenses: {
        access: true,
        actions: { create: true, read: true, update: true, delete: false }
      },
      purchase_licenses: {
        access: true,
        actions: { add: true, read: true, update: true, delete: false, import_csv: true }
      },
      selling_licenses: {
        access: true,
        actions: { add: true, read: true, update: true, delete: false, import_csv: true }
      },
      sales: {
        access: true,
        actions: { create: true, read: true, update: true, delete: false }
      },
      clients: {
        access: true,
        actions: { create: true, read: true, update: true, delete: false }
      },
      vendors: {
        access: true,
        actions: { create: true, read: true, update: true, delete: false }
      },
      reports: { access: true },
      teams: { access: true },
      settings: { access: false },
      notifications: { access: true }
    },
    user: {
      dashboard: { access: true },
      licenses: {
        access: true,
        actions: { create: false, read: true, update: false, delete: false }
      },
      purchase_licenses: {
        access: true,
        actions: { add: false, read: true, update: false, delete: false, import_csv: false }
      },
      selling_licenses: {
        access: true,
        actions: { add: false, read: true, update: false, delete: false, import_csv: false }
      },
      sales: {
        access: true,
        actions: { create: false, read: true, update: false, delete: false }
      },
      clients: {
        access: true,
        actions: { create: false, read: true, update: false, delete: false }
      },
      vendors: {
        access: true,
        actions: { create: false, read: true, update: false, delete: false }
      },
      reports: { access: true },
      teams: { access: false },
      settings: { access: false },
      notifications: { access: true }
    }
  };

  return defaultPerms[role] || defaultPerms['user'];
}

/**
 * Check multiple permissions at once
 */
export function hasAnyPermission(
  permissions: UserPermissions | null | undefined,
  checks: Array<{ module: keyof UserPermissions; action?: 'create' | 'read' | 'update' | 'delete' | 'add' | 'import_csv' }>
): boolean {
  return checks.some(check => hasPermission(permissions, check.module, check.action));
}

/**
 * Check all permissions
 */
export function hasAllPermissions(
  permissions: UserPermissions | null | undefined,
  checks: Array<{ module: keyof UserPermissions; action?: 'create' | 'read' | 'update' | 'delete' | 'add' | 'import_csv' }>
): boolean {
  return checks.every(check => hasPermission(permissions, check.module, check.action));
}
