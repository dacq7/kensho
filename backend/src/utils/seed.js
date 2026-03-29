require('dotenv').config();

const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');

const EMAIL = 'sensei@budokan.com';

async function main() {
  const password = await bcrypt.hash('budokan2025', 10);

  await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      tipoDocumento: 'CC',
      numeroDocumento: '00000000',
    },
    create: {
      nombre: 'Sensei Budokan',
      email: EMAIL,
      password,
      rol: 'SENSEI',
      tipoDocumento: 'CC',
      numeroDocumento: '00000000',
    },
  });

  console.log('Sensei creado correctamente');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
