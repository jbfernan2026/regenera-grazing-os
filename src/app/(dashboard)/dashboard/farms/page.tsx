import { requireTenantSession } from "@/lib/auth/session";
import { getFarms } from "@/lib/farm/service";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Fence, MapPin, Droplets, Layers } from "lucide-react";

export const metadata = { title: "Predios" };

export default async function FarmsPage() {
  const session = await requireTenantSession();
  const farms = await getFarms(session.tenantId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Predios</h1>
          <p className="text-muted-foreground mt-1">
            Terrenos físicos que forman parte de tus unidades de manejo
          </p>
        </div>
        <Link href="/dashboard/farms/new">
          <Button className="bg-regenera-600 hover:bg-regenera-500">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Predio
          </Button>
        </Link>
      </div>

      {farms.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-regenera-100">
              <Fence className="h-7 w-7 text-regenera-600" />
            </div>
            <CardTitle className="mt-4">Agrega tu primer predio</CardTitle>
            <CardDescription>
              Un predio es un terreno físico con ubicación, superficie y
              características de suelo y clima. Cada predio pertenece a un
              Entero Bajo Manejo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/dashboard/farms/new">
              <Button className="bg-regenera-600 hover:bg-regenera-500">
                <Plus className="mr-2 h-4 w-4" />
                Crear Predio
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {farms.map((farm) => (
            <Link key={farm.id} href={`/dashboard/farms/${farm.id}`}>
              <Card className="hover:border-regenera-300 hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{farm.name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {farm.wum.name}
                      </CardDescription>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-regenera-50">
                      <Fence className="h-5 w-5 text-regenera-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {farm.totalAreaHa && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{farm.totalAreaHa} ha totales</span>
                        {farm.usableAreaHa && (
                          <span className="text-muted-foreground/60">
                            ({farm.usableAreaHa} ha útiles)
                          </span>
                        )}
                      </div>
                    )}
                    {(farm.region || farm.commune) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>
                          {[farm.commune, farm.region].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                    {farm.annualRainfallMm && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Droplets className="h-3.5 w-3.5" />
                        <span>{farm.annualRainfallMm} mm/año</span>
                      </div>
                    )}
                  </div>
                  {farm.description && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                      {farm.description}
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
