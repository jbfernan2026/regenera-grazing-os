import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ===== CREATE PLANS =====
  const freePlan = await prisma.plan.upsert({
    where: { name: "free" },
    update: {},
    create: {
      name: "free",
      displayName: "Gratis",
      description: "Para empezar",
      maxUsers: 3,
      maxFarms: 1,
      maxPaddocks: 5,
      maxStorage: 1024,
      gisAdvanced: false,
      longTermMonitoring: false,
      documentUpload: false,
      traceabilityLayer: false,
      exportAdvanced: false,
      apiAccess: false,
      whiteLabel: false,
      priceMonthly: 0,
      priceYearly: 0,
      isActive: true,
      sortOrder: 1,
    },
  });

  const starterPlan = await prisma.plan.upsert({
    where: { name: "starter" },
    update: {},
    create: {
      name: "starter",
      displayName: "Starter",
      description: "Para crecer",
      maxUsers: 10,
      maxFarms: 2,
      maxPaddocks: 15,
      maxStorage: 10240,
      gisAdvanced: true,
      longTermMonitoring: true,
      documentUpload: true,
      traceabilityLayer: false,
      exportAdvanced: false,
      apiAccess: false,
      whiteLabel: false,
      priceMonthly: 4900,
      priceYearly: 49000,
      isActive: true,
      sortOrder: 2,
    },
  });

  const premiumPlan = await prisma.plan.upsert({
    where: { name: "premium" },
    update: {},
    create: {
      name: "premium",
      displayName: "Premium",
      description: "Para empresas",
      maxUsers: 20,
      maxFarms: 5,
      maxPaddocks: 100,
      maxStorage: 102400,
      gisAdvanced: true,
      longTermMonitoring: true,
      documentUpload: true,
      traceabilityLayer: true,
      exportAdvanced: true,
      apiAccess: true,
      whiteLabel: true,
      priceMonthly: 9900,
      priceYearly: 99000,
      isActive: true,
      sortOrder: 3,
    },
  });

  console.log("✅ Plans created");

  // ===== CREATE SUPER ADMIN USER =====
  const adminPassword = await bcrypt.hash("Regenera2024!", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: process.env.PLATFORM_ADMIN_EMAIL || "admin@regenera.com" },
    update: {},
    create: {
      email: process.env.PLATFORM_ADMIN_EMAIL || "admin@regenera.com",
      name: "Super Admin",
      passwordHash: adminPassword,
      platformRole: "SUPER_ADMIN",
      registrationStatus: "APPROVED",
      isActive: true,
    },
  });

  console.log("✅ Admin user created:", adminUser.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("🎉 Seeding complete!");
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });