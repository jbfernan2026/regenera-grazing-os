// =============================================================================
// POST /api/tenants/switch — Switch active tenant
// =============================================================================

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { verifyTenantAccess } from "@/lib/db/tenant-db";
import { setActiveTenant } from "@/lib/tenant/context";
import { apiResponse, apiError } from "@/lib/utils";
import { isPlatformAdmin } from "@/lib/auth/permissions";
import { PlatformRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("No autorizado", 401);
    }

    const { tenantId } = await req.json();

    if (!tenantId) {
      return apiError("tenantId es requerido", 400);
    }

    // Verify access (unless super admin)
    if (!isPlatformAdmin(session.user.platformRole as PlatformRole)) {
      const membership = await verifyTenantAccess(session.user.id, tenantId);
      if (!membership) {
        return apiError("No tienes acceso a esta organización", 403);
      }
    }

    await setActiveTenant(tenantId);

    return apiResponse({ success: true, tenantId });
  } catch (error) {
    console.error("Tenant switch error:", error);
    return apiError("Error interno", 500);
  }
}
