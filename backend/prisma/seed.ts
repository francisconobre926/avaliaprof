import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  'Casa',
  'Apartamento',
  'Quarto',
  'Moradia',
  'Terreno',
  'Loja/espaço comercial',
  'Escritório',
  'Sala de formação/reunião',
  'Espaço para eventos/casamentos',
  'Estúdio',
  'Pensão/alojamento',
];

async function main() {
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✔ ${categories.length} categorias inseridas/confirmadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });