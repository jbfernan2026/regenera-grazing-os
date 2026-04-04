import { requireTenantSession } from "@/lib/auth/session";
import { getWUMs } from "@/lib/wum/service";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Layers, Users, FileText, MapPin } from "lucide-react";

const exploitationTypeLabels: Record<string, string> = {
  PRIMARY_PRODUCTION: "Producción primaria",
  VALUE_ADDED: "Valor agregado",
  MIXED: "Mixto",
};

export const metadata = {
  title: "Entero Bajo Manejo",
};

export default async function WUMListPage() {
  const session = await requireTenantSession();
  const wums = await getWUMs(session.tenantId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Entero Bajo Manejo</h1>
          <p className="text-muted-foreground mt-1">
            Unidades de pastoreo y producción gestionadas como un sistema
            indivisible
          </p>
        </div>
        <Link href="/dashboard/wum/new">
          <Button className="bg-regenera-600 hover:bg-regenera-500">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo
          </Button>
        </Link>
      </div>

      {wums.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-regenera-100">
              <Layers className="h-7 w-7 text-regenera-600" />
            </div>
            <CardTitle className="mt-4">
              Define tu primera unidad de manejo
            </CardTitle>
            <CardDescription>
              El Entero Bajo Manejo es la unidad productiva completa que
              gestionas como un solo sistema: tierra, animales, cultivos y
              recursos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/dashboard/wum/new">
              <Button className="bg-regenera-600 hover:bg-regenera-500">
                <Plus className="mr-2 h-4 w-4" />
                Crear Entero Bajo Manejo
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {wums.map((wum) => (
            <Link key={wum.id} href={`/dashboard/wum/${wum.id}`}>
              <Card className="hover:border-regenera-300 hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{wum.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {exploitationTypeLabels[wum.exploitationType]}
                      </CardDescription>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-regenera-50">
                      <Layers className="h-5 w-5 text-regenera-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {wum.totalAreaHa && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{wum.totalAreaHa} ha</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>
                        {wum._count.decisionMakers} tomador
                        {wum._count.decisionMakers !== 1 ? "es" : ""} de
                        decisiones
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      <span>
                        {wum.holisticContext
                          ? `Contexto holístico definido`
                          : "Sin contexto holístico"}
                      </span>
                    </div>
                  </div>
                  {wum.description && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                      {wum.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
