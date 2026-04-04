"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFarmSchema, type CreateFarmInput } from "@/lib/validations/schemas";
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
import { Loader2, AlertCircle, ArrowLeft, Check, Sparkles } from "lucide-react";
import { LocationPicker } from "@/components/map/location-picker";
import Link from "next/link";

interface WUMOption {
  id: string;
  name: string;
}

interface GeoData {
  elevation?: number;
  avgAnnualTempC?: number;
  annualRainfallMm?: number;
  frostFreeDays?: number;
  climateZone?: string;
  soilType?: string;
}

export function CreateFarmForm({ wums }: { wums: WUMOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [geoFilled, setGeoFilled] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateFarmInput>({
    resolver: zodResolver(createFarmSchema),
    defaultValues: {
      country: "CL",
      hasWaterRights: false,
      wumId: wums.length === 1 ? wums[0].id : undefined,
    },
  });

  const watchLat = watch("latitude");
  const watchLng = watch("longitude");

  function handleLocationSelect(lat: number, lng: number) {
    setValue("latitude", lat);
    setValue("longitude", lng);
    setGeoFilled(false);
  }

  function handleGeoDataFetched(data: GeoData) {
    if (data.elevation != null) setValue("elevationM", data.elevation);
    if (data.avgAnnualTempC != null) setValue("avgAnnualTempC", data.avgAnnualTempC);
    if (data.annualRainfallMm != null) setValue("annualRainfallMm", data.annualRainfallMm);
    if (data.frostFreeDays != null) setValue("frostFreeDays", data.frostFreeDays);
    if (data.climateZone) setValue("climateZone", data.climateZone);
    if (data.soilType) setValue("predominantSoilType", data.soilType);
    setGeoFilled(true);
  }

  async function onSubmit(data: CreateFarmInput) {
    setError(null);
    try {
      const res = await fetch("/api/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Error al crear el predio");
        return;
      }
      router.push(`/dashboard/farms/${result.farm.id}`);
      router.refresh();
    } catch {
      setError("Error de conexión");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/farms"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver
        </Link>
        <h1 className="text-2xl font-bold">Nuevo Predio</h1>
        <p className="text-muted-foreground mt-1">
          Selecciona la ubicación en el mapa y los datos de clima, elevación
          y suelo se completarán automáticamente.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Step 1: Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Información básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wumId">Entero Bajo Manejo *</Label>
              <select
                id="wumId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("wumId")}
              >
                <option value="">Seleccionar...</option>
                {wums.map((wum) => (
                  <option key={wum.id} value={wum.id}>{wum.name}</option>
                ))}
              </select>
              {errors.wumId && <p className="text-xs text-red-500">{errors.wumId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del predio *</Label>
              <Input id="name" placeholder="Ej: Campus Pirque, Fundo Los Robles" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Características del predio..."
                {...register("description")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalAreaHa">Superficie total (ha)</Label>
                <Input id="totalAreaHa" type="number" step="0.1" placeholder="Ej: 120.5" {...register("totalAreaHa", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usableAreaHa">Superficie útil (ha)</Label>
                <Input id="usableAreaHa" type="number" step="0.1" placeholder="Ej: 95.0" {...register("usableAreaHa", { valueAsNumber: true })} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Map */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Ubicación en el mapa</CardTitle>
            <CardDescription>
              Busca tu predio o haz clic en el mapa. Los datos de clima, elevación y suelo se completarán automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LocationPicker
              latitude={watchLat}
              longitude={watchLng}
              onLocationSelect={handleLocationSelect}
              onGeoDataFetched={handleGeoDataFetched}
              height="400px"
            />
            {watchLat && watchLng && (
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">Coordenadas:</span>
                <span className="font-mono">{watchLat}, {watchLng}</span>
              </div>
            )}
            {geoFilled && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                <Sparkles className="h-4 w-4 shrink-0" />
                Datos de clima, elevación y suelo completados automáticamente. Puedes ajustarlos abajo.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">Región / Estado</Label>
                <Input id="region" placeholder="Ej: Metropolitana" {...register("region")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commune">Comuna / Municipio</Label>
                <Input id="commune" placeholder="Ej: Pirque" {...register("commune")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" placeholder="Camino, km..." {...register("address")} />
              </div>
            </div>
            <input type="hidden" {...register("latitude", { valueAsNumber: true })} />
            <input type="hidden" {...register("longitude", { valueAsNumber: true })} />
          </CardContent>
        </Card>

        {/* Step 3: Auto-filled data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              3. Datos del terreno
              {geoFilled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  <Check className="h-3 w-3" />
                  Autocompletado
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {geoFilled
                ? "Estos datos se obtuvieron de fuentes públicas. Revisa y ajusta si es necesario."
                : "Selecciona una ubicación en el mapa para autocompletar, o llena manualmente."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="elevationM">Altitud (msnm)</Label>
              <Input id="elevationM" type="number" placeholder="Se autocompleta desde el mapa" {...register("elevationM", { valueAsNumber: true })} />
            </div>

            <fieldset className="space-y-4 rounded-lg border p-4">
              <legend className="px-2 text-sm font-semibold">Clima</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="climateZone">Zona climática</Label>
                  <Input id="climateZone" placeholder="Autocompletado" {...register("climateZone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avgAnnualTempC">Temp. promedio (°C)</Label>
                  <Input id="avgAnnualTempC" type="number" step="0.1" placeholder="Autocompletado" {...register("avgAnnualTempC", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualRainfallMm">Precip. anual (mm)</Label>
                  <Input id="annualRainfallMm" type="number" step="1" placeholder="Autocompletado" {...register("annualRainfallMm", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frostFreeDays">Días sin helada</Label>
                  <Input id="frostFreeDays" type="number" placeholder="Autocompletado" {...register("frostFreeDays", { valueAsNumber: true })} />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 rounded-lg border p-4">
              <legend className="px-2 text-sm font-semibold">Suelo</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="predominantSoilType">Tipo de suelo</Label>
                  <Input id="predominantSoilType" placeholder="Autocompletado" {...register("predominantSoilType")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="soilDepthCm">Profundidad (cm)</Label>
                  <Input id="soilDepthCm" type="number" placeholder="Ej: 60" {...register("soilDepthCm", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organicMatterPct">Materia orgánica (%)</Label>
                  <Input id="organicMatterPct" type="number" step="0.1" placeholder="Ej: 3.5" {...register("organicMatterPct", { valueAsNumber: true })} />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 rounded-lg border p-4">
              <legend className="px-2 text-sm font-semibold">Agua</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="waterSource">Fuente de agua</Label>
                  <Input id="waterSource" placeholder="Ej: Canal de riego" {...register("waterSource")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="irrigationType">Tipo de riego</Label>
                  <Input id="irrigationType" placeholder="Ej: Goteo" {...register("irrigationType")} />
                </div>
                <div className="space-y-2 flex items-end">
                  <label className="flex items-center gap-2 h-10 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...register("hasWaterRights")} />
                    <span className="text-sm">Tiene derechos de agua</span>
                  </label>
                </div>
              </div>
            </fieldset>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full bg-regenera-600 hover:bg-regenera-500" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</>
          ) : (
            "Crear Predio"
          )}
        </Button>
      </form>
    </div>
  );
}
