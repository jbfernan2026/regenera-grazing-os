// =============================================================================
// Tenant Service — Business Logic
// =============================================================================

import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/db/tenant-db";
import { TenantRole, SubscriptionStatus } from "@prisma/client";

/**
 * Create a new tenant with the creating user as OWNER.
 */
export async function createTenant(params: {
  name: string;
  slug: string;
  userId: string;
  email?: string;
  country?: string;
  timezone?: string;
}) {
  // Get the default starter plan
  const starterPlan = await prisma.plan.findUnique({
    where: { name: "starter" },
  });

  if (!starterPlan) {
    throw new Error("Starter plan not found. Run database seed first.");
  }

  // Create tenant + owner membership in a transaction
  const tenant = await prisma.$transaction(async (tx) => {
    // Create the tenant
    const newTenant = await tx.tenant.create({
      data: {
        name: params.name,
        slug: params.slug,
        email: params.email,
        country: params.country ?? "CL",
        timezone: params.timezone ?? "America/Santiago",
        planId: starterPlan.id,
        subscriptionStatus: SubscriptionStatus.TRIAL,
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Create owner membership
    await tx.tenantMembership.create({
      data: {
        userId: params.userId,
        tenantId: newTenant.id,
        role: TenantRole.OWNER,
      },
    });

    return newTenant;
  });

  // Audit log (outside transaction — non-critical)
  await createAuditLog({
    tenantId: tenant.id,
    userId: params.userId,
    action: "tenant.created",
    entity: "tenant",
    entityId: tenant.id,
    metadata: { name: params.name, slug: params.slug },
  }).catch(console.error);

  return tenant;
}

/**
 * Validate that a slug is available and well-formed.
 */
export async function validateSlug(slug: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  // Format validation
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    return {
      valid: false,
      error: "Slug must contain only lowercase letters, numbers, and hyphens",
    };
  }

  if (slug.length < 3 || slug.length > 48) {
    return {
      valid: false,
      error: "Slug must be between 3 and 48 characters",
    };
  }

  // Reserved slugs
  const reserved = [
    "admin", "api", "app", "auth", "billing", "dashboard",
    "docs", "help", "login", "register", "settings", "support",
    "www", "regenera", "platform", "system",
  ];
  if (reserved.includes(slug)) {
    return { valid: false, error: "This slug is reserved" };
  }

  // Uniqueness check
  const existing = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing) {
    return { valid: false, error: "This slug is already taken" };
  }

  return { valid: true };
}

/**
 * Get tenant details with plan info.
 */
export async function getTenant(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      plan: true,
      _count: {
        select: {
          memberships: { where: { isActive: true } },
        },
      },
    },
  });
}

/**
 * Invite a user to a tenant.
 */
export async function inviteToTenant(params: {
  tenantId: string;
  email: string;
  role: TenantRole;
  invitedBy: string;
}) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.tenantInvitation.create({
    data: {
      tenantId: params.tenantId,
      email: params.email.toLowerCase(),
      role: params.role,
      token,
      expiresAt,
    },
  });

  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.invitedBy,
    action: "tenant.invitation.created",
    entity: "invitation",
    entityId: invitation.id,
    metadata: { email: params.email, role: params.role },
  }).catch(console.error);

  return invitation;
}
