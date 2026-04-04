// =============================================================================
// Farm Service — Business Logic
// =============================================================================

import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/db/tenant-db";

/**
 * Create a new farm within a Whole Under Management.
 */
export async function createFarm(params: {
  tenantId: string;
  userId: string;
  wumId: string;
  name: string;
  description?: string;
  country?: string;
  region?: string;
  commune?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  totalAreaHa?: number;
  usableAreaHa?: number;
  climateZone?: string;
  avgAnnualTempC?: number;
  annualRainfallMm?: number;
  frostFreeDays?: number;
  predominantSoilType?: string;
  soilDepthCm?: number;
  organicMatterPct?: number;
  waterSource?: string;
  irrigationType?: string;
  hasWaterRights?: boolean;
  elevationM?: number;
}) {
  // Verify the WUM belongs to this tenant
  const wum = await prisma.wholeUnderManagement.findFirst({
    where: { id: params.wumId, tenantId: params.tenantId, isActive: true },
  });

  if (!wum) {
    throw new Error("Entero bajo manejo no encontrado");
  }

  // Check plan limits
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
    include: {
      plan: { select: { maxFarms: true } },
      _count: { select: { farms: { where: { isActive: true } } } },
    },
  });

  if (tenant && tenant._count.farms >= tenant.plan.maxFarms) {
    throw new Error(
      `Has alcanzado el límite de ${tenant.plan.maxFarms} predio(s) en tu plan. Actualiza tu plan para agregar más.`
    );
  }

  const farm = await prisma.farm.create({
    data: {
      tenantId: params.tenantId,
      wumId: params.wumId,
      name: params.name,
      description: params.description,
      country: params.country ?? "CL",
      region: params.region,
      commune: params.commune,
      address: params.address,
      latitude: params.latitude,
      longitude: params.longitude,
      totalAreaHa: params.totalAreaHa,
      usableAreaHa: params.usableAreaHa,
      climateZone: params.climateZone,
      avgAnnualTempC: params.avgAnnualTempC,
      annualRainfallMm: params.annualRainfallMm,
      frostFreeDays: params.frostFreeDays,
      predominantSoilType: params.predominantSoilType,
      soilDepthCm: params.soilDepthCm,
      organicMatterPct: params.organicMatterPct,
      waterSource: params.waterSource,
      irrigationType: params.irrigationType,
      hasWaterRights: params.hasWaterRights ?? false,
      elevationM: params.elevationM,
    },
  });

  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: "farm.created",
    entity: "farm",
    entityId: farm.id,
    metadata: { name: params.name, wumId: params.wumId },
  }).catch(console.error);

  return farm;
}

/**
 * Get all farms for a tenant.
 */
export async function getFarms(tenantId: string) {
  return prisma.farm.findMany({
    where: { tenantId, isActive: true },
    include: {
      wum: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Get a single farm with full details.
 */
export async function getFarm(tenantId: string, farmId: string) {
  return prisma.farm.findFirst({
    where: { id: farmId, tenantId, isActive: true },
    include: {
      wum: {
        select: { id: true, name: true },
      },
    },
  });
}

/**
 * Update a farm.
 */
export async function updateFarm(params: {
  tenantId: string;
  userId: string;
  farmId: string;
  data: Record<string, unknown>;
}) {
  const result = await prisma.farm.updateMany({
    where: { id: params.farmId, tenantId: params.tenantId },
    data: params.data,
  });

  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: "farm.updated",
    entity: "farm",
    entityId: params.farmId,
    metadata: params.data,
  }).catch(console.error);

  return result;
}

/**
 * Get farms grouped by WUM for a tenant.
 */
export async function getFarmsByWUM(tenantId: string) {
  const wums = await prisma.wholeUnderManagement.findMany({
    where: { tenantId, isActive: true },
    include: {
      farms: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return wums;
}
