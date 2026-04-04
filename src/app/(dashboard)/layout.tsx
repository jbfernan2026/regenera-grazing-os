import React from "react";
import { requireAuth } from "@/lib/auth/session";
import { getUserTenants } from "@/lib/db/tenant-db";
import { getCurrentTenantId } from "@/lib/tenant/context";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const memberships = await getUserTenants(user.id);
  const activeTenantId = await getCurrentTenantId();

  const tenants = memberships.map((m) => ({
    id: m.tenant.id,
    name: m.tenant.name,
    slug: m.tenant.slug,
    logoUrl: m.tenant.logoUrl,
    role: m.role,
    plan: m.tenant.plan.displayName,
    subscriptionStatus: m.tenant.subscriptionStatus,
  }));

  const activeTenant = tenants.find((t) => t.id === activeTenantId) ?? null;

  return (
    <DashboardShell
      user={{
        id: user.id,
        name: user.name ?? undefined,
        email: user.email ?? undefined,
        image: user.image ?? undefined,
      }}
      tenants={tenants}
      activeTenant={activeTenant}
    >
      {children}
    </DashboardShell>
  );
}
