require('dotenv').config();

const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');

const EMAIL = 'karateca@budokan.com';
const PASSWORD = 'karate2025';

async function main() {
  const existente = await prisma.user.findUnique({
    where: { email: EMAIL },
  });

  if (existente) {
    console.log('Karateca ya existe');
    return;
  }

  const hashed = await bcrypt.hash(PASSWORD, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        nombre: 'Karateca Prueba',
        email: EMAIL,
        password: hashed,
        rol: 'KARATECA',
      },
    });

    await tx.karateca.create({
      data: {
        userId: user.id,
        kyuActual: '5kyu',
      },
    });
  });

  console.log('Karateca de prueba creado: karateca@budokan.com / karate2025');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
