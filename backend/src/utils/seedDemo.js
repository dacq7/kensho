require('dotenv').config();

const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');

async function main() {
  // ─── 1. DELETE all existing data ───────────────────────────────────────────
  await prisma.asistencia.deleteMany();
  await prisma.mensualidad.deleteMany();
  await prisma.poliza.deleteMany();
  await prisma.inventario.deleteMany();
  await prisma.karateca.deleteMany();
  await prisma.user.deleteMany();

  console.log('Base de datos limpia.');

  const password = await bcrypt.hash('demo2025', 10);

  // ─── 2. SENSEI ─────────────────────────────────────────────────────────────
  const sensei = await prisma.user.create({
    data: {
      nombre: 'Sensei Carlos Ríos',
      email: 'sensei@budokan.com',
      password,
      rol: 'SENSEI',
      tipoDocumento: 'CC',
      numeroDocumento: '11111111',
      telefono: '3001234567',
    },
  });

  // ─── 3. KARATECAS ──────────────────────────────────────────────────────────
  const andresUser = await prisma.user.create({
    data: {
      nombre: 'Andrés Mejía',
      email: 'andres@budokan.com',
      password,
      rol: 'KARATECA',
      tipoDocumento: 'CC',
      numeroDocumento: '22222222',
      telefono: '3011111111',
      fechaNacimiento: new Date('2000-03-15'),
    },
  });
  const andres = await prisma.karateca.create({
    data: {
      userId: andresUser.id,
      kyuActual: '5kyu',
      preExamenAprobado: true,
      mesInicioMensualidades: '2025-01',
      fechaUltimoAscenso: new Date('2024-06-01'),
    },
  });

  const lauraUser = await prisma.user.create({
    data: {
      nombre: 'Laura Gómez',
      email: 'laura@budokan.com',
      password,
      rol: 'KARATECA',
      tipoDocumento: 'TI',
      numeroDocumento: '33333333',
      telefono: '3022222222',
      fechaNacimiento: new Date('2008-07-20'),
    },
  });
  const laura = await prisma.karateca.create({
    data: {
      userId: lauraUser.id,
      kyuActual: '7kyu',
      preExamenAprobado: false,
      mesInicioMensualidades: '2025-03',
      fechaUltimoAscenso: new Date('2024-11-01'),
    },
  });

  const miguelUser = await prisma.user.create({
    data: {
      nombre: 'Miguel Torres',
      email: 'miguel@budokan.com',
      password,
      rol: 'KARATECA',
      tipoDocumento: 'CC',
      numeroDocumento: '44444444',
      telefono: '3033333333',
      fechaNacimiento: new Date('1995-11-08'),
    },
  });
  const miguel = await prisma.karateca.create({
    data: {
      userId: miguelUser.id,
      kyuActual: '3kyu',
      preExamenAprobado: false,
      mesInicioMensualidades: '2024-09',
      fechaUltimoAscenso: new Date('2024-03-01'),
    },
  });

  const sofiaUser = await prisma.user.create({
    data: {
      nombre: 'Sofía Ramírez',
      email: 'sofia@budokan.com',
      password,
      rol: 'KARATECA',
      tipoDocumento: 'TI',
      numeroDocumento: '55555555',
      telefono: '3044444444',
      fechaNacimiento: new Date('2010-01-25'),
    },
  });
  await prisma.karateca.create({
    data: {
      userId: sofiaUser.id,
      kyuActual: '8kyu',
      preExamenAprobado: false,
      mesInicioMensualidades: '2025-06',
      fechaUltimoAscenso: null,
    },
  });

  // Recuperar id de Sofía's karateca record (necesario para mensualidades y asistencias)
  const sofiaKarateca = await prisma.karateca.findUnique({ where: { userId: sofiaUser.id } });

  // ─── 4. MENSUALIDADES ──────────────────────────────────────────────────────

  // Andrés: 2025-01 → 2026-04
  await prisma.mensualidad.createMany({
    data: [
      { karatecaId: andres.id, mes: '2025-01', monto: 80000, pagado: true,  fechaPago: new Date('2025-01-05') },
      { karatecaId: andres.id, mes: '2025-02', monto: 80000, pagado: true,  fechaPago: new Date('2025-02-04') },
      { karatecaId: andres.id, mes: '2025-03', monto: 80000, pagado: true,  fechaPago: new Date('2025-03-06') },
      { karatecaId: andres.id, mes: '2025-04', monto: 80000, pagado: true,  fechaPago: new Date('2026-04-04') },
      { karatecaId: andres.id, mes: '2025-05', monto: 80000, pagado: true,  fechaPago: new Date('2025-05-05') },
      { karatecaId: andres.id, mes: '2025-06', monto: 80000, pagado: true,  fechaPago: new Date('2025-06-04') },
      { karatecaId: andres.id, mes: '2025-07', monto: 80000, pagado: true,  fechaPago: new Date('2025-07-07') },
      { karatecaId: andres.id, mes: '2025-08', monto: 80000, pagado: true,  fechaPago: new Date('2025-08-05') },
      { karatecaId: andres.id, mes: '2025-09', monto: 80000, pagado: true,  fechaPago: new Date('2025-09-04') },
      { karatecaId: andres.id, mes: '2025-10', monto: 80000, pagado: true,  fechaPago: new Date('2025-10-06') },
      { karatecaId: andres.id, mes: '2025-11', monto: 80000, pagado: true,  fechaPago: new Date('2025-11-05') },
      { karatecaId: andres.id, mes: '2025-12', monto: 80000, pagado: true,  fechaPago: new Date('2025-12-04') },
      { karatecaId: andres.id, mes: '2026-01', monto: 80000, pagado: true,  fechaPago: new Date('2026-01-06') },
      { karatecaId: andres.id, mes: '2026-02', monto: 80000, pagado: true,  fechaPago: new Date('2026-02-04') },
      { karatecaId: andres.id, mes: '2026-03', monto: 80000, pagado: true,  fechaPago: new Date('2026-03-05') },
      { karatecaId: andres.id, mes: '2026-04', monto: 80000, pagado: true,  fechaPago: new Date('2026-04-04') },
    ],
  });

  // Laura: 2025-03 → 2026-04
  await prisma.mensualidad.createMany({
    data: [
      { karatecaId: laura.id, mes: '2025-03', monto: 80000, pagado: true,  fechaPago: new Date('2025-03-10') },
      { karatecaId: laura.id, mes: '2025-04', monto: 80000, pagado: true,  fechaPago: new Date('2025-04-08') },
      { karatecaId: laura.id, mes: '2025-05', monto: 80000, pagado: true,  fechaPago: new Date('2025-05-07') },
      { karatecaId: laura.id, mes: '2025-06', monto: 80000, pagado: true,  fechaPago: new Date('2025-06-06') },
      { karatecaId: laura.id, mes: '2025-07', monto: 80000, pagado: true,  fechaPago: new Date('2025-07-08') },
      { karatecaId: laura.id, mes: '2025-08', monto: 80000, pagado: true,  fechaPago: new Date('2025-08-07') },
      { karatecaId: laura.id, mes: '2025-09', monto: 80000, pagado: true,  fechaPago: new Date('2025-09-05') },
      { karatecaId: laura.id, mes: '2025-10', monto: 80000, pagado: true,  fechaPago: new Date('2025-10-08') },
      { karatecaId: laura.id, mes: '2025-11', monto: 80000, pagado: true,  fechaPago: new Date('2025-11-06') },
      { karatecaId: laura.id, mes: '2025-12', monto: 80000, pagado: true,  fechaPago: new Date('2025-12-05') },
      { karatecaId: laura.id, mes: '2026-01', monto: 80000, pagado: true,  fechaPago: new Date('2026-01-08') },
      { karatecaId: laura.id, mes: '2026-02', monto: 80000, pagado: true,  fechaPago: new Date('2026-02-06') },
      { karatecaId: laura.id, mes: '2026-03', monto: 80000, pagado: true,  fechaPago: new Date('2026-03-07') },
      { karatecaId: laura.id, mes: '2026-04', monto: 80000, pagado: false, fechaPago: null },
    ],
  });

  // Miguel: 2024-09 → 2026-04
  // Historial: pagó regular hasta 2025-01, cayó en mora (2025-02/03/04), se puso al día a mediados de 2025,
  // volvió a caer en mora desde 2026-02.
  await prisma.mensualidad.createMany({
    data: [
      { karatecaId: miguel.id, mes: '2024-09', monto: 80000, pagado: true,  fechaPago: new Date('2024-09-08') },
      { karatecaId: miguel.id, mes: '2024-10', monto: 80000, pagado: true,  fechaPago: new Date('2024-10-07') },
      { karatecaId: miguel.id, mes: '2024-11', monto: 80000, pagado: true,  fechaPago: new Date('2024-11-06') },
      { karatecaId: miguel.id, mes: '2024-12', monto: 80000, pagado: true,  fechaPago: new Date('2024-12-05') },
      { karatecaId: miguel.id, mes: '2025-01', monto: 80000, pagado: true,  fechaPago: new Date('2025-01-09') },
      { karatecaId: miguel.id, mes: '2025-02', monto: 80000, pagado: false, fechaPago: null },
      { karatecaId: miguel.id, mes: '2025-03', monto: 80000, pagado: false, fechaPago: null },
      { karatecaId: miguel.id, mes: '2025-04', monto: 80000, pagado: false, fechaPago: null },
      { karatecaId: miguel.id, mes: '2025-05', monto: 80000, pagado: true,  fechaPago: new Date('2025-06-10') },
      { karatecaId: miguel.id, mes: '2025-06', monto: 80000, pagado: true,  fechaPago: new Date('2025-06-15') },
      { karatecaId: miguel.id, mes: '2025-07', monto: 80000, pagado: true,  fechaPago: new Date('2025-07-12') },
      { karatecaId: miguel.id, mes: '2025-08', monto: 80000, pagado: true,  fechaPago: new Date('2025-08-11') },
      { karatecaId: miguel.id, mes: '2025-09', monto: 80000, pagado: true,  fechaPago: new Date('2025-09-09') },
      { karatecaId: miguel.id, mes: '2025-10', monto: 80000, pagado: true,  fechaPago: new Date('2025-10-10') },
      { karatecaId: miguel.id, mes: '2025-11', monto: 80000, pagado: true,  fechaPago: new Date('2025-11-08') },
      { karatecaId: miguel.id, mes: '2025-12', monto: 80000, pagado: true,  fechaPago: new Date('2025-12-10') },
      { karatecaId: miguel.id, mes: '2026-01', monto: 80000, pagado: true,  fechaPago: new Date('2026-01-14') },
      { karatecaId: miguel.id, mes: '2026-02', monto: 80000, pagado: false, fechaPago: null },
      { karatecaId: miguel.id, mes: '2026-03', monto: 80000, pagado: false, fechaPago: null },
      { karatecaId: miguel.id, mes: '2026-04', monto: 80000, pagado: false, fechaPago: null },
    ],
  });

  // Sofía: 2025-06 → 2026-04 (inicio que era futuro, ahora activo)
  await prisma.mensualidad.createMany({
    data: [
      { karatecaId: sofiaKarateca.id, mes: '2025-06', monto: 80000, pagado: true,  fechaPago: new Date('2025-06-03') },
      { karatecaId: sofiaKarateca.id, mes: '2025-07', monto: 80000, pagado: true,  fechaPago: new Date('2025-07-04') },
      { karatecaId: sofiaKarateca.id, mes: '2025-08', monto: 80000, pagado: true,  fechaPago: new Date('2025-08-05') },
      { karatecaId: sofiaKarateca.id, mes: '2025-09', monto: 80000, pagado: true,  fechaPago: new Date('2025-09-03') },
      { karatecaId: sofiaKarateca.id, mes: '2025-10', monto: 80000, pagado: true,  fechaPago: new Date('2025-10-06') },
      { karatecaId: sofiaKarateca.id, mes: '2025-11', monto: 80000, pagado: true,  fechaPago: new Date('2025-11-04') },
      { karatecaId: sofiaKarateca.id, mes: '2025-12', monto: 80000, pagado: true,  fechaPago: new Date('2025-12-03') },
      { karatecaId: sofiaKarateca.id, mes: '2026-01', monto: 80000, pagado: true,  fechaPago: new Date('2026-01-07') },
      { karatecaId: sofiaKarateca.id, mes: '2026-02', monto: 80000, pagado: true,  fechaPago: new Date('2026-02-05') },
      { karatecaId: sofiaKarateca.id, mes: '2026-03', monto: 80000, pagado: true,  fechaPago: new Date('2026-03-04') },
      { karatecaId: sofiaKarateca.id, mes: '2026-04', monto: 80000, pagado: false, fechaPago: null },
    ],
  });

  // ─── 5. ASISTENCIAS ────────────────────────────────────────────────────────
  // sofiaKarateca ya fue recuperado arriba para las mensualidades.
  const classDates = [
    new Date('2025-04-01'),
    new Date('2025-03-25'),
    new Date('2025-03-18'),
    new Date('2025-03-11'),
    new Date('2025-03-04'),
    new Date('2025-02-25'),
    new Date('2025-02-18'),
    new Date('2025-02-11'),
  ];

  // Andrés: presente en todas (8/8)
  const andresAusente = new Set();

  // Laura: ausente en 2025-02-18 y 2025-02-11
  const lauraAusente = new Set(['2025-02-18', '2025-02-11']);

  // Miguel: ausente en 2025-03-04, 2025-02-25, 2025-02-11
  const miguelAusente = new Set(['2025-03-04', '2025-02-25', '2025-02-11']);

  // Sofía: ausente en 2025-04-01, 2025-03-11, 2025-02-18, 2025-02-11
  const sofiaAusente = new Set(['2025-04-01', '2025-03-11', '2025-02-18', '2025-02-11']);

  const asistenciaData = [];
  for (const fecha of classDates) {
    const key = fecha.toISOString().slice(0, 10);
    asistenciaData.push(
      { karatecaId: andres.id, fecha, presente: !andresAusente.has(key), registradoPorId: sensei.id },
      { karatecaId: laura.id,  fecha, presente: !lauraAusente.has(key),  registradoPorId: sensei.id },
      { karatecaId: miguel.id, fecha, presente: !miguelAusente.has(key), registradoPorId: sensei.id },
      // Sofía usa su propio karateca id — lo buscamos abajo
    );
  }

  for (const fecha of classDates) {
    const key = fecha.toISOString().slice(0, 10);
    asistenciaData.push({
      karatecaId: sofiaKarateca.id,
      fecha,
      presente: !sofiaAusente.has(key),
      registradoPorId: sensei.id,
    });
  }

  await prisma.asistencia.createMany({ data: asistenciaData });

  // ─── 6. PÓLIZAS ────────────────────────────────────────────────────────────
  await prisma.poliza.createMany({
    data: [
      {
        karatecaId: andres.id,
        aseguradora: 'Sura',
        numeroPoliza: 'POL-001',
        fechaInicio: new Date('2026-01-01'),
        fechaVencimiento: new Date('2026-12-31'),
      },
      {
        karatecaId: laura.id,
        aseguradora: 'Colmena',
        numeroPoliza: 'POL-002',
        fechaInicio: new Date('2025-06-01'),
        fechaVencimiento: new Date('2026-04-25'),
      },
      {
        karatecaId: miguel.id,
        aseguradora: 'Bolivar',
        numeroPoliza: 'POL-003',
        fechaInicio: new Date('2024-01-01'),
        fechaVencimiento: new Date('2024-12-31'),
      },
    ],
  });

  // ─── 7. INVENTARIO ─────────────────────────────────────────────────────────
  await prisma.inventario.createMany({
    data: [
      { nombre: 'Guantes de sparring',      categoria: 'PROTECCION',  cantidad: 8, estado: 'BUENO',   notas: 'Talla M y L disponibles' },
      { nombre: 'Cascos protectores',        categoria: 'PROTECCION',  cantidad: 5, estado: 'REGULAR', notas: 'Revisar correas' },
      { nombre: 'Makiwara',                  categoria: 'INSTRUMENTO', cantidad: 2, estado: 'BUENO',   notas: null },
      { nombre: 'Escudos de pateo',          categoria: 'INSTRUMENTO', cantidad: 3, estado: 'MALO',    notas: 'Necesitan reemplazo urgente' },
      { nombre: 'Protectores de espinilla',  categoria: 'PROTECCION',  cantidad: 6, estado: 'BUENO',   notas: null },
    ],
  });

  // ─── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('');
  console.log('=== DEMO SEED COMPLETADO ===');
  console.log('Sensei:          11111111 / demo2025');
  console.log('Karateca demo:   22222222 / demo2025');
  console.log('===============================');
}

main()
  .catch((err) => {
    console.error('Error durante el seed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
