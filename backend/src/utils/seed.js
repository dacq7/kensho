require('dotenv').config();

const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');

const nombre = process.env.SENSEI_NOMBRE || 'Sensei Budokan';
const tipoDocumento = process.env.SENSEI_TIPO_DOC || 'CC';
const numeroDocumento = process.env.SENSEI_DOCUMENTO || '00000000';
const passwordPlana = process.env.SENSEI_PASSWORD || 'budokan2025';
const email = process.env.SENSEI_EMAIL || 'sensei@budokan.com';

async function main() {
  const password = await bcrypt.hash(passwordPlana, 10);

  await prisma.user.upsert({
    where: { numeroDocumento },
    update: {
      nombre,
      email,
      tipoDocumento,
    },
    create: {
      nombre,
      email,
      password,
      rol: 'SENSEI',
      tipoDocumento,
      numeroDocumento,
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
