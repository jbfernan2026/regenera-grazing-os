"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTenantSchema,
  type CreateTenantInput,
} from "@/lib/validations/schemas";
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
import { slugify } from "@/lib/utils";
import { APP_CONFIG } from "@/config/app";
import Link from "next/link";

export function CreateOrganizationForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTenantInput>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      country: "CL",
      timezone: "America/Santiago",
    },
  });

  const watchName = watch("name");

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setValue("name", name);
    setValue("slug", slugify(name));
  }

  async function onSubmit(data: CreateTenantInput) {
    setError(null);

    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Error al crear la organización");
        return;
      }

      // Switch to the new tenant
      await fetch("/api/tenants/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: result.tenant.id }),
      });

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver
        </Link>
        <CardTitle>Nueva Organización</CardTitle>
        <CardDescription>
          Crea una organización para tu empresa ganadera, consultoría o
          proyecto regenerativo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la organización</Label>
            <Input
              id="name"
              placeholder="Ej: Estancia Los Robles"
              {...register("name")}
              onChange={handleNameChange}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Identificador URL</Label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">
                regenera.app/
              </span>
              <Input
                id="slug"
                placeholder="estancia-los-robles"
                className="flex-1"
                {...register("slug")}
              />
            </div>
            {errors.slug && (
              <p className="text-xs text-red-500">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email de contacto (opcional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="contacto@estancia.cl"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <select
                id="country"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("country")}
              >
                {APP_CONFIG.countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Zona horaria</Label>
              <select
                id="timezone"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("timezone")}
              >
                {APP_CONFIG.timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            Tu organización comenzará con un período de prueba gratuito de{" "}
            {APP_CONFIG.trialDays} días en el plan Starter.
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
              "Crear Organización"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
