// =============================================================================
// Validation Schemas (Zod)
// =============================================================================
// Centralized validation for all Phase 1 forms and API inputs.
// These are used both client-side (React Hook Form) and server-side (API routes).
// =============================================================================

import { z } from "zod";
import { TenantRole } from "@prisma/client";

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Email inválido")
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "El nombre es requerido")
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre es demasiado largo"),
    email: z
      .string()
      .min(1, "El email es requerido")
      .email("Email inválido")
      .transform((v) => v.toLowerCase().trim()),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "La contraseña es demasiado larga")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Debe incluir mayúscula, minúscula y número"
      ),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// -----------------------------------------------------------------------------
// Tenant
// -----------------------------------------------------------------------------

export const createTenantSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre de la organización es requerido")
    .min(2, "Debe tener al menos 2 caracteres")
    .max(100, "El nombre es demasiado largo"),
  slug: z
    .string()
    .min(3, "El identificador debe tener al menos 3 caracteres")
    .max(48, "El identificador es demasiado largo")
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      "Solo letras minúsculas, números y guiones"
    ),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  country: z.string().default("CL"),
  timezone: z.string().default("America/Santiago"),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

// -----------------------------------------------------------------------------
// Invitation
// -----------------------------------------------------------------------------

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Email inválido")
    .transform((v) => v.toLowerCase().trim()),
  role: z.nativeEnum(TenantRole).refine(
    (role) => role !== TenantRole.OWNER,
    "No se puede asignar el rol de propietario"
  ),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

// -----------------------------------------------------------------------------
// Phase 2A: Whole Under Management
// -----------------------------------------------------------------------------

export const createWUMSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "Debe tener al menos 2 caracteres")
    .max(150, "El nombre es demasiado largo"),
  description: z.string().max(2000).optional().or(z.literal("")),
  exploitationType: z.enum(["PRIMARY_PRODUCTION", "VALUE_ADDED", "MIXED"]).default("PRIMARY_PRODUCTION"),
  totalAreaHa: z
    .number()
    .positive("La superficie debe ser positiva")
    .max(1000000, "Superficie demasiado grande")
    .optional()
    .nullable(),
  annualRainfallMm: z
    .number()
    .min(0, "No puede ser negativo")
    .max(15000, "Valor demasiado alto")
    .optional()
    .nullable(),
  seasonRainfallMm: z
    .number()
    .min(0, "No puede ser negativo")
    .max(10000, "Valor demasiado alto")
    .optional()
    .nullable(),
});

export const updateWUMSchema = createWUMSchema.partial();

export type CreateWUMInput = z.infer<typeof createWUMSchema>;
export type UpdateWUMInput = z.infer<typeof updateWUMSchema>;

// -----------------------------------------------------------------------------
// Phase 2A: Holistic Context
// -----------------------------------------------------------------------------

export const holisticContextSchema = z.object({
  qualityOfLife: z.string().max(5000).optional().or(z.literal("")),
  formsOfProduction: z.string().max(5000).optional().or(z.literal("")),
  futureResourceBase: z.string().max(5000).optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
});

export type HolisticContextInput = z.infer<typeof holisticContextSchema>;

// -----------------------------------------------------------------------------
// Phase 2A: Decision Makers
// -----------------------------------------------------------------------------

export const addDecisionMakerSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre es demasiado largo"),
  role: z.string().max(100).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
});

export type AddDecisionMakerInput = z.infer<typeof addDecisionMakerSchema>;

// -----------------------------------------------------------------------------
// Phase 2B: Farms (Predios)
// -----------------------------------------------------------------------------

export const createFarmSchema = z.object({
  wumId: z.string().uuid("Selecciona un Entero Bajo Manejo"),
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "Debe tener al menos 2 caracteres")
    .max(150, "El nombre es demasiado largo"),
  description: z.string().max(2000).optional().or(z.literal("")),
  country: z.string().default("CL"),
  region: z.string().max(100).optional().or(z.literal("")),
  commune: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  totalAreaHa: z.number().positive("Debe ser positivo").max(1000000).optional().nullable(),
  usableAreaHa: z.number().positive("Debe ser positivo").max(1000000).optional().nullable(),
  climateZone: z.string().max(100).optional().or(z.literal("")),
  avgAnnualTempC: z.number().min(-50).max(60).optional().nullable(),
  annualRainfallMm: z.number().min(0).max(15000).optional().nullable(),
  frostFreeDays: z.number().int().min(0).max(365).optional().nullable(),
  predominantSoilType: z.string().max(100).optional().or(z.literal("")),
  soilDepthCm: z.number().int().min(0).max(1000).optional().nullable(),
  organicMatterPct: z.number().min(0).max(100).optional().nullable(),
  waterSource: z.string().max(100).optional().or(z.literal("")),
  irrigationType: z.string().max(100).optional().or(z.literal("")),
  hasWaterRights: z.boolean().default(false),
  elevationM: z.number().int().min(0).max(9000).optional().nullable(),
});

export const updateFarmSchema = createFarmSchema.omit({ wumId: true }).partial();

export type CreateFarmInput = z.infer<typeof createFarmSchema>;
export type UpdateFarmInput = z.infer<typeof updateFarmSchema>;
