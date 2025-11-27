// src/utils/session.ts
import { UserPermissions } from './permissionHelper';

export interface SessionData {
  email: string;
  id: string;
  full_name?: string;
  role?: string;
  permissions?: UserPermissions;
  loginTime: string;
  token?: string;
}

export const saveSession = (user: any, token?: string) => {
  const session: SessionData = {
    email: user.email,
    id: user.id,
    full_name: user.full_name || "",
    role: user.role || "",
    permissions: user.permissions || null,
    loginTime: new Date().toISOString(),
    token: token || "",
  };
  localStorage.setItem("auth_session", JSON.stringify(session));
};

export const getSession = (): SessionData | null => {
  const session = localStorage.getItem("auth_session");
  return session ? JSON.parse(session) : null;
};

export const clearSession = () => {
  localStorage.removeItem("auth_session");
};
