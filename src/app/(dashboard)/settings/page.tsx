import { requireTenantSession } from "@/lib/auth/session";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Configuración",
};

export default async function SettingsPage() {
  const session = await requireTenantSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Administra tu organización y preferencias
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Organización</CardTitle>
          <CardDescription>
            Datos generales de {session.tenantName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Organización</span>
              <span className="font-medium">{session.tenantName}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Slug</span>
              <span className="font-mono text-xs">{session.tenantSlug}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Tu rol</span>
              <span className="font-medium">{session.tenantRole}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Tenant ID</span>
              <span className="font-mono text-xs text-muted-foreground">
                {session.tenantId}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración avanzada</CardTitle>
          <CardDescription>
            Más opciones disponibles en futuras fases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La gestión de suscripción, billing, y configuración avanzada
            estarán disponibles en la Fase 8.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
