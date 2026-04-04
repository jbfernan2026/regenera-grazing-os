// =============================================================================
// Auth Helpers — Server-side session + tenant resolution
// =============================================================================

import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getCurrentTenantId } from "@/lib/tenant/context";
import { verifyTenantAccess } from "@/lib/db/tenant-db";
import { hasPermission, isPlatformAdmin, Action } from "@/lib/auth/permissions";
import { TenantRole, PlatformRole } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  platformRole: PlatformRole;
}

export interface TenantSession {
  user: AuthenticatedUser;
  tenantId: string;
  tenantRole: TenantRole;
  tenantName: string;
  tenantSlug: string;
}

/**
 * Get the current authenticated user or redirect to login.
 * Use in server components and server actions.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user as AuthenticatedUser;
}

/**
 * Get the current authenticated user + active tenant or redirect.
 * Use in pages/components that require both auth AND a selected tenant.
 */
export async function requireTenantSession(): Promise<TenantSession> {
  const user = await requireAuth();
  const tenantId = await getCurrentTenantId();

  if (!tenantId) {
    redirect("/dashboard"); // Will show tenant selector
  }

  const membership = await verifyTenantAccess(user.id, tenantId);

  if (!membership && !isPlatformAdmin(user.platformRole)) {
    redirect("/dashboard"); // No access to this tenant
  }

  return {
    user,
    tenantId: membership?.tenant.id ?? tenantId,
    tenantRole: membership?.role ?? TenantRole.OWNER, // Super admin defaults to owner-level
    tenantName: membership?.tenant.name ?? "Platform Admin",
    tenantSlug: membership?.tenant.slug ?? "admin",
  };
}

/**
 * Check if the current user can perform an action in the current tenant.
 */
export async function requirePermission(action: Action): Promise<TenantSession> {
  const session = await requireTenantSession();

  // Platform admins bypass all checks
  if (isPlatformAdmin(session.user.platformRole)) {
    return session;
  }

  if (!hasPermission(session.tenantRole, action)) {
    throw new Error(`Permission denied: ${action}`);
  }

  return session;
}
