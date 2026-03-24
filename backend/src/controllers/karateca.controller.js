const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');

const userSelectPublic = {
  select: {
    id: true,
    nombre: true,
    email: true,
    rol: true,
    telefono: true,
    fechaNacimiento: true,
    fechaIngreso: true,
    createdAt: true,
  },
};

async function getAll(req, res) {
  try {
    const incluirInactivos = String(req.query.incluirInactivos || '').toLowerCase() === 'true';
    const karatecas = await prisma.karateca.findMany({
      where: incluirInactivos ? undefined : { activo: true },
      include: {
        user: userSelectPublic,
        polizas: true,
      },
      orderBy: { id: 'asc' },
    });
    return res.json(karatecas);
  } catch (err) {
    console.error('ERROR getAll:', err);
    return res.status(500).json({ message: 'Error del servidor', detail: err.message });
  }
}

async function getById(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const karateca = await prisma.karateca.findUnique({
      where: { id },
      include: {
        user: userSelectPublic,
        asistencias: {
          orderBy: { fecha: 'desc' },
          include: {
            registradoPor: {
              select: { id: true, nombre: true, email: true },
            },
          },
        },
        mensualidades: { orderBy: { mes: 'desc' } },
        polizas: true,
      },
    });

    if (!karateca) {
      return res.status(404).json({ message: 'Karateca no encontrado' });
    }

    return res.json(karateca);
  } catch (err) {
    console.error('ERROR getById:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function create(req, res) {
  try {
    const { nombre, email, password, telefono, fechaNacimiento } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'nombre, email y password son obligatorios' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nombre,
          email,
          password: hashed,
          rol: 'KARATECA',
          telefono: telefono ?? undefined,
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : undefined,
        },
      });
      const k = await tx.karateca.create({
        data: { userId: user.id },
        include: {
          user: userSelectPublic,
        },
      });
      return k;
    });

    return res.status(201).json(result);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }
    console.error('ERROR create:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function update(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { nombre, telefono, fechaNacimiento } = req.body;

    const karateca = await prisma.karateca.findUnique({ where: { id } });
    if (!karateca) {
      return res.status(404).json({ message: 'Karateca no encontrado' });
    }

    const user = await prisma.user.update({
      where: { id: karateca.userId },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(telefono !== undefined && { telefono }),
        ...(fechaNacimiento !== undefined && {
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        }),
      },
      ...userSelectPublic,
    });

    return res.json(user);
  } catch (err) {
    console.error('ERROR update:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function updateKyu(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { kyuActual, fechaUltimoAscenso } = req.body;
    if (kyuActual === undefined) {
      return res.status(400).json({ message: 'kyuActual es obligatorio' });
    }

    const karateca = await prisma.karateca.update({
      where: { id },
      data: {
        kyuActual,
        ...(fechaUltimoAscenso !== undefined && {
          fechaUltimoAscenso: fechaUltimoAscenso ? new Date(fechaUltimoAscenso) : null,
        }),
      },
    });

    return res.json(karateca);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Karateca no encontrado' });
    }
    console.error('ERROR updateKyu:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function updatePreExamen(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { preExamenAprobado } = req.body;
    if (typeof preExamenAprobado !== 'boolean') {
      return res.status(400).json({ message: 'preExamenAprobado debe ser booleano' });
    }

    const karateca = await prisma.karateca.update({
      where: { id },
      data: { preExamenAprobado },
    });

    return res.json(karateca);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Karateca no encontrado' });
    }
    console.error('ERROR updatePreExamen:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function toggleActivo(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { activo } = req.body;
    if (typeof activo !== 'boolean') {
      return res.status(400).json({ message: 'activo debe ser booleano' });
    }

    const karateca = await prisma.karateca.update({
      where: { id },
      data: { activo },
      include: {
        user: userSelectPublic,
        polizas: true,
      },
    });

    return res.json(karateca);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Karateca no encontrado' });
    }
    console.error('ERROR toggleActivo:', err);
    return res.status(500).json({ message: 'Error del servidor', detail: err.message });
  }
}

async function remove(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    await prisma.$transaction(async (tx) => {
      const karateca = await tx.karateca.findUnique({ where: { id } });
      if (!karateca) {
        const error = new Error('NOT_FOUND');
        error.status = 404;
        throw error;
      }

      await tx.asistencia.deleteMany({ where: { karatecaId: id } });
      await tx.mensualidad.deleteMany({ where: { karatecaId: id } });
      await tx.poliza.deleteMany({ where: { karatecaId: id } });
      await tx.karateca.delete({ where: { id } });
      await tx.user.delete({ where: { id: karateca.userId } });
    });

    return res.status(204).send();
  } catch (err) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ message: 'Karateca no encontrado' });
    }
    console.error('ERROR remove:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateKyu,
  updatePreExamen,
  toggleActivo,
  remove,
};
