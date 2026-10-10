import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Uso: npx ts-node prisma/seed-admin.ts email@exemplo.com');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Utilizador ${email} não encontrado. Regista-o primeiro em POST /auth/register.`);
    process.exit(1);
  }

  await prisma.user.update({ where: { email }, data: { isAdmin: true } });
  console.log(`${email} é agora admin.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());