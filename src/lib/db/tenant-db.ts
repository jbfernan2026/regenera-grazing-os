// =============================================================================
// Tenant-Aware Database Queries
// =============================================================================
// These utilities ensure every database query is scoped to the current tenant.
// This is the APPLICATION-LEVEL isolation layer.
// Combined with PostgreSQL RLS (applied via migrations), this provides
// defense-in-depth: even if a developer forgets to use these helpers,
// RLS at the database level prevents cross-tenant data leaks.
// =============================================================================

import { prisma } from "@/lib/db/prisma";
import { TenantContext } from "@/lib/tenant/context";

/**
 * Returns a Prisma client that automatically filters by tenant.
 * 
 * Usage:
 *   const db = getTenantDb(tenantId);
 *   const farms = await db.farm.findMany(); // Already filtered by tenantId
 * 
 * For Phase 1, this is a wrapper that ensures tenantId is always included.
 * In future phases, this can be extended with Prisma client extensions
 * for automatic tenant filtering.
 */
export function getTenantDb(tenantId: string) {
  if (!tenantId) {
    throw new Error("Tenant ID is required for tenant-scoped queries");
  }

  return {
    /**
     * Get the raw Prisma client (for non-tenant-scoped operations)
     * Use with caution — prefer tenant-scoped methods
     */
    raw: prisma,

    /**
     * The tenant ID this client is scoped to
     */
    tenantId,

    /**
     * Helper to create a where clause with tenant scoping
     */
    where(additionalWhere: Record<string, unknown> = {}) {
      return {
        tenantId,
        ...additionalWhere,
      };
    },

    /**
     * Helper to include tenantId in create data
     */
    createData(data: Record<string, unknown>) {
      return {
        tenantId,
        ...data,
      };
    },
  };
}

/**
 * Verify that a user has access to a specific tenant.
 * Returns the membership if found, null otherwise.
 */
export async function verifyTenantAccess(
  userId: string,
  tenantId: string
) {
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId,
      },
      isActive: true,
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          planId: true,
          subscriptionStatus: true,
        },
      },
    },
  });

  if (!membership || !membership.tenant.isActive) {
    return null;
  }

  return membership;
}

/**
 * Get all tenants a user belongs to.
 */
export async function getUserTenants(userId: string) {
  const memberships = await prisma.tenantMembership.findMany({
    where: {
      userId,
      isActive: true,
      tenant: {
        isActive: true,
      },
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          subscriptionStatus: true,
          plan: {
            select: {
              name: true,
              displayName: true,
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: "asc",
    },
  });

  return memberships;
}

/**
 * Create an audit log entry for a tenant-scoped action.
 */
export async function createAuditLog(params: {
  tenantId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.auditLog.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      metadata: params.metadata ?? {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}
