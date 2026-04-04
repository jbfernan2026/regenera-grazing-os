// =============================================================================
// /api/wum/[wumId]/context — Holistic Context endpoints
// =============================================================================

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentTenantId } from "@/lib/tenant/context";
import { verifyTenantAccess } from "@/lib/db/tenant-db";
import { upsertHolisticContext } from "@/lib/wum/service";
import { holisticContextSchema } from "@/lib/validations/schemas";
import { apiResponse, apiError } from "@/lib/utils";

export async function PUT(
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
    const validation = holisticContextSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.errors.map((e) => e.message).join(", "), 400);
    }

    const context = await upsertHolisticContext({
      tenantId,
      userId: session.user.id,
      wumId: params.wumId,
      ...validation.data,
    });

    return apiResponse({ context, message: "Contexto holístico actualizado" });
  } catch (error) {
    console.error("PUT /api/wum/[wumId]/context error:", error);
    return apiError("Error interno", 500);
  }
}
