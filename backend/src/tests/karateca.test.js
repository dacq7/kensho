'use strict';

const request = require('supertest');
const express = require('express');

// --- Mocks ---

jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    karateca: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    asistencia: { deleteMany: jest.fn(), findMany: jest.fn() },
    mensualidad: { deleteMany: jest.fn(), findMany: jest.fn() },
    poliza: { deleteMany: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Inject a SENSEI user so all protected karateca routes pass auth + role checks
jest.mock('../middlewares/auth.middleware', () => (req, res, next) => {
  req.user = { userId: 1, rol: 'SENSEI' };
  next();
});

jest.mock('../middlewares/role.middleware', () => () => (req, res, next) => next());

// --- Module references ---

const { prisma } = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const karatecaRoutes = require('../routes/karateca.routes');

// --- App factory ---

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/karatecas', karatecaRoutes);
  return app;
}

const app = buildApp();

// ---------------------------------------------------------------------------
// GET /api/karatecas
// ---------------------------------------------------------------------------

describe('GET /api/karatecas', () => {
  test('returns 200 with array of karatecas', async () => {
    const mockKaratecas = [
      { id: 1, userId: 10, kyuActual: '8kyu', activo: true, user: { nombre: 'Ana' }, polizas: [] },
      { id: 2, userId: 11, kyuActual: '7kyu', activo: true, user: { nombre: 'Luis' }, polizas: [] },
    ];
    prisma.karateca.findMany.mockResolvedValue(mockKaratecas);

    const res = await request(app).get('/api/karatecas');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  test('includes inactive when incluirInactivos=true', async () => {
    const mockAll = [
      { id: 1, activo: true, user: { nombre: 'Ana' }, polizas: [] },
      { id: 2, activo: false, user: { nombre: 'Carlos' }, polizas: [] },
    ];
    prisma.karateca.findMany.mockResolvedValue(mockAll);

    const res = await request(app).get('/api/karatecas?incluirInactivos=true');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // Verify findMany was called without an activo filter
    const callArg = prisma.karateca.findMany.mock.calls[0][0];
    expect(callArg.where).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// POST /api/karatecas
// ---------------------------------------------------------------------------

describe('POST /api/karatecas', () => {
  const validBody = {
    nombre: 'Ana López',
    email: 'ana@test.com',
    password: 'pass123',
    tipoDocumento: 'CC',
    numeroDocumento: '12345678',
  };

  test('returns 400 if nombre is missing', async () => {
    const { nombre, ...body } = validBody;
    const res = await request(app).post('/api/karatecas').send(body);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/obligatorios/);
  });

  test('returns 400 if email is missing', async () => {
    const { email, ...body } = validBody;
    const res = await request(app).post('/api/karatecas').send(body);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/obligatorios/);
  });

  test('returns 400 if numeroDocumento has non-digit characters', async () => {
    const res = await request(app)
      .post('/api/karatecas')
      .send({ ...validBody, numeroDocumento: 'ABC-123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('numeroDocumento debe contener solo dígitos');
  });

  test('returns 400 if tipoDocumento is invalid', async () => {
    const res = await request(app)
      .post('/api/karatecas')
      .send({ ...validBody, tipoDocumento: 'INVALID' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('tipoDocumento no válido');
  });

  test('returns 400 if karateca with same document already exists', async () => {
    // findUnique returns an existing user → duplicate document
    prisma.user.findUnique.mockResolvedValue({ id: 99, numeroDocumento: '12345678' });

    const res = await request(app).post('/api/karatecas').send(validBody);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Ya existe un karateca con ese número de documento');
  });

  test('returns 201 with created karateca on success', async () => {
    prisma.user.findUnique.mockResolvedValue(null); // no duplicate
    bcrypt.hash.mockResolvedValue('hashed-password');
    prisma.$transaction.mockImplementation((cb) => cb(prisma));
    prisma.user.create.mockResolvedValue({
      id: 10,
      nombre: 'Ana López',
      email: 'ana@test.com',
      rol: 'KARATECA',
      tipoDocumento: 'CC',
      numeroDocumento: '12345678',
      telefono: null,
      fechaNacimiento: null,
      fechaIngreso: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    prisma.karateca.create.mockResolvedValue({
      id: 1,
      userId: 10,
      kyuActual: '8kyu',
      dan: null,
      preExamenAprobado: false,
      fechaUltimoAscenso: null,
      activo: true,
      mesInicioMensualidades: null,
      user: {
        id: 10,
        nombre: 'Ana López',
        email: 'ana@test.com',
        rol: 'KARATECA',
      },
    });

    const res = await request(app).post('/api/karatecas').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
    expect(res.body.user.nombre).toBe('Ana López');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/karatecas/:id/kyu
// ---------------------------------------------------------------------------

describe('PATCH /api/karatecas/:id/kyu', () => {
  test('returns 400 if kyuActual is missing', async () => {
    const res = await request(app)
      .patch('/api/karatecas/1/kyu')
      .send({ fechaUltimoAscenso: '2025-03-01' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('kyuActual es obligatorio');
  });

  test('returns 404 if karateca does not exist', async () => {
    const notFoundError = Object.assign(new Error('Record not found'), { code: 'P2025' });
    prisma.karateca.update.mockRejectedValue(notFoundError);

    const res = await request(app)
      .patch('/api/karatecas/999/kyu')
      .send({ kyuActual: '6kyu' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Karateca no encontrado');
  });

  test('returns 200 with updated karateca on success', async () => {
    prisma.karateca.update.mockResolvedValue({
      id: 1,
      userId: 10,
      kyuActual: '6kyu',
      fechaUltimoAscenso: '2025-03-01T00:00:00.000Z',
      preExamenAprobado: false,
      activo: true,
    });

    const res = await request(app)
      .patch('/api/karatecas/1/kyu')
      .send({ kyuActual: '6kyu', fechaUltimoAscenso: '2025-03-01' });

    expect(res.status).toBe(200);
    expect(res.body.kyuActual).toBe('6kyu');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/karatecas/:id/pre-examen
// ---------------------------------------------------------------------------

describe('PATCH /api/karatecas/:id/pre-examen', () => {
  test('returns 400 if preExamenAprobado is not boolean', async () => {
    const res = await request(app)
      .patch('/api/karatecas/1/pre-examen')
      .send({ preExamenAprobado: 'yes' }); // string, not boolean

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('preExamenAprobado debe ser booleano');
  });

  test('returns 200 with updated value on success', async () => {
    prisma.karateca.update.mockResolvedValue({
      id: 1,
      userId: 10,
      kyuActual: '8kyu',
      preExamenAprobado: true,
      activo: true,
    });

    const res = await request(app)
      .patch('/api/karatecas/1/pre-examen')
      .send({ preExamenAprobado: true });

    expect(res.status).toBe(200);
    expect(res.body.preExamenAprobado).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/karatecas/:id
// ---------------------------------------------------------------------------

describe('DELETE /api/karatecas/:id', () => {
  test('returns 404 if karateca does not exist', async () => {
    prisma.$transaction.mockImplementation((cb) => cb(prisma));
    prisma.asistencia.deleteMany.mockResolvedValue({ count: 0 });
    prisma.mensualidad.deleteMany.mockResolvedValue({ count: 0 });
    prisma.poliza.deleteMany.mockResolvedValue({ count: 0 });
    prisma.karateca.findUnique.mockResolvedValue(null); // not found → throws NOT_FOUND

    const res = await request(app).delete('/api/karatecas/999');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Karateca no encontrado');
  });

  test('returns 204 on successful deletion', async () => {
    prisma.$transaction.mockImplementation((cb) => cb(prisma));
    prisma.asistencia.deleteMany.mockResolvedValue({ count: 0 });
    prisma.mensualidad.deleteMany.mockResolvedValue({ count: 0 });
    prisma.poliza.deleteMany.mockResolvedValue({ count: 0 });
    prisma.karateca.findUnique.mockResolvedValue({ id: 1, userId: 10 });
    prisma.karateca.delete.mockResolvedValue({ id: 1 });
    prisma.user.delete.mockResolvedValue({ id: 10 });

    const res = await request(app).delete('/api/karatecas/1');

    expect(res.status).toBe(204);
  });
});
