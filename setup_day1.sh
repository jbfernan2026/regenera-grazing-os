#!/bin/bash

# Regenera Grazing OS — Day 1 Setup Script
# Execute: bash setup_day1.sh

set -e  # Exit on error

echo "🚀 Regenera Grazing OS — Day 1 Setup"
echo "======================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create folder structure
echo -e "${YELLOW}Step 1: Creating folder structure...${NC}"
mkdir -p src/app/api
mkdir -p "src/app/(auth)"
mkdir -p "src/app/(dashboard)"
mkdir -p src/components/{ui,auth,layout,tenant}
mkdir -p src/lib/{auth,db,tenant,validations,utils}
mkdir -p src/config
mkdir -p prisma/seeds
mkdir -p docs
echo -e "${GREEN}✅ Folder structure created${NC}"
echo ""

# Step 2: Move schema.prisma
echo -e "${YELLOW}Step 2: Checking schema.prisma...${NC}"
if [ -f "prisma/schema.prisma" ]; then
  echo -e "${GREEN}✅ schema.prisma already in prisma/ directory${NC}"
else
  echo -e "${YELLOW}⚠️  schema.prisma not found in prisma/ directory${NC}"
fi
echo ""

# Step 3: Update .env.local
echo -e "${YELLOW}Step 3: Checking .env.local...${NC}"
if [ ! -f ".env.local" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env.local
    echo -e "${GREEN}✅ Created .env.local from .env.example${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Update .env.local with your Neon credentials${NC}"
  else
    echo -e "${YELLOW}⚠️  .env.example not found${NC}"
  fi
else
  echo -e "${GREEN}✅ .env.local exists${NC}"
fi
echo ""

# Step 4: Generate Prisma Client
echo -e "${YELLOW}Step 4: Generating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Prisma Client generated${NC}"
echo ""

# Step 5: Apply schema to database
echo -e "${YELLOW}Step 5: Applying schema to database...${NC}"
echo -e "${YELLOW}⚠️  Make sure DATABASE_URL is configured in .env.local${NC}"
npx prisma db push
echo -e "${GREEN}✅ Database schema applied${NC}"
echo ""

# Step 6: Create seed file
echo -e "${YELLOW}Step 6: Creating seed file...${NC}"
mkdir -p prisma/seeds
cat > prisma/seeds/seed.ts << 'SEED_EOF'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { name: 'starter' },
      update: {},
      create: {
        name: 'starter',
        displayName: 'Starter',
        description: 'Plan básico para comenzar',
        maxUsers: 3,
        maxFarms: 1,
        maxPaddocks: 20,
        maxStorage: 1024,
        priceMonthly: 0,
        priceYearly: 0,
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.plan.upsert({
      where: { name: 'professional' },
      update: {},
      create: {
        name: 'professional',
        displayName: 'Professional',
        description: 'Plan profesional con más capacidad',
        maxUsers: 15,
        maxFarms: 5,
        maxPaddocks: 200,
        maxStorage: 5120,
        gisAdvanced: true,
        longTermMonitoring: true,
        traceabilityLayer: true,
        priceMonthly: 4900,
        priceYearly: 47000,
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.plan.upsert({
      where: { name: 'enterprise' },
      update: {},
      create: {
        name: 'enterprise',
        displayName: 'Enterprise',
        description: 'Plan empresarial con todo incluido',
        maxUsers: 100,
        maxFarms: 50,
        maxPaddocks: 2000,
        maxStorage: 51200,
        gisAdvanced: true,
        longTermMonitoring: true,
        documentUpload: true,
        traceabilityLayer: true,
        exportAdvanced: true,
        apiAccess: true,
        whiteLabel: true,
        priceMonthly: 19900,
        priceYearly: 190000,
        isActive: true,
        sortOrder: 3,
      },
    }),
  ]);

  console.log(`✅ Created ${plans.length} plans`);

  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = 'Regenera2024!';

  try {
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: 'Super Admin',
        passwordHash: adminPassword,
        platformRole: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    console.log(`✅ Created super admin: ${admin.email}`);
    console.log(`⚠️  Default password: ${adminPassword} (CHANGE IMMEDIATELY)`);
  } catch (error) {
    console.error('Error creating admin:', error);
  }

  console.log('✨ Seeding complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
SEED_EOF
echo -e "${GREEN}✅ Seed file created${NC}"
echo ""

# Step 7: Run seed
echo -e "${YELLOW}Step 7: Running database seed...${NC}"
npm run db:seed
echo -e "${GREEN}✅ Database seeded${NC}"
echo ""

# Step 8: Git commit
echo -e "${YELLOW}Step 8: Creating Git commit...${NC}"
git add .
git commit -m "feat: Day 1 setup - Prisma schema and seed database

- Created folder structure (src/app, src/components, src/lib, etc.)
- Generated Prisma Client
- Connected to Neon PostgreSQL
- Created seed file with 3 Plans and super admin
- Database ready for development"
echo -e "${GREEN}✅ Git commit created${NC}"
echo ""

echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Day 1 Setup Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "1. Start Next.js dev server: npm run dev"
echo "2. Open http://localhost:3000"
echo "3. On Day 2, start Semana 1 Task 2 (NextAuth.js setup)"
echo ""