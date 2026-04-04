// =============================================================================
// Database Seed — Plans + Optional Super Admin
// =============================================================================
// Run with: npm run db:seed
// =============================================================================

import { PrismaClient, PlatformRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // -------------------------------------------------------------------------
  // 1. Create SaaS Plans
  // -------------------------------------------------------------------------
  const plans = [
    {
      name: "starter",
      displayName: "Starter",
      description: "Para productores individuales y predios pequeños",
      maxUsers: 3,
      maxFarms: 1,
      maxPaddocks: 20,
      maxStorage: 512, // MB
      gisAdvanced: false,
      longTermMonitoring: false,
      documentUpload: false,
      traceabilityLayer: false,
      exportAdvanced: false,
      apiAccess: false,
      whiteLabel: false,
      priceMonthly: 0, // Free during beta
      priceYearly: 0,
      sortOrder: 1,
    },
    {
      name: "professional",
      displayName: "Professional",
      description:
        "Para empresas ganaderas y asesores con múltiples predios",
      maxUsers: 15,
      maxFarms: 5,
      maxPaddocks: 200,
      maxStorage: 5120, // 5 GB
      gisAdvanced: true,
      longTermMonitoring: true,
      documentUpload: true,
      traceabilityLayer: true,
      exportAdvanced: true,
      apiAccess: false,
      whiteLabel: false,
      priceMonthly: 4900, // $49 USD
      priceYearly: 47000, // $470 USD (20% off)
      sortOrder: 2,
    },
    {
      name: "enterprise",
      displayName: "Enterprise",
      description:
        "Para redes de predios, organizaciones y consultoras a escala",
      maxUsers: 100,
      maxFarms: 50,
      maxPaddocks: 2000,
      maxStorage: 51200, // 50 GB
      gisAdvanced: true,
      longTermMonitoring: true,
      documentUpload: true,
      traceabilityLayer: true,
      exportAdvanced: true,
      apiAccess: true,
      whiteLabel: true,
      priceMonthly: 19900, // $199 USD
      priceYearly: 190000, // $1900 USD (20% off)
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.plan.findUnique({
      where: { name: plan.name },
    });

    if (existing) {
      await prisma.plan.update({
        where: { name: plan.name },
        data: plan,
      });
      console.log(`  ✅ Plan "${plan.displayName}" updated`);
    } else {
      await prisma.plan.create({ data: plan });
      console.log(`  ✅ Plan "${plan.displayName}" created`);
    }
  }

  // -------------------------------------------------------------------------
  // 2. Create Super Admin (if PLATFORM_ADMIN_EMAIL is set)
  // -------------------------------------------------------------------------
  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL;
  if (adminEmail) {
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase() },
    });

    if (!existing) {
      // Default password: "Regenera2024!" — CHANGE IN PRODUCTION
      const passwordHash = await bcrypt.hash("Regenera2024!", 12);

      await prisma.user.create({
        data: {
          name: "Platform Admin",
          email: adminEmail.toLowerCase(),
          passwordHash,
          platformRole: PlatformRole.SUPER_ADMIN,
        },
      });
      console.log(`  ✅ Super Admin created: ${adminEmail}`);
      console.log(`  ⚠️  Default password: Regenera2024! — CHANGE THIS!`);
    } else {
      // Ensure super admin role
      await prisma.user.update({
        where: { email: adminEmail.toLowerCase() },
        data: { platformRole: PlatformRole.SUPER_ADMIN },
      });
      console.log(`  ✅ Super Admin confirmed: ${adminEmail}`);
    }
  }

  // -------------------------------------------------------------------------
  // 3. Phase 2A: Seed Whole Under Management for Fundación Origen
  // -------------------------------------------------------------------------
  // Find the Fundacion Origen tenant
  const fundacionOrigen = await prisma.tenant.findFirst({
    where: { slug: "fundacion-origen" },
  });

  if (fundacionOrigen) {
    // Check if WUM already exists
    const existingWUM = await prisma.wholeUnderManagement.findFirst({
      where: { tenantId: fundacionOrigen.id, name: "Célula Pirque" },
    });

    if (!existingWUM) {
      const wum = await prisma.wholeUnderManagement.create({
        data: {
          tenantId: fundacionOrigen.id,
          name: "Célula Pirque",
          description:
            "Unidad de manejo regenerativo en Campus Pirque, Fundación Origen. " +
            "Sistema diversificado con ganadería caprina, avicultura, horticultura " +
            "y frutales bajo manejo holístico integrado. Escuela Agroecológica " +
            "de Pirque con 35 años de trayectoria.",
          exploitationType: "MIXED",
          totalAreaHa: 8.5,
          annualRainfallMm: 312,
          seasonRainfallMm: 240,
        },
      });

      // Create Holistic Context
      await prisma.holisticContext.create({
        data: {
          wumId: wum.id,
          tenantId: fundacionOrigen.id,
          qualityOfLife:
            "Queremos vivir y trabajar en un espacio educativo que forme a las " +
            "nuevas generaciones en agroecología y manejo regenerativo. Valoramos " +
            "la conexión con la tierra, la comunidad y la producción de alimentos " +
            "sanos. Buscamos un equilibrio entre la vida laboral en el campo y " +
            "el tiempo personal y familiar.",
          formsOfProduction:
            "Producción de leche caprina y quesos artesanales, huevos de gallinas " +
            "en pastoreo, hortalizas de temporada, frutales y hierbas medicinales. " +
            "Servicios educativos a través de la Escuela Agroecológica. " +
            "Ecoturismo y visitas guiadas al campus. Procesamiento de valor " +
            "agregado: quesos, conservas, y productos deshidratados.",
          futureResourceBase:
            "Suelos vivos con alta materia orgánica y actividad biológica. " +
            "Ciclo del agua restaurado con infiltración máxima y escorrentía mínima. " +
            "Biodiversidad creciente: aves silvestres, insectos benéficos, " +
            "flora nativa en los bordes. Praderas perennes diversas que soporten " +
            "pastoreo holístico sin degradación. Comunidad educativa consolidada " +
            "que replique el modelo en otros territorios.",
          notes:
            "Contexto definido por el equipo de planificación de Fundación Origen. " +
            "Revisar anualmente al inicio de la temporada de crecimiento.",
          lastReviewedAt: new Date(),
        },
      });

      // Create Decision Makers
      await prisma.decisionMaker.createMany({
        data: [
          {
            tenantId: fundacionOrigen.id,
            wumId: wum.id,
            name: "Jaime Fernández López",
            role: "Director de Proyectos",
            email: "jaime@revolucionmarron.cl",
          },
          {
            tenantId: fundacionOrigen.id,
            wumId: wum.id,
            name: "Equipo Fundación Origen",
            role: "Equipo de planificación",
          },
        ],
      });

      console.log(`  ✅ WUM "Célula Pirque" created for Fundación Origen`);
      console.log(`  ✅ Holistic Context seeded`);
      console.log(`  ✅ Decision Makers seeded`);

      // Phase 2B: Create Campus Pirque farm
      await prisma.farm.create({
        data: {
          tenantId: fundacionOrigen.id,
          wumId: wum.id,
          name: "Campus Pirque",
          description:
            "Predio principal de Fundación Origen. Campus educativo agroecológico " +
            "con ganadería caprina, avicultura de pastoreo, huerta diversificada, " +
            "frutales y hierbas medicinales. Sede de la Escuela Agroecológica de Pirque.",
          country: "CL",
          region: "Metropolitana",
          commune: "Pirque",
          address: "Camino Viejo a Pirque",
          latitude: -33.6667,
          longitude: -70.5833,
          totalAreaHa: 8.5,
          usableAreaHa: 6.2,
          climateZone: "Mediterráneo semiárido",
          avgAnnualTempC: 14.2,
          annualRainfallMm: 312,
          frostFreeDays: 280,
          predominantSoilType: "Franco arcilloso aluvial",
          soilDepthCm: 80,
          organicMatterPct: 3.2,
          waterSource: "Canal de riego (Río Maipo)",
          irrigationType: "Surco y goteo",
          hasWaterRights: true,
          elevationM: 680,
        },
      });
      console.log(`  ✅ Farm "Campus Pirque" created`);
    } else {
      console.log(`  ✅ WUM "Célula Pirque" already exists — skipped`);
    }
  } else {
    console.log(`  ⚠️  Tenant "Fundacion Origen" not found — skipping WUM seed`);
    console.log(`     Create the tenant first via the UI, then re-run seed.`);
  }

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
