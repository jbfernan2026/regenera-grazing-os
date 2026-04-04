// =============================================================================
// /api/wum/[wumId] — Single WUM endpoints
// =============================================================================

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentTenantId } from "@/lib/tenant/context";
import { verifyTenantAccess } from "@/lib/db/tenant-db";
import { getWUM, updateWUM } from "@/lib/wum/service";
import { updateWUMSchema } from "@/lib/validations/schemas";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { wumId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError("No autorizado", 401);

    const tenantId = await getCurrentTenantId();
    if (!tenantId) return apiError("Selecciona una organización", 400);

    const membership = await verifyTenantAccess(session.user.id, tenantId);
    if (!membership) return apiError("Sin acceso", 403);

    const wum = await getWUM(tenantId, params.wumId);
    if (!wum) return apiError("Entero bajo manejo no encontrado", 404);

    return apiResponse({ wum });
  } catch (error) {
    console.error("GET /api/wum/[wumId] error:", error);
    return apiError("Error interno", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { wumId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError("No autorizado", 401);

    const tenantId = await getCurrentTenantId();
    if (!tenantId) return apiError("Selecciona una organización", 400);

    const membership = await verifyTenantAccess(session.user.id, tenantId);
    if (!membership) return apiError("Sin acceso", 403);

    const body = await req.json();
    const validation = updateWUMSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.errors.map((e) => e.message).join(", "), 400);
    }

    await updateWUM({
      tenantId,
      userId: session.user.id,
      wumId: params.wumId,
      data: validation.data,
    });

    return apiResponse({ message: "Actualizado exitosamente" });
  } catch (error) {
    console.error("PATCH /api/wum/[wumId] error:", error);
    return apiError("Error interno", 500);
  }
}
