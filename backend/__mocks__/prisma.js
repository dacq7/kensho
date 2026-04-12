// Manual mock reference for src/lib/prisma.
// Each test file calls jest.mock('../lib/prisma', factory) directly with this shape.
jest.mock('../src/lib/prisma', () => ({
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
