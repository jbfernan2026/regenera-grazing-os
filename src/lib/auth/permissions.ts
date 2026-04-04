// =============================================================================
// Permission System — Role-Based Access Control
// =============================================================================
// Defines what each role can do within a tenant.
// This is the single source of truth for permissions.
// =============================================================================

import { TenantRole, PlatformRole } from "@prisma/client";

/**
 * All possible actions in the system.
 * Grouped by entity for clarity.
 */
export const Actions = {
  // Tenant management
  TENANT_VIEW: "tenant:view",
  TENANT_UPDATE: "tenant:update",
  TENANT_DELETE: "tenant:delete",
  TENANT_MANAGE_BILLING: "tenant:manage_billing",
  
  // Member management
  MEMBER_VIEW: "member:view",
  MEMBER_INVITE: "member:invite",
  MEMBER_REMOVE: "member:remove",
  MEMBER_CHANGE_ROLE: "member:change_role",
  
  // Farm operations (Phase 2+)
  FARM_VIEW: "farm:view",
  FARM_CREATE: "farm:create",
  FARM_UPDATE: "farm:update",
  FARM_DELETE: "farm:delete",
  
  // Paddock operations (Phase 2+)
  PADDOCK_VIEW: "paddock:view",
  PADDOCK_CREATE: "paddock:create",
  PADDOCK_UPDATE: "paddock:update",
  PADDOCK_DELETE: "paddock:delete",
  
  // Herd operations (Phase 2+)
  HERD_VIEW: "herd:view",
  HERD_CREATE: "herd:create",
  HERD_UPDATE: "herd:update",
  HERD_DELETE: "herd:delete",
  
  // Grazing planning (Phase 4+)
  PLAN_VIEW: "plan:view",
  PLAN_CREATE: "plan:create",
  PLAN_UPDATE: "plan:update",
  PLAN_APPROVE: "plan:approve",
  
  // Field logs (Phase 5+)
  LOG_VIEW: "log:view",
  LOG_CREATE: "log:create",
  LOG_UPDATE_OWN: "log:update_own",
  LOG_UPDATE_ANY: "log:update_any",
  
  // Monitoring (Phase 6+)
  MONITOR_VIEW: "monitor:view",
  MONITOR_CREATE: "monitor:create",
  MONITOR_UPDATE: "monitor:update",
  
  // Documents / EOV (Phase 7+)
  DOCUMENT_VIEW: "document:view",
  DOCUMENT_UPLOAD: "document:upload",
  DOCUMENT_DELETE: "document:delete",
  
  // Audit log
  AUDIT_VIEW: "audit:view",
} as const;

export type Action = (typeof Actions)[keyof typeof Actions];

/**
 * Permission matrix: which roles can perform which actions.
 */
const ROLE_PERMISSIONS: Record<TenantRole, Action[]> = {
  OWNER: Object.values(Actions), // Owner can do everything
  
  FARM_MANAGER: [
    Actions.TENANT_VIEW,
    Actions.MEMBER_VIEW,
    Actions.MEMBER_INVITE,
    Actions.FARM_VIEW,
    Actions.FARM_CREATE,
    Actions.FARM_UPDATE,
    Actions.PADDOCK_VIEW,
    Actions.PADDOCK_CREATE,
    Actions.PADDOCK_UPDATE,
    Actions.PADDOCK_DELETE,
    Actions.HERD_VIEW,
    Actions.HERD_CREATE,
    Actions.HERD_UPDATE,
    Actions.HERD_DELETE,
    Actions.PLAN_VIEW,
    Actions.PLAN_CREATE,
    Actions.PLAN_UPDATE,
    Actions.PLAN_APPROVE,
    Actions.LOG_VIEW,
    Actions.LOG_CREATE,
    Actions.LOG_UPDATE_OWN,
    Actions.LOG_UPDATE_ANY,
    Actions.MONITOR_VIEW,
    Actions.MONITOR_CREATE,
    Actions.MONITOR_UPDATE,
    Actions.DOCUMENT_VIEW,
    Actions.DOCUMENT_UPLOAD,
    Actions.AUDIT_VIEW,
  ],
  
  FIELD_OPERATOR: [
    Actions.TENANT_VIEW,
    Actions.FARM_VIEW,
    Actions.PADDOCK_VIEW,
    Actions.HERD_VIEW,
    Actions.PLAN_VIEW,
    Actions.LOG_VIEW,
    Actions.LOG_CREATE,
    Actions.LOG_UPDATE_OWN,
    Actions.MONITOR_VIEW,
    Actions.MONITOR_CREATE,
    Actions.DOCUMENT_VIEW,
  ],
  
  ADVISOR: [
    Actions.TENANT_VIEW,
    Actions.MEMBER_VIEW,
    Actions.FARM_VIEW,
    Actions.PADDOCK_VIEW,
    Actions.HERD_VIEW,
    Actions.PLAN_VIEW,
    Actions.PLAN_CREATE,
    Actions.PLAN_UPDATE,
    Actions.LOG_VIEW,
    Actions.MONITOR_VIEW,
    Actions.MONITOR_CREATE,
    Actions.MONITOR_UPDATE,
    Actions.DOCUMENT_VIEW,
    Actions.DOCUMENT_UPLOAD,
    Actions.AUDIT_VIEW,
  ],
  
  REVIEWER: [
    Actions.TENANT_VIEW,
    Actions.FARM_VIEW,
    Actions.PADDOCK_VIEW,
    Actions.HERD_VIEW,
    Actions.PLAN_VIEW,
    Actions.LOG_VIEW,
    Actions.MONITOR_VIEW,
    Actions.DOCUMENT_VIEW,
    Actions.AUDIT_VIEW,
  ],
};

/**
 * Check if a role has permission to perform an action.
 */
export function hasPermission(role: TenantRole, action: Action): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

/**
 * Check if a user (by platform role) can bypass tenant permissions.
 * Only SUPER_ADMIN can do this.
 */
export function isPlatformAdmin(platformRole: PlatformRole): boolean {
  return platformRole === PlatformRole.SUPER_ADMIN;
}

/**
 * Get all permissions for a role.
 */
export function getRolePermissions(role: TenantRole): Action[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Get human-readable role labels (Spanish for default locale).
 */
export function getRoleLabel(role: TenantRole): string {
  const labels: Record<TenantRole, string> = {
    OWNER: "Propietario",
    FARM_MANAGER: "Administrador de Campo",
    FIELD_OPERATOR: "Operador de Terreno",
    ADVISOR: "Asesor / Consultor",
    REVIEWER: "Auditor (Solo Lectura)",
  };
  return labels[role];
}

/**
 * Roles that can be assigned by the tenant owner.
 * OWNER role cannot be assigned — it's set at tenant creation.
 */
export const ASSIGNABLE_ROLES: TenantRole[] = [
  TenantRole.FARM_MANAGER,
  TenantRole.FIELD_OPERATOR,
  TenantRole.ADVISOR,
  TenantRole.REVIEWER,
];
