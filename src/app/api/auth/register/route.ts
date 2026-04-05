import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils";
import { PlatformRole, RegistrationStatus } from "@prisma/client";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validar solo los campos que enviamos desde el frontend
    const validation = z.object({
      name: z
        .string()
        .min(1, "El nombre es requerido")
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(100, "El nombre es demasiado largo"),
      email: z
        .string()
        .min(1, "El email es requerido")
        .email("Email inválido")
        .transform((v) => v.toLowerCase().trim()),
      password: z
        .string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .max(72, "La contraseña es demasiado larga"),
    }).safeParse(body);

    if (!validation.success) {
      return apiError(
        validation.error.errors.map((e) => e.message).join(", "),
        400
      );
    }

    const { name, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return apiError("Ya existe una cuenta con este email", 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Determine platform role
    const platformRole =
      process.env.PLATFORM_ADMIN_EMAIL &&
      email === process.env.PLATFORM_ADMIN_EMAIL.toLowerCase()
        ? PlatformRole.SUPER_ADMIN
        : PlatformRole.USER;

    // Determine registration status
    const registrationStatus =
      platformRole === PlatformRole.SUPER_ADMIN
        ? RegistrationStatus.APPROVED
        : RegistrationStatus.PENDING_APPROVAL;

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        platformRole,
        registrationStatus,
      },
      select: {
        id: true,
        name: true,
        email: true,
        platformRole: true,
        registrationStatus: true,
        createdAt: true,
      },
    });

    if (registrationStatus === RegistrationStatus.PENDING_APPROVAL) {
      return apiResponse(
        {
          user,
          status: "PENDING_APPROVAL",
          redirectTo: "/registration-pending",
          message: "Cuenta creada. Esperando aprobación del administrador.",
        },
        201
      );
    }

    return apiResponse(
      {
        user,
        status: "APPROVED",
        message: "Cuenta creada exitosamente",
      },
      201
    );
  } catch (error) {
    console.error("Registration error:", error);
    return apiError("Error interno del servidor", 500);
  }
}