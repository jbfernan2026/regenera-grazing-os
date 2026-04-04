"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email o contraseña incorrectos");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-regenera-400"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-300">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-regenera-400"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-red-300">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-regenera-600 hover:bg-regenera-500 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>

          <p className="text-center text-sm text-white/50">
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="text-regenera-300 hover:text-regenera-200 underline-offset-4 hover:underline"
            >
              Regístrate
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
