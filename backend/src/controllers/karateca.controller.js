const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');

const userIncludeBasico = {
  select: {
    nombre: true,
    email: true,
    telefono: true,
    fechaNacimiento: true,
    fechaIngreso: true,
  },
};

async function getAll(req, res) {
  try {
    const karatecas = await prisma.karateca.findMany({
      include: {
        user: userIncludeBasico,
        polizas: true,
      },
      orderBy: { id: 'asc' },
    });
    return res.json(karatecas);
  } catch (err) {
    return res.status(500).json({ message: 'Error del servidor' });
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
        user: {
          omit: { password: true },
        },
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
          user: {
            omit: { password: true },
          },
        },
      });
      return k;
    });

    return res.status(201).json(result);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }
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
      omit: { password: true },
    });

    return res.json(user);
  } catch (err) {
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
};
