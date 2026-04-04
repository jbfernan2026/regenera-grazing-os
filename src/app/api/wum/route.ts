// =============================================================================
// /api/wum — Whole Under Management endpoints
// =============================================================================

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentTenantId } from "@/lib/tenant/context";
import { verifyTenantAccess } from "@/lib/db/tenant-db";
import { getWUMs, createWUM } from "@/lib/wum/service";
import { createWUMSchema } from "@/lib/validations/schemas";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError("No autorizado", 401);

    const tenantId = await getCurrentTenantId();
    if (!tenantId) return apiError("Selecciona una organización", 400);

    const membership = await verifyTenantAccess(session.user.id, tenantId);
    if (!membership) return apiError("Sin acceso", 403);

    const wums = await getWUMs(tenantId);
    return apiResponse({ wums });
  } catch (error) {
    console.error("GET /api/wum error:", error);
    return apiError("Error interno", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError("No autorizado", 401);

    const tenantId = await getCurrentTenantId();
    if (!tenantId) return apiError("Selecciona una organización", 400);

    const membership = await verifyTenantAccess(session.user.id, tenantId);
    if (!membership) return apiError("Sin acceso", 403);

    const body = await req.json();
    const validation = createWUMSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.errors.map((e) => e.message).join(", "), 400);
    }

    const wum = await createWUM({
      tenantId,
      userId: session.user.id,
      ...validation.data,
    });

    return apiResponse({ wum, message: "Entero bajo manejo creado" }, 201);
  } catch (error) {
    console.error("POST /api/wum error:", error);
    return apiError("Error interno", 500);
  }
}
