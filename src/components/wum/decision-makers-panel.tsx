"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addDecisionMakerSchema,
  type AddDecisionMakerInput,
} from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Users } from "lucide-react";

interface DecisionMaker {
  id: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface DecisionMakersPanelProps {
  wumId: string;
  decisionMakers: DecisionMaker[];
}

export function DecisionMakersPanel({
  wumId,
  decisionMakers,
}: DecisionMakersPanelProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddDecisionMakerInput>({
    resolver: zodResolver(addDecisionMakerSchema),
  });

  async function onSubmit(data: AddDecisionMakerInput) {
    try {
      const res = await fetch(`/api/wum/${wumId}/decision-makers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        reset();
        setShowForm(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error adding decision maker:", error);
    }
  }

  async function handleRemove(decisionMakerId: string) {
    setRemoving(decisionMakerId);
    try {
      await fetch(`/api/wum/${wumId}/decision-makers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionMakerId }),
      });
      router.refresh();
    } catch (error) {
      console.error("Error removing decision maker:", error);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tomadores de Decisiones
            </CardTitle>
            <CardDescription className="mt-1">
              Personas que participan en la definición del contexto holístico y
              las decisiones de manejo.
            </CardDescription>
          </div>
          {!showForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Agregar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* List */}
        {decisionMakers.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aún no hay tomadores de decisiones registrados.
          </p>
        ) : (
          <div className="space-y-2 mb-4">
            {decisionMakers.map((dm) => (
              <div
                key={dm.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{dm.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {dm.role && (
                      <span className="text-xs text-muted-foreground">
                        {dm.role}
                      </span>
                    )}
                    {dm.email && (
                      <span className="text-xs text-muted-foreground">
                        {dm.email}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(dm.id)}
                  disabled={removing === dm.id}
                  className="text-muted-foreground hover:text-red-500 transition-colors"
                >
                  {removing === dm.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-3 rounded-lg border border-dashed p-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dm-name" className="text-xs">
                  Nombre *
                </Label>
                <Input
                  id="dm-name"
                  placeholder="Juan Pérez"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="dm-role" className="text-xs">
                  Rol
                </Label>
                <Input
                  id="dm-role"
                  placeholder="Propietario, Administrador..."
                  {...register("role")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dm-email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="dm-email"
                  type="email"
                  placeholder="juan@email.com"
                  {...register("email")}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dm-phone" className="text-xs">
                  Teléfono
                </Label>
                <Input
                  id="dm-phone"
                  placeholder="+56 9 1234 5678"
                  {...register("phone")}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                className="bg-regenera-600 hover:bg-regenera-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Agregar"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  reset();
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
