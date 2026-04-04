// =============================================================================
// /api/tenants — Tenant management endpoints
// =============================================================================

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { getUserTenants } from "@/lib/db/tenant-db";
import { createTenant, validateSlug } from "@/lib/tenant/service";
import { createTenantSchema } from "@/lib/validations/schemas";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * GET /api/tenants — List tenants for the current user
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("No autorizado", 401);
    }

    const memberships = await getUserTenants(session.user.id);

    return apiResponse({
      tenants: memberships.map((m) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        logoUrl: m.tenant.logoUrl,
        role: m.role,
        plan: m.tenant.plan.displayName,
        subscriptionStatus: m.tenant.subscriptionStatus,
        joinedAt: m.joinedAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/tenants error:", error);
    return apiError("Error interno", 500);
  }
}

/**
 * POST /api/tenants — Create a new tenant (organization)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("No autorizado", 401);
    }

    const body = await req.json();
    const validation = createTenantSchema.safeParse(body);

    if (!validation.success) {
      return apiError(
        validation.error.errors.map((e) => e.message).join(", "),
        400
      );
    }

    const { name, slug, email, country, timezone } = validation.data;

    // Validate slug
    const slugCheck = await validateSlug(slug);
    if (!slugCheck.valid) {
      return apiError(slugCheck.error!, 400);
    }

    // Create tenant with user as owner
    const tenant = await createTenant({
      name,
      slug,
      userId: session.user.id,
      email: email || undefined,
      country,
      timezone,
    });

    return apiResponse(
      {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        message: "Organización creada exitosamente",
      },
      201
    );
  } catch (error) {
    console.error("POST /api/tenants error:", error);
    return apiError("Error interno", 500);
  }
}
