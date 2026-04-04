// =============================================================================
// Whole Under Management Service
// =============================================================================

import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/db/tenant-db";
import { ExploitationType } from "@prisma/client";

/**
 * Create a new Whole Under Management (grazing cell / production unit).
 */
export async function createWUM(params: {
  tenantId: string;
  userId: string;
  name: string;
  description?: string;
  exploitationType?: ExploitationType;
  totalAreaHa?: number;
  annualRainfallMm?: number;
  seasonRainfallMm?: number;
}) {
  const wum = await prisma.wholeUnderManagement.create({
    data: {
      tenantId: params.tenantId,
      name: params.name,
      description: params.description,
      exploitationType: params.exploitationType ?? ExploitationType.PRIMARY_PRODUCTION,
      totalAreaHa: params.totalAreaHa,
      annualRainfallMm: params.annualRainfallMm,
      seasonRainfallMm: params.seasonRainfallMm,
    },
  });

  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: "wum.created",
    entity: "whole_under_management",
    entityId: wum.id,
    metadata: { name: params.name },
  }).catch(console.error);

  return wum;
}

/**
 * Get all WUMs for a tenant.
 */
export async function getWUMs(tenantId: string) {
  return prisma.wholeUnderManagement.findMany({
    where: { tenantId, isActive: true },
    include: {
      holisticContext: {
        select: {
          id: true,
          lastReviewedAt: true,
          updatedAt: true,
        },
      },
      decisionMakers: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      _count: {
        select: {
          decisionMakers: { where: { isActive: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Get a single WUM with full details.
 */
export async function getWUM(tenantId: string, wumId: string) {
  return prisma.wholeUnderManagement.findFirst({
    where: { id: wumId, tenantId, isActive: true },
    include: {
      holisticContext: true,
      decisionMakers: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/**
 * Update a WUM.
 */
export async function updateWUM(params: {
  tenantId: string;
  userId: string;
  wumId: string;
  data: {
    name?: string;
    description?: string;
    exploitationType?: ExploitationType;
    totalAreaHa?: number | null;
    annualRainfallMm?: number | null;
    seasonRainfallMm?: number | null;
  };
}) {
  const wum = await prisma.wholeUnderManagement.updateMany({
    where: { id: params.wumId, tenantId: params.tenantId },
    data: params.data,
  });

  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: "wum.updated",
    entity: "whole_under_management",
    entityId: params.wumId,
    metadata: params.data,
  }).catch(console.error);

  return wum;
}

/**
 * Upsert the Holistic Context for a WUM.
 */
export async function upsertHolisticContext(params: {
  tenantId: string;
  userId: string;
  wumId: string;
  qualityOfLife?: string;
  formsOfProduction?: string;
  futureResourceBase?: string;
  notes?: string;
}) {
  const context = await prisma.holisticContext.upsert({
    where: { wumId: params.wumId },
    create: {
      wumId: params.wumId,
      tenantId: params.tenantId,
      qualityOfLife: params.qualityOfLife,
      formsOfProduction: params.formsOfProduction,
      futureResourceBase: params.futureResourceBase,
      notes: params.notes,
      lastReviewedAt: new Date(),
    },
    update: {
      qualityOfLife: params.qualityOfLife,
      formsOfProduction: params.formsOfProduction,
      futureResourceBase: params.futureResourceBase,
      notes: params.notes,
      lastReviewedAt: new Date(),
    },
  });

  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: "holistic_context.updated",
    entity: "holistic_context",
    entityId: context.id,
    metadata: { wumId: params.wumId },
  }).catch(console.error);

  return context;
}

/**
 * Add a decision maker to a WUM.
 */
export async function addDecisionMaker(params: {
  tenantId: string;
  userId: string;
  wumId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedUserId?: string;
}) {
  const dm = await prisma.decisionMaker.create({
    data: {
      tenantId: params.tenantId,
      wumId: params.wumId,
      name: params.name,
      role: params.role,
      email: params.email,
      phone: params.phone,
      userId: params.linkedUserId,
    },
  });

  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: "decision_maker.added",
    entity: "decision_maker",
    entityId: dm.id,
    metadata: { name: params.name, wumId: params.wumId },
  }).catch(console.error);

  return dm;
}

/**
 * Remove a decision maker (soft delete).
 */
export async function removeDecisionMaker(params: {
  tenantId: string;
  userId: string;
  decisionMakerId: string;
}) {
  await prisma.decisionMaker.updateMany({
    where: { id: params.decisionMakerId, tenantId: params.tenantId },
    data: { isActive: false },
  });

  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: "decision_maker.removed",
    entity: "decision_maker",
    entityId: params.decisionMakerId,
  }).catch(console.error);
}
