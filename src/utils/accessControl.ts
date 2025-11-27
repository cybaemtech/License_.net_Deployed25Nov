// Access control utility using real permission system
import { hasPermission as checkPermission, getUserPermissions, UserPermissions } from './permissionHelper';

export const PERMISSIONS = {
  MANAGE_ALL_LICENSES: 'licenses.create',
  VIEW_TEAM_LICENSES: 'licenses.read',
  DELETE_LICENSE: 'licenses.delete',
  UPDATE_LICENSE: 'licenses.update',
  MANAGE_CLIENTS: 'clients.create',
  DELETE_CLIENT: 'clients.delete',
  UPDATE_CLIENT: 'clients.update',
  MANAGE_VENDORS: 'vendors.create',
  DELETE_VENDOR: 'vendors.delete',
  UPDATE_VENDOR: 'vendors.update',
};

export function hasPermission(_role: string | undefined, permission: string): boolean {
  if (!permission) return true;
  
  // Get user permissions from session
  const userPerms = getUserPermissions();
  if (!userPerms) return false;
  
  // Parse permission string (e.g., "licenses.create")
  const [module, action] = permission.split('.');
  
  if (module && action) {
    return checkPermission(userPerms, module as keyof UserPermissions, action as any);
  }
  
  // If no action, just check module access
  if (module) {
    return checkPermission(userPerms, module as keyof UserPermissions);
  }
  
  return false;
}

export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    'admin': 'Administrator',
    'accounts': 'Accounts',
    'user': 'User'
  };
  return roleNames[role] || role;
}

export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    'admin': 'red',
    'accounts': 'blue',
    'user': 'green'
  };
  return colors[role] || 'gray';
}
