require('dotenv').config();

const bcrypt = require('bcryptjs');
const { prisma, pool } = require('../lib/prisma');

const EMAIL = 'sensei@budokan.com';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });

  if (!existing) {
    const password = await bcrypt.hash('budokan2025', 10);
    await prisma.user.create({
      data: {
        nombre: 'Sensei Budokan',
        email: EMAIL,
        password,
        rol: 'SENSEI',
      },
    });
  }

  console.log('Sensei creado correctamente');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
