// =============================================================================
// /api/farms/[farmId] — Single Farm endpoints
// =============================================================================

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentTenantId } from "@/lib/tenant/context";
import { verifyTenantAccess } from "@/lib/db/tenant-db";
import { getFarm, updateFarm } from "@/lib/farm/service";
import { updateFarmSchema } from "@/lib/validations/schemas";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { farmId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError("No autorizado", 401);

    const tenantId = await getCurrentTenantId();
    if (!tenantId) return apiError("Selecciona una organización", 400);

    const membership = await verifyTenantAccess(session.user.id, tenantId);
    if (!membership) return apiError("Sin acceso", 403);

    const farm = await getFarm(tenantId, params.farmId);
    if (!farm) return apiError("Predio no encontrado", 404);

    return apiResponse({ farm });
  } catch (error) {
    console.error("GET /api/farms/[farmId] error:", error);
    return apiError("Error interno", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { farmId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError("No autorizado", 401);

    const tenantId = await getCurrentTenantId();
    if (!tenantId) return apiError("Selecciona una organización", 400);

    const membership = await verifyTenantAccess(session.user.id, tenantId);
    if (!membership) return apiError("Sin acceso", 403);

    const body = await req.json();
    const validation = updateFarmSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.errors.map((e) => e.message).join(", "), 400);
    }

    await updateFarm({
      tenantId,
      userId: session.user.id,
      farmId: params.farmId,
      data: validation.data,
    });

    return apiResponse({ message: "Predio actualizado" });
  } catch (error) {
    console.error("PATCH /api/farms/[farmId] error:", error);
    return apiError("Error interno", 500);
  }
}
