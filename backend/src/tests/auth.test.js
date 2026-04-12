'use strict';

const request = require('supertest');
const express = require('express');

// --- Mocks (hoisted before any require of the modules they replace) ---

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

jest.mock('../utils/jwt', () => ({
  generateToken: jest.fn(() => 'test-token'),
  verifyToken: jest.fn(() => ({ userId: 1, rol: 'KARATECA' })),
}));

// --- Module references (after mocks are registered) ---

const { prisma } = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const authRoutes = require('../routes/auth.routes');

// --- App factory (avoids app.listen from index.js) ---

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
}

const app = buildApp();

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

describe('POST /api/auth/login', () => {
  test('returns 400 if numeroDocumento is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'pass123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Número de documento y contraseña son obligatorios');
  });

  test('returns 400 if password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ numeroDocumento: '12345678' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Número de documento y contraseña son obligatorios');
  });

  test('returns 401 if user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ numeroDocumento: '99999999', password: 'pass123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales incorrectas');
  });

  test('returns 401 if password is wrong', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      nombre: 'Test User',
      email: 'test@test.com',
      rol: 'KARATECA',
      password: 'hashed-password',
    });
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ numeroDocumento: '12345678', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales incorrectas');
  });

  test('returns 200 with token and user (no password field) on success', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      nombre: 'Test User',
      email: 'test@test.com',
      rol: 'KARATECA',
      telefono: null,
      fechaNacimiento: null,
      fechaIngreso: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      password: 'hashed-password',
    });
    bcrypt.compare.mockResolvedValue(true);
    generateToken.mockReturnValue('test-token');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ numeroDocumento: '12345678', password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('test-token');
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(1);
    expect(res.body.user.password).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

describe('GET /api/auth/me', () => {
  test('returns 401 if no Authorization header', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No autorizado');
  });

  test('returns 200 with user data when token is valid', async () => {
    const mockUser = {
      id: 1,
      nombre: 'Test User',
      email: 'test@test.com',
      rol: 'KARATECA',
      telefono: null,
      fechaNacimiento: null,
      fechaIngreso: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer test-token');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.nombre).toBe('Test User');
    expect(res.body.password).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/auth/change-password
// ---------------------------------------------------------------------------

describe('PATCH /api/auth/change-password', () => {
  test('returns 400 if passwordActual is missing', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', 'Bearer test-token')
      .send({ passwordNueva: 'newpass123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Contraseña actual y nueva son obligatorias');
  });

  test('returns 400 if passwordNueva is less than 6 characters', async () => {
    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', 'Bearer test-token')
      .send({ passwordActual: 'currentpass', passwordNueva: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('La nueva contraseña debe tener al menos 6 caracteres');
  });

  test('returns 401 if passwordActual is wrong', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, password: 'hashed-password' });
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', 'Bearer test-token')
      .send({ passwordActual: 'wrongpass', passwordNueva: 'newpass123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Contraseña actual incorrecta');
  });

  test('returns 200 on success', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, password: 'hashed-password' });
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue('new-hashed-password');
    prisma.user.update.mockResolvedValue({ id: 1 });

    const res = await request(app)
      .patch('/api/auth/change-password')
      .set('Authorization', 'Bearer test-token')
      .send({ passwordActual: 'currentpass', passwordNueva: 'newpass123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Contraseña actualizada');
  });
});
