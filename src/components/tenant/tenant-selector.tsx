"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Plus, ChevronRight, Loader2 } from "lucide-react";

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  role: string;
  plan: string;
  subscriptionStatus: string;
}

interface TenantSelectorProps {
  tenants: TenantInfo[];
  activeTenantId?: string | null;
}

const roleLabels: Record<string, string> = {
  OWNER: "Propietario",
  FARM_MANAGER: "Administrador",
  FIELD_OPERATOR: "Operador",
  ADVISOR: "Asesor",
  REVIEWER: "Auditor",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  TRIAL: { label: "Prueba", color: "bg-amber-100 text-amber-700" },
  ACTIVE: { label: "Activo", color: "bg-green-100 text-green-700" },
  PAST_DUE: { label: "Pago pendiente", color: "bg-red-100 text-red-700" },
  CANCELED: { label: "Cancelado", color: "bg-gray-100 text-gray-500" },
  SUSPENDED: { label: "Suspendido", color: "bg-red-100 text-red-700" },
};

export function TenantSelector({
  tenants,
  activeTenantId,
}: TenantSelectorProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState<string | null>(null);

  async function switchTenant(tenantId: string) {
    setSwitching(tenantId);
    try {
      const res = await fetch("/api/tenants/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Error switching tenant:", error);
    } finally {
      setSwitching(null);
    }
  }

  if (tenants.length === 0) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-regenera-100">
            <Building2 className="h-7 w-7 text-regenera-600" />
          </div>
          <CardTitle className="mt-4">Bienvenido a Regenera</CardTitle>
          <CardDescription>
            Crea tu primera organización para comenzar a planificar tu pastoreo
            holístico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => router.push("/dashboard/new-organization")}
            className="w-full bg-regenera-600 hover:bg-regenera-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear Organización
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tenants.map((tenant) => {
        const isActive = tenant.id === activeTenantId;
        const status = statusLabels[tenant.subscriptionStatus] ?? statusLabels.TRIAL;

        return (
          <button
            key={tenant.id}
            onClick={() => switchTenant(tenant.id)}
            disabled={switching !== null}
            className={`w-full rounded-lg border p-4 text-left transition-all hover:shadow-md ${
              isActive
                ? "border-regenera-300 bg-regenera-50 ring-2 ring-regenera-200"
                : "border-border bg-card hover:border-regenera-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                    isActive
                      ? "bg-regenera-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {tenant.name}
                    </span>
                    {isActive && (
                      <span className="rounded-full bg-regenera-100 px-2 py-0.5 text-[10px] font-medium text-regenera-700">
                        Activo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {roleLabels[tenant.role] ?? tenant.role}
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${status.color}`}
                    >
                      {status.label}
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-[10px] text-muted-foreground">
                      {tenant.plan}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                {switching === tenant.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </button>
        );
      })}

      <Button
        variant="outline"
        onClick={() => router.push("/dashboard/new-organization")}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Nueva Organización
      </Button>
    </div>
  );
}
