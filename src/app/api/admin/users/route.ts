import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils";
import { PlatformRole, RegistrationStatus } from "@prisma/client";
import { sendEmail } from "@/lib/email/service";

// GET /api/admin/users — Lista usuarios pendientes
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return apiError("No autenticado", 401);
    }

    // Verificar que es SUPER_ADMIN
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (user?.platformRole !== PlatformRole.SUPER_ADMIN) {
      return apiError("Solo SUPER_ADMIN puede ver usuarios", 403);
    }

    // Obtener usuarios pendientes
    const pendingUsers = await prisma.user.findMany({
      where: {
        registrationStatus: RegistrationStatus.PENDING_APPROVAL,
      },
      select: {
        id: true,
        email: true,
        name: true,
        platformRole: true,
        registrationStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return apiResponse({ users: pendingUsers }, 200);
  } catch (error) {
    console.error("Get users error:", error);
    return apiError("Error al obtener usuarios", 500);
  }
}

// PATCH /api/admin/users — Aprobar/Rechazar usuario
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return apiError("No autenticado", 401);
    }

    // Verificar que es SUPER_ADMIN
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (admin?.platformRole !== PlatformRole.SUPER_ADMIN) {
      return apiError("Solo SUPER_ADMIN puede aprobar usuarios", 403);
    }

    const { userId, action } = await req.json();

    if (!userId || !action) {
      return apiError("Faltan parámetros", 400);
    }

    if (!["approve", "reject"].includes(action)) {
      return apiError("Acción inválida", 400);
    }

    // Encontrar usuario
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return apiError("Usuario no encontrado", 404);
    }

    // Actualizar estado
    const newStatus =
      action === "approve"
        ? RegistrationStatus.APPROVED
        : RegistrationStatus.REJECTED;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { registrationStatus: newStatus },
      select: {
        id: true,
        email: true,
        name: true,
        registrationStatus: true,
      },
    });

    // Enviar email según acción
    if (action === "approve") {
      await sendEmail({
        to: targetUser.email,
        subject: "¡Tu cuenta en Regenera Grazing OS ha sido aprobada!",
        type: "approval",
        data: {
          userName: targetUser.name,
          message: "Tu cuenta ha sido aprobada. Ya puedes acceder a la plataforma.",
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        },
      });
    } else {
      await sendEmail({
        to: targetUser.email,
        subject: "Tu solicitud en Regenera Grazing OS ha sido rechazada",
        type: "rejection",
        data: {
          userName: targetUser.name,
          message: "Lamentablemente, tu solicitud ha sido rechazada.",
        },
      });
    }

    return apiResponse(
      {
        user: updatedUser,
        message:
          action === "approve"
            ? "Usuario aprobado y email enviado"
            : "Usuario rechazado y email enviado",
      },
      200
    );
  } catch (error) {
    console.error("Update user error:", error);
    return apiError("Error al actualizar usuario", 500);
  }
}