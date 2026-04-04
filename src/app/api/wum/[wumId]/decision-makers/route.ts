// =============================================================================
// /api/wum/[wumId]/decision-makers — Decision Makers endpoints
// =============================================================================

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCurrentTenantId } from "@/lib/tenant/context";
import { verifyTenantAccess } from "@/lib/db/tenant-db";
import { addDecisionMaker, removeDecisionMaker } from "@/lib/wum/service";
import { addDecisionMakerSchema } from "@/lib/validations/schemas";
import { apiResponse, apiError } from "@/lib/utils";

export async function POST(
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
    const validation = addDecisionMakerSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.errors.map((e) => e.message).join(", "), 400);
    }

    const dm = await addDecisionMaker({
      tenantId,
      userId: session.user.id,
      wumId: params.wumId,
      ...validation.data,
    });

    return apiResponse({ decisionMaker: dm, message: "Tomador de decisiones agregado" }, 201);
  } catch (error) {
    console.error("POST /api/wum/[wumId]/decision-makers error:", error);
    return apiError("Error interno", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError("No autorizado", 401);

    const tenantId = await getCurrentTenantId();
    if (!tenantId) return apiError("Selecciona una organización", 400);

    const membership = await verifyTenantAccess(session.user.id, tenantId);
    if (!membership) return apiError("Sin acceso", 403);

    const { decisionMakerId } = await req.json();
    if (!decisionMakerId) return apiError("ID requerido", 400);

    await removeDecisionMaker({
      tenantId,
      userId: session.user.id,
      decisionMakerId,
    });

    return apiResponse({ message: "Eliminado exitosamente" });
  } catch (error) {
    console.error("DELETE /api/wum/[wumId]/decision-makers error:", error);
    return apiError("Error interno", 500);
  }
}
