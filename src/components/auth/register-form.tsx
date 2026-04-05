"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validaciones básicas
      if (!name.trim()) {
        setError("El nombre es requerido");
        setLoading(false);
        return;
      }

      if (!email.trim()) {
        setError("El email es requerido");
        setLoading(false);
        return;
      }

      if (!password) {
        setError("La contraseña es requerida");
        setLoading(false);
        return;
      }

      if (password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        setLoading(false);
        return;
      }

      // Enviar al API
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const data = await response.json();

console.log("API Response:", { status: response.status, data });

if (!response.ok) {
  const errorMsg = data.error || data.message || "Error en el registro";
  console.error("API Error:", errorMsg);
  setError(errorMsg);
  setLoading(false);
  return;
}

      // Si el status es PENDING_APPROVAL, redirigir a página de confirmación
      if (data.status === "PENDING_APPROVAL") {
  console.log("Redirigiendo a /registration-pending");
  setTimeout(() => {
    router.push("/registration-pending");
  }, 500);
  return;
}

      // Si es APPROVED, redirigir al login
      if (data.status === "APPROVED") {
        router.push("/login");
        return;
      }

      // Fallback
      router.push("/login");
    } catch (err) {
      setError("Error en el registro. Intenta de nuevo.");
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="name" className="text-green-100">
          Nombre completo
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Juan Pérez"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          className="bg-green-700 border-green-600 text-white placeholder-green-400"
        />
      </div>

      <div>
        <Label htmlFor="email" className="text-green-100">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="bg-green-700 border-green-600 text-white placeholder-green-400"
        />
      </div>

      <div>
        <Label htmlFor="password" className="text-green-100">
          Contraseña
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className="bg-green-700 border-green-600 text-white placeholder-green-400"
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword" className="text-green-100">
          Confirmar contraseña
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
          className="bg-green-700 border-green-600 text-white placeholder-green-400"
        />
      </div>

      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {loading ? "Creando cuenta..." : "Registrarse"}
      </Button>

      <p className="text-center text-sm text-green-200">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-green-400 hover:text-green-300 underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}