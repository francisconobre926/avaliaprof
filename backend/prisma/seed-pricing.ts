import { PrismaClient, ListingPurpose } from '@prisma/client';

const prisma = new PrismaClient();
const DURATION_DAYS = 30;

// Faixas do DDR (secções 18 a 20): [mínimo exclusivo, máximo inclusivo, taxa normal em MT]
type Tier = [number | null, number | null, number];

const TABLES: Record<ListingPurpose, Tier[]> = {
  ARRENDAR: [
    [null, 2000, 50],
    [2000, 5000, 100],
    [5000, 10000, 150],
    [10000, 20000, 250],
    [20000, 50000, 400],
    [50000, null, 500],
  ],
  RESERVAR: [
    [null, 500, 50],
    [500, 1000, 75],
    [1000, 2500, 100],
    [2500, 5000, 150],
    [5000, 10000, 250],
    [10000, 20000, 350],
    [20000, null, 500],
  ],
  VENDER: [
    [null, 500000, 200],
    [500000, 1000000, 300],
    [1000000, 2500000, 500],
    [2500000, 5000000, 750],
    [5000000, 10000000, 1000],
    [10000000, null, 1500],
  ],
};

async function main() {
  const old = await prisma.pricingRule.updateMany({
    where: { categoryId: null, city: null, purpose: null, minPrice: null, maxPrice: null, isActive: true },
    data: { isActive: false },
  });
  console.log(`Regra geral antiga desativada: ${old.count}`);

  let created = 0;
  let updated = 0;
  for (const [purpose, tiers] of Object.entries(TABLES) as [ListingPurpose, Tier[]][]) {
    for (const [min, max, amount] of tiers) {
      const existing = await prisma.pricingRule.findFirst({
        where: { categoryId: null, city: null, purpose, minPrice: min, maxPrice: max },
      });
      if (existing) {
        if (Number(existing.amount) !== amount || !existing.isActive) {
          await prisma.pricingRule.update({
            where: { id: existing.id },
            data: { amount, isActive: true },
          });
          updated++;
        }
        continue;
      }
      await prisma.pricingRule.create({
        data: { purpose, minPrice: min, maxPrice: max, amount, durationDays: DURATION_DAYS },
      });
      created++;
    }
  }
  console.log(`Faixas criadas: ${created}, atualizadas: ${updated}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());