"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createWUMSchema, type CreateWUMInput } from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function CreateWUMForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateWUMInput>({
    resolver: zodResolver(createWUMSchema),
    defaultValues: {
      exploitationType: "PRIMARY_PRODUCTION",
    },
  });

  async function onSubmit(data: CreateWUMInput) {
    setError(null);
    try {
      const res = await fetch("/api/wum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Error al crear");
        return;
      }
      router.push(`/dashboard/wum/${result.wum.id}`);
      router.refresh();
    } catch {
      setError("Error de conexión");
    }
  }

  return (
    <Card>
      <CardHeader>
        <Link
          href="/dashboard/wum"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver
        </Link>
        <CardTitle>Nuevo Entero Bajo Manejo</CardTitle>
        <CardDescription>
          Define la unidad productiva completa que gestionarás como un solo
          sistema. Incluye toda la tierra, animales, cultivos y recursos
          manejados bajo una misma toma de decisiones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Ej: Célula Pirque, Unidad Río Claro"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Descripción de la unidad de manejo, sus características principales..."
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exploitationType">Tipo de explotación</Label>
            <select
              id="exploitationType"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("exploitationType")}
            >
              <option value="PRIMARY_PRODUCTION">
                Producción primaria — vende materias primas
              </option>
              <option value="VALUE_ADDED">
                Valor agregado — procesa y transforma (queso, vino, etc.)
              </option>
              <option value="MIXED">
                Mixto — producción primaria + procesamiento
              </option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalAreaHa">Superficie total (ha)</Label>
              <Input
                id="totalAreaHa"
                type="number"
                step="0.1"
                placeholder="Ej: 120.5"
                {...register("totalAreaHa", { valueAsNumber: true })}
              />
              {errors.totalAreaHa && (
                <p className="text-xs text-red-500">
                  {errors.totalAreaHa.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualRainfallMm">
                Precipitación anual (mm)
              </Label>
              <Input
                id="annualRainfallMm"
                type="number"
                step="1"
                placeholder="Ej: 450"
                {...register("annualRainfallMm", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seasonRainfallMm">
                Precip. estación (mm)
              </Label>
              <Input
                id="seasonRainfallMm"
                type="number"
                step="1"
                placeholder="Ej: 280"
                {...register("seasonRainfallMm", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            Después de crear el Entero Bajo Manejo podrás definir el Contexto
            Holístico (Calidad de Vida, Formas de Producción y Futura Base de
            Recursos) y agregar a los tomadores de decisiones.
          </div>

          <Button
            type="submit"
            className="w-full bg-regenera-600 hover:bg-regenera-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Entero Bajo Manejo"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
