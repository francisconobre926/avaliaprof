import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GENERAL_PRICE_MT = 100; // valor de exemplo, altera quando o DDR definir
const DURATION_DAYS = 30;

async function main() {
  // Regra geral: sem categoria e sem cidade
  const existing = await prisma.pricingRule.findFirst({
    where: { categoryId: null, city: null },
  });

  if (existing) {
    console.log('Preço geral já existe, nada a fazer.');
    return;
  }

  await prisma.pricingRule.create({
    data: { amount: GENERAL_PRICE_MT, durationDays: DURATION_DAYS },
  });
  console.log(`Preço geral criado: ${GENERAL_PRICE_MT} MT por ${DURATION_DAYS} dias.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());