// Authentication and authorization models for hierarchical system

export type UserType = 'system_admin' | 'club_admin' | 'club_member' | 'admin' | 'comum';

export interface ClubAdminPermissions {
  gerenciarEventos: boolean;
  gerenciarMembros: boolean;
  gerenciarResultados: boolean;
  visualizarRelatorios: boolean;
  gerenciarPagamentos?: boolean;
}

export interface AuthContext {
  userId: string;
  userType: UserType;
  clubeId?: string;
  permissoes?: ClubAdminPermissions;
  nome: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  user: AuthContext;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CreateUserRequest {
  nome: string;
  email: string;
  senha: string;
  tipo: UserType;
  clubeId?: string;
  numeroRegistro?: string;
  permissoes?: ClubAdminPermissions;
  telefone?: string;
  associado?: boolean;
  statusAssociacao?: 'ativo' | 'inativo' | 'suspenso';
}

export interface UpdateUserRequest {
  nome?: string;
  email?: string;
  senha?: string;
  clubeId?: string;
  numeroRegistro?: string;
  permissoes?: ClubAdminPermissions;
  telefone?: string;
  associado?: boolean;
  statusAssociacao?: 'ativo' | 'inativo' | 'suspenso';
  ativo?: boolean;
}

// Authorization levels for API endpoints
export interface AuthLevel {
  level: UserType | UserType[];
  requireClubAccess?: boolean;
  requiredPermissions?: (keyof ClubAdminPermissions)[];
}

// JWT payload structure
export interface JWTPayload {
  userId: string;
  userType: UserType;
  clubeId?: string;
  permissoes?: ClubAdminPermissions;
  iat: number;
  exp: number;
}

// Session management
export interface UserSession {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: string;
  createdAt: string;
  lastUsedAt: string;
  userAgent?: string;
  ipAddress?: string;
}

// Helper functions for authorization
export function hasPermission(
  user: AuthContext,
  requiredPermissions: (keyof ClubAdminPermissions)[]
): boolean {
  if (user.userType === 'system_admin') return true;
  if (user.userType !== 'club_admin' || !user.permissoes) return false;
  
  return requiredPermissions.every(permission => 
    user.permissoes![permission] === true
  );
}

export function canAccessClub(user: AuthContext, targetClubId?: string): boolean {
  if (user.userType === 'system_admin') return true;
  if (!targetClubId) return true; // Global resources
  
  return user.clubeId === targetClubId;
}

export function canManageUser(manager: AuthContext, targetUser: AuthContext): boolean {
  // System admin can manage anyone
  if (manager.userType === 'system_admin') return true;
  
  // Club admin can only manage users from their club
  if (manager.userType === 'club_admin' && manager.clubeId === targetUser.clubeId) {
    // Club admin cannot manage other club admins or system admins
    return !['system_admin', 'club_admin'].includes(targetUser.userType);
  }
  
  // Users can only manage themselves (for profile updates)
  return manager.userId === targetUser.userId;
}

// Default permissions for new club admins
export const DEFAULT_CLUB_ADMIN_PERMISSIONS: ClubAdminPermissions = {
  gerenciarEventos: true,
  gerenciarMembros: true,
  gerenciarResultados: true,
  visualizarRelatorios: true,
  gerenciarPagamentos: false
};

// Role hierarchy for access control
export const ROLE_HIERARCHY: Record<UserType, number> = {
  'system_admin': 5,
  'club_admin': 4,
  'admin': 3, // Legacy role
  'club_member': 2,
  'comum': 1
};

export function hasHigherOrEqualRole(user: UserType, required: UserType): boolean {
  return ROLE_HIERARCHY[user] >= ROLE_HIERARCHY[required];
}