"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  holisticContextSchema,
  type HolisticContextInput,
} from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Check, AlertCircle } from "lucide-react";

interface HolisticContextFormProps {
  wumId: string;
  initialData?: {
    qualityOfLife?: string | null;
    formsOfProduction?: string | null;
    futureResourceBase?: string | null;
    notes?: string | null;
    lastReviewedAt?: string | null;
  };
}

export function HolisticContextForm({
  wumId,
  initialData,
}: HolisticContextFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<HolisticContextInput>({
    resolver: zodResolver(holisticContextSchema),
    defaultValues: {
      qualityOfLife: initialData?.qualityOfLife ?? "",
      formsOfProduction: initialData?.formsOfProduction ?? "",
      futureResourceBase: initialData?.futureResourceBase ?? "",
      notes: initialData?.notes ?? "",
    },
  });

  async function onSubmit(data: HolisticContextInput) {
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/wum/${wumId}/context`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Error al guardar");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Error de conexión");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contexto Holístico</CardTitle>
        <CardDescription>
          El contexto holístico es la brújula de todas tus decisiones de manejo.
          Define qué vida quieren vivir los tomadores de decisiones, qué se debe
          producir para sostenerla, y cómo debe verse la base de recursos a
          futuro.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="qualityOfLife" className="text-base font-semibold">
              1. Calidad de Vida
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              ¿Qué vida quieren vivir los tomadores de decisiones? Describan
              cómo se ven viviendo, qué valoran, qué necesitan para sentirse
              realizados.
            </p>
            <textarea
              id="qualityOfLife"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Queremos vivir en el campo con nuestra familia, tener tiempo para..."
              {...register("qualityOfLife")}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="formsOfProduction"
              className="text-base font-semibold"
            >
              2. Formas de Producción
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              ¿Qué debe producirse — física, financiera y socialmente — para
              sostener la calidad de vida descrita? Incluye productos, servicios
              e ingresos necesarios.
            </p>
            <textarea
              id="formsOfProduction"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Necesitamos producir leche y queso para venta directa, huevos para..."
              {...register("formsOfProduction")}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="futureResourceBase"
              className="text-base font-semibold"
            >
              3. Futura Base de Recursos
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              ¿Cómo debe verse la base de recursos (tierra, agua, biodiversidad,
              comunidad) a largo plazo para sostener todo lo anterior? Piensa en
              generaciones.
            </p>
            <textarea
              id="futureResourceBase"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Queremos suelos vivos con alta materia orgánica, cursos de agua limpios..."
              {...register("futureResourceBase")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-semibold">
              Notas adicionales
            </Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Reflexiones, acuerdos del equipo de planificación..."
              {...register("notes")}
            />
          </div>

          {initialData?.lastReviewedAt && (
            <p className="text-xs text-muted-foreground">
              Última revisión:{" "}
              {new Date(initialData.lastReviewedAt).toLocaleDateString("es-CL", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-regenera-600 hover:bg-regenera-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : saved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Guardado
              </>
            ) : (
              "Guardar Contexto Holístico"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
