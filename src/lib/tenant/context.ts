// =============================================================================
// Tenant Context
// =============================================================================
// Server-side utilities to resolve and validate the current tenant
// from request headers, cookies, or URL parameters.
// =============================================================================

import { cookies, headers } from "next/headers";

const TENANT_COOKIE_NAME = "rg_active_tenant";
const TENANT_HEADER_NAME = "x-tenant-id";

export interface TenantContext {
  tenantId: string;
  tenantSlug?: string;
}

/**
 * Get the current tenant ID from the request context.
 * Priority order:
 *   1. Explicit header (x-tenant-id) — for API calls
 *   2. Cookie (rg_active_tenant) — for browser sessions
 *   3. null if not set
 */
export async function getCurrentTenantId(): Promise<string | null> {
  // 1. Check header (API clients, middleware-injected)
  const headerStore = await headers();
  const headerTenantId = headerStore.get(TENANT_HEADER_NAME);
  if (headerTenantId) {
    return headerTenantId;
  }

  // 2. Check cookie (browser sessions)
  const cookieStore = await cookies();
  const cookieTenantId = cookieStore.get(TENANT_COOKIE_NAME)?.value;
  if (cookieTenantId) {
    return cookieTenantId;
  }

  return null;
}

/**
 * Set the active tenant in a cookie.
 * Called when a user selects/switches tenant.
 */
export async function setActiveTenant(tenantId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TENANT_COOKIE_NAME, tenantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

/**
 * Clear the active tenant cookie.
 */
export async function clearActiveTenant(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TENANT_COOKIE_NAME);
}

/**
 * Get tenant context or throw if not available.
 * Use in routes/actions that REQUIRE a tenant.
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) {
    throw new Error("No active tenant. Please select an organization.");
  }
  return { tenantId };
}
