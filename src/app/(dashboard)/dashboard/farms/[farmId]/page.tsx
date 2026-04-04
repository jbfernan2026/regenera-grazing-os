import { requireTenantSession } from "@/lib/auth/session";
import { getFarm } from "@/lib/farm/service";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  MapPin,
  CloudRain,
  Thermometer,
  Layers as LayersIcon,
  Droplets,
  Mountain,
  Fence,
} from "lucide-react";

export const metadata = { title: "Detalle del Predio" };

export default async function FarmDetailPage({
  params,
}: {
  params: { farmId: string };
}) {
  const session = await requireTenantSession();
  const farm = await getFarm(session.tenantId, params.farmId);

  if (!farm) notFound();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/farms"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Predios
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{farm.name}</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-1">
              <LayersIcon className="h-3.5 w-3.5" />
              {farm.wum.name}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-regenera-50">
            <Fence className="h-6 w-6 text-regenera-600" />
          </div>
        </div>
      </div>

      {farm.description && (
        <p className="text-muted-foreground">{farm.description}</p>
      )}

      {/* Superficie */}
      {(farm.totalAreaHa || farm.usableAreaHa) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Superficie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {farm.totalAreaHa && (
                <div>
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="font-medium text-lg">{farm.totalAreaHa} ha</p>
                </div>
              )}
              {farm.usableAreaHa && (
                <div>
                  <p className="text-muted-foreground text-xs">Útil</p>
                  <p className="font-medium text-lg">{farm.usableAreaHa} ha</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ubicación */}
      {(farm.region || farm.commune || farm.address || farm.elevationM) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mountain className="h-4 w-4" />
              Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {(farm.commune || farm.region) && (
                <div className="flex justify-between py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Ubicación</span>
                  <span>{[farm.commune, farm.region, farm.country].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {farm.address && (
                <div className="flex justify-between py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Dirección</span>
                  <span>{farm.address}</span>
                </div>
              )}
              {farm.elevationM && (
                <div className="flex justify-between py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Altitud</span>
                  <span>{farm.elevationM} msnm</span>
                </div>
              )}
              {(farm.latitude && farm.longitude) && (
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Coordenadas</span>
                  <span className="font-mono text-xs">{farm.latitude}, {farm.longitude}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clima */}
      {(farm.climateZone || farm.avgAnnualTempC || farm.annualRainfallMm || farm.frostFreeDays) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CloudRain className="h-4 w-4" />
              Clima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {farm.climateZone && (
                <div>
                  <p className="text-muted-foreground text-xs">Zona</p>
                  <p className="font-medium">{farm.climateZone}</p>
                </div>
              )}
              {farm.avgAnnualTempC != null && (
                <div>
                  <p className="text-muted-foreground text-xs">Temp. promedio</p>
                  <p className="font-medium flex items-center gap-1">
                    <Thermometer className="h-3.5 w-3.5" />
                    {farm.avgAnnualTempC}°C
                  </p>
                </div>
              )}
              {farm.annualRainfallMm != null && (
                <div>
                  <p className="text-muted-foreground text-xs">Precip. anual</p>
                  <p className="font-medium">{farm.annualRainfallMm} mm</p>
                </div>
              )}
              {farm.frostFreeDays != null && (
                <div>
                  <p className="text-muted-foreground text-xs">Días sin helada</p>
                  <p className="font-medium">{farm.frostFreeDays}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suelo */}
      {(farm.predominantSoilType || farm.soilDepthCm || farm.organicMatterPct) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suelo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {farm.predominantSoilType && (
                <div>
                  <p className="text-muted-foreground text-xs">Tipo</p>
                  <p className="font-medium">{farm.predominantSoilType}</p>
                </div>
              )}
              {farm.soilDepthCm != null && (
                <div>
                  <p className="text-muted-foreground text-xs">Profundidad</p>
                  <p className="font-medium">{farm.soilDepthCm} cm</p>
                </div>
              )}
              {farm.organicMatterPct != null && (
                <div>
                  <p className="text-muted-foreground text-xs">Materia orgánica</p>
                  <p className="font-medium">{farm.organicMatterPct}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agua */}
      {(farm.waterSource || farm.irrigationType) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              Agua
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {farm.waterSource && (
                <div className="flex justify-between py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Fuente</span>
                  <span>{farm.waterSource}</span>
                </div>
              )}
              {farm.irrigationType && (
                <div className="flex justify-between py-1.5 border-b border-dashed">
                  <span className="text-muted-foreground">Tipo de riego</span>
                  <span>{farm.irrigationType}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Derechos de agua</span>
                <span>{farm.hasWaterRights ? "Sí" : "No"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
