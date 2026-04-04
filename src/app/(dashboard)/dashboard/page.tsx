import { requireAuth } from "@/lib/auth/session";
import { getUserTenants } from "@/lib/db/tenant-db";
import { getCurrentTenantId } from "@/lib/tenant/context";
import { getTenant } from "@/lib/tenant/service";
import { TenantSelector } from "@/components/tenant/tenant-selector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Users, MapPin, CalendarRange } from "lucide-react";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
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
    joinedAt: m.joinedAt,
  }));

  // If no active tenant, show selector
  if (!activeTenantId || !tenants.find((t) => t.id === activeTenantId)) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <h1 className="text-2xl font-bold mb-6">Tus Organizaciones</h1>
        <TenantSelector tenants={tenants} activeTenantId={activeTenantId} />
      </div>
    );
  }

  // Active tenant — show overview
  const tenant = await getTenant(activeTenantId);

  if (!tenant) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <TenantSelector tenants={tenants} activeTenantId={null} />
      </div>
    );
  }

  const stats = [
    {
      label: "Miembros",
      value: tenant._count.memberships,
      limit: tenant.plan.maxUsers,
      icon: Users,
    },
    {
      label: "Predios",
      value: 0, // Phase 2
      limit: tenant.plan.maxFarms,
      icon: MapPin,
    },
    {
      label: "Potreros",
      value: 0, // Phase 2
      limit: tenant.plan.maxPaddocks,
      icon: Building2,
    },
    {
      label: "Planificaciones",
      value: 0, // Phase 4
      limit: "∞",
      icon: CalendarRange,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{tenant.name}</h1>
        <p className="text-muted-foreground mt-1">
          Plan {tenant.plan.displayName} · {tenant.subscriptionStatus === "TRIAL" ? "Período de prueba" : tenant.subscriptionStatus}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {stat.value}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        / {stat.limit}
                      </span>
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-regenera-50">
                    <Icon className="h-5 w-5 text-regenera-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Getting started */}
      <Card>
        <CardHeader>
          <CardTitle>Primeros Pasos</CardTitle>
          <CardDescription>
            Completa estos pasos para comenzar a usar Regenera Grazing OS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                done: true,
                label: "Crear organización",
                desc: "Tu organización está lista",
              },
              {
                done: tenant._count.memberships > 1,
                label: "Invitar equipo",
                desc: "Agrega administradores, operadores y asesores",
              },
              {
                done: false,
                label: "Agregar primer predio",
                desc: "Próximamente en Fase 2",
                disabled: true,
              },
              {
                done: false,
                label: "Definir potreros y lotes",
                desc: "Próximamente en Fase 2",
                disabled: true,
              },
              {
                done: false,
                label: "Crear primer plan de pastoreo",
                desc: "Próximamente en Fase 4",
                disabled: true,
              },
            ].map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  step.disabled
                    ? "opacity-50"
                    : step.done
                    ? "border-regenera-200 bg-regenera-50"
                    : ""
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    step.done
                      ? "bg-regenera-600 text-white"
                      : "border-2 border-muted text-muted-foreground"
                  }`}
                >
                  {step.done ? "✓" : i + 1}
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      step.done ? "text-regenera-700" : ""
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
