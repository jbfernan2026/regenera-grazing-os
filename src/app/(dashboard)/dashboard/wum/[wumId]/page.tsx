import { requireTenantSession } from "@/lib/auth/session";
import { getWUM } from "@/lib/wum/service";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HolisticContextForm } from "@/components/wum/holistic-context-form";
import { DecisionMakersPanel } from "@/components/wum/decision-makers-panel";
import { ArrowLeft, MapPin, CloudRain, Layers } from "lucide-react";

const exploitationTypeLabels: Record<string, string> = {
  PRIMARY_PRODUCTION: "Producción primaria",
  VALUE_ADDED: "Valor agregado",
  MIXED: "Mixto (producción + procesamiento)",
};

export const metadata = {
  title: "Entero Bajo Manejo",
};

export default async function WUMDetailPage({
  params,
}: {
  params: { wumId: string };
}) {
  const session = await requireTenantSession();
  const wum = await getWUM(session.tenantId, params.wumId);

  if (!wum) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/wum"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Enteros bajo manejo
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{wum.name}</h1>
            <p className="text-muted-foreground mt-1">
              {exploitationTypeLabels[wum.exploitationType]}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-regenera-50">
            <Layers className="h-6 w-6 text-regenera-600" />
          </div>
        </div>
      </div>

      {/* Summary card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información general</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {wum.totalAreaHa && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Superficie</p>
                  <p className="font-medium">{wum.totalAreaHa} ha</p>
                </div>
              </div>
            )}
            {wum.annualRainfallMm && (
              <div className="flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">
                    Precipitación anual
                  </p>
                  <p className="font-medium">{wum.annualRainfallMm} mm</p>
                </div>
              </div>
            )}
            {wum.seasonRainfallMm && (
              <div className="flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">
                    Precip. estación
                  </p>
                  <p className="font-medium">{wum.seasonRainfallMm} mm</p>
                </div>
              </div>
            )}
          </div>
          {wum.description && (
            <p className="mt-4 text-sm text-muted-foreground">
              {wum.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Decision Makers */}
      <DecisionMakersPanel
        wumId={wum.id}
        decisionMakers={wum.decisionMakers}
      />

      {/* Holistic Context */}
      <HolisticContextForm
        wumId={wum.id}
        initialData={
          wum.holisticContext
            ? {
                qualityOfLife: wum.holisticContext.qualityOfLife,
                formsOfProduction: wum.holisticContext.formsOfProduction,
                futureResourceBase: wum.holisticContext.futureResourceBase,
                notes: wum.holisticContext.notes,
                lastReviewedAt:
                  wum.holisticContext.lastReviewedAt?.toISOString(),
              }
            : undefined
        }
      />
    </div>
  );
}
