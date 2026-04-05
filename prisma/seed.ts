import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Plans
  const starter = await prisma.plan.upsert({
    where: { name: "starter" },
    update: {},
    create: {
      name: "starter",
      displayName: "Starter",
      description: "Plan básico para comenzar",
      maxUsers: 3,
      maxFarms: 1,
      maxPaddocks: 20,
      priceMonthly: 0,
      isActive: true,
      sortOrder: 1,
    },
  });

  const professional = await prisma.plan.upsert({
    where: { name: "professional" },
    update: {},
    create: {
      name: "professional",
      displayName: "Professional",
      description: "Plan profesional con más features",
      maxUsers: 10,
      maxFarms: 5,
      maxPaddocks: 100,
      gisAdvanced: true,
      priceMonthly: 2900,
      isActive: true,
      sortOrder: 2,
    },
  });

  const enterprise = await prisma.plan.upsert({
    where: { name: "enterprise" },
    update: {},
    create: {
      name: "enterprise",
      displayName: "Enterprise",
      description: "Plan empresarial con todas las features",
      maxUsers: 100,
      maxFarms: 50,
      maxPaddocks: 1000,
      gisAdvanced: true,
      longTermMonitoring: true,
      documentUpload: true,
      traceabilityLayer: true,
      exportAdvanced: true,
      apiAccess: true,
      whiteLabel: true,
      priceMonthly: 9900,
      isActive: true,
      sortOrder: 3,
    },
  });

  // Create Super Admin User
  const superAdminEmail = process.env.PLATFORM_ADMIN_EMAIL || "jaime@revolucionmarron.cl";
  const passwordHash = await bcrypt.hash("Regenera2024!", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: { passwordHash },
    create: {
      email: superAdminEmail,
      name: "Jaime Fernández",
      passwordHash,
      platformRole: "SUPER_ADMIN",
      registrationStatus: "APPROVED",
      isActive: true,
    },
  });

  console.log("✅ Plans created");
  console.log("✅ Super Admin created:", superAdmin.email);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });