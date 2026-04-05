import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils";
import { PlatformRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateRandomPassword, sendEmail } from "@/lib/email/service";

// POST /api/admin/users/reset-password — Resetear contraseña
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("No autenticado", 401);
    }

    // Verificar que es SUPER_ADMIN
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (admin?.platformRole !== PlatformRole.SUPER_ADMIN) {
      return apiError("Solo SUPER_ADMIN puede resetear contraseñas", 403);
    }

    const { userId, method } = await req.json();

    if (!userId || !method) {
      return apiError("Faltan parámetros", 400);
    }

    if (!["random", "link"].includes(method)) {
      return apiError("Método inválido", 400);
    }

    // Encontrar usuario
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return apiError("Usuario no encontrado", 404);
    }

    if (method === "random") {
      // Generar contraseña aleatoria
      const newPassword = generateRandomPassword();
      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Actualizar en BD
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      // Enviar email con nueva contraseña
      await sendEmail({
        to: targetUser.email,
        subject: "Tu contraseña en Regenera Grazing OS ha sido restablecida",
        type: "password-reset",
        data: {
          newPassword,
          userName: targetUser.name,
          message: "Tu contraseña temporal es:",
          instruction: "Por favor, cámbiala al iniciar sesión.",
        },
      });

      return apiResponse(
        {
          message: "Contraseña restablecida y enviada al email del usuario",
        },
        200
      );
    }

    // TODO: Implementar método "link" para que usuario elija su contraseña
    return apiError("Método 'link' aún no implementado", 501);
  } catch (error) {
    console.error("Reset password error:", error);
    return apiError("Error al resetear contraseña", 500);
  }
}