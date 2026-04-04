// =============================================================================
// /api/farms — Farm endpoints
// =============================================================================

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentTenantId } from "@/lib/tenant/context";
import { verifyTenantAccess } from "@/lib/db/tenant-db";
import { getFarms, createFarm } from "@/lib/farm/service";
import { createFarmSchema } from "@/lib/validations/schemas";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError("No autorizado", 401);

    const tenantId = await getCurrentTenantId();
    if (!tenantId) return apiError("Selecciona una organización", 400);

    const membership = await verifyTenantAccess(session.user.id, tenantId);
    if (!membership) return apiError("Sin acceso", 403);

    const farms = await getFarms(tenantId);
    return apiResponse({ farms });
  } catch (error) {
    console.error("GET /api/farms error:", error);
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
    const validation = createFarmSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.errors.map((e) => e.message).join(", "), 400);
    }

    const farm = await createFarm({
      tenantId,
      userId: session.user.id,
      ...validation.data,
    });

    return apiResponse({ farm, message: "Predio creado exitosamente" }, 201);
  } catch (error: any) {
    console.error("POST /api/farms error:", error);
    if (error.message?.includes("límite")) {
      return apiError(error.message, 403);
    }
    return apiError("Error interno", 500);
  }
}
