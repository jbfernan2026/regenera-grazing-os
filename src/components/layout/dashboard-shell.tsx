"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Map,
  CalendarRange,
  ClipboardList,
  BarChart3,
  FileText,
  Fence,
  Shrub,
  Users,
  Layers,
} from "lucide-react";

interface DashboardShellProps {
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
  tenants: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
    plan: string;
    subscriptionStatus: string;
  }>;
  activeTenant: {
    id: string;
    name: string;
    slug: string;
    role: string;
    plan: string;
  } | null;
  children: React.ReactNode;
}

const navigation = [
  {
    label: "Panel",
    href: "/dashboard",
    icon: LayoutDashboard,
    requiresTenant: false,
  },
  {
    label: "Entero Bajo Manejo",
    href: "/dashboard/wum",
    icon: Layers,
    requiresTenant: true,
    phase: 2,
  },
  {
    label: "Predios",
    href: "/dashboard/farms",
    icon: Fence,
    requiresTenant: true,
    phase: 2,
  },
  {
    label: "Potreros",
    href: "/dashboard/paddocks",
    icon: Shrub,
    requiresTenant: true,
    phase: 2,
  },
  {
    label: "Mapa",
    href: "/dashboard/map",
    icon: Map,
    requiresTenant: true,
    phase: 3,
  },
  {
    label: "Planificación",
    href: "/dashboard/planning",
    icon: CalendarRange,
    requiresTenant: true,
    phase: 4,
  },
  {
    label: "Registro Diario",
    href: "/dashboard/logs",
    icon: ClipboardList,
    requiresTenant: true,
    phase: 5,
  },
  {
    label: "Monitoreo",
    href: "/dashboard/monitoring",
    icon: BarChart3,
    requiresTenant: true,
    phase: 6,
  },
  {
    label: "Documentos",
    href: "/dashboard/documents",
    icon: FileText,
    requiresTenant: true,
    phase: 7,
  },
  {
    label: "Equipo",
    href: "/dashboard/team",
    icon: Users,
    requiresTenant: true,
    phase: 1,
  },
  {
    label: "Configuración",
    href: "/dashboard/settings",
    icon: Settings,
    requiresTenant: true,
    phase: 1,
  },
];

export function DashboardShell({
  user,
  tenants,
  activeTenant,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);

  const currentPhase = 2; // Phase 2A: WUM + Holistic Context

  async function handleSwitchTenant(tenantId: string) {
    await fetch("/api/tenants/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId }),
    });
    setTenantMenuOpen(false);
    router.refresh();
  }

  const filteredNav = navigation.filter(
    (item) => (item.phase ?? 1) <= currentPhase
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-card transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="flex h-14 items-center border-b px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-regenera-600 text-white text-xs font-bold">
                R
              </div>
              <span className="font-semibold text-sm">Regenera Grazing</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tenant selector */}
          <div className="border-b p-3">
            <div className="relative">
              <button
                onClick={() => setTenantMenuOpen(!tenantMenuOpen)}
                className="flex w-full items-center justify-between rounded-lg border bg-background p-2.5 text-sm hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">
                    {activeTenant?.name ?? "Seleccionar"}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    tenantMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {tenantMenuOpen && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border bg-card shadow-lg">
                  <div className="max-h-48 overflow-y-auto p-1">
                    {tenants.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleSwitchTenant(t.id)}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                          t.id === activeTenant?.id
                            ? "bg-regenera-50 text-regenera-700 font-medium"
                            : "hover:bg-accent"
                        }`}
                      >
                        <span className="truncate">{t.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t p-1">
                    <button
                      onClick={() => {
                        setTenantMenuOpen(false);
                        router.push("/dashboard/new-organization");
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      + Nueva Organización
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href;
              const disabled = item.requiresTenant && !activeTenant;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={disabled ? "#" : item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-regenera-50 text-regenera-700 font-medium"
                      : disabled
                      ? "text-muted-foreground/40 cursor-not-allowed"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User footer */}
          <div className="border-t p-3">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {user.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.name ?? "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-muted-foreground hover:text-foreground"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-card/80 backdrop-blur-sm px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 font-semibold text-sm">
            {activeTenant?.name ?? "Regenera"}
          </span>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
