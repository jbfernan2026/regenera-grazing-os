"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface User {
  id: string;
  email: string;
  name: string | null;
  platformRole: string;
  registrationStatus: string;
  createdAt: string;
}

type FilterStatus = "ALL" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("PENDING_APPROVAL");

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al cargar usuarios");
        return;
      }

      setUsers(data.users || []);
    } catch (err) {
      setError("Error al conectar con el servidor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "approve" }),
      });

      if (response.ok) {
        // Actualizar estado del usuario en la lista
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, registrationStatus: "APPROVED" } : u
          )
        );
      }
    } catch (err) {
      console.error("Error al aprobar:", err);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "reject" }),
      });

      if (response.ok) {
        setUsers(
          users.map((u) =>
            u.id === userId ? { ...u, registrationStatus: "REJECTED" } : u
          )
        );
      }
    } catch (err) {
      console.error("Error al rechazar:", err);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, method: "random" }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Contraseña restablecida y enviada al email del usuario`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Error al resetear contraseña:", err);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (filter === "ALL") return true;
    return user.registrationStatus === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Administración de Usuarios</h1>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {["ALL", "PENDING_APPROVAL", "APPROVED", "REJECTED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as FilterStatus)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {status === "ALL"
                ? "Todos"
                : status === "PENDING_APPROVAL"
                ? "Pendientes"
                : status === "APPROVED"
                ? "Aprobados"
                : "Rechazados"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded mb-6">{error}</div>
      )}

      <Card className="overflow-hidden">
        <div className="text-sm text-gray-600 p-4 border-b">
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </div>
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Email</th>
              <th className="px-6 py-3 text-left font-semibold">Nombre</th>
              <th className="px-6 py-3 text-left font-semibold">Fecha</th>
              <th className="px-6 py-3 text-left font-semibold">Rol</th>
              <th className="px-6 py-3 text-left font-semibold">Estado</th>
              <th className="px-6 py-3 text-left font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No hay usuarios en este estado
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{user.email}</td>
                  <td className="px-6 py-4 text-sm">{user.name || "-"}</td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {user.platformRole}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(
                        user.registrationStatus
                      )}`}
                    >
                      {user.registrationStatus === "PENDING_APPROVAL"
                        ? "Pendiente"
                        : user.registrationStatus === "APPROVED"
                        ? "Aprobado"
                        : "Rechazado"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {user.registrationStatus === "PENDING_APPROVAL" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(user.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReject(user.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Rechazar
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleResetPassword(user.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Reset Pass
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}