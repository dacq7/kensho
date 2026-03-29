const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');

const userSelectPublic = {
  select: {
    id: true,
    nombre: true,
    email: true,
    rol: true,
    tipoDocumento: true,
    numeroDocumento: true,
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

const TIPOS_DOC_KARATECA = new Set(['CC', 'TI', 'CE', 'PA', 'RC', 'PPT']);
const MES_YYYY_MM = /^\d{4}-\d{2}$/;

function parseMesInicioMensualidades(raw) {
  if (raw === undefined) {
    return { skip: true };
  }
  if (raw === null || (typeof raw === 'string' && raw.trim() === '')) {
    return { value: null };
  }
  const t = String(raw).trim();
  if (!MES_YYYY_MM.test(t)) {
    return { error: "mesInicioMensualidades debe ser 'YYYY-MM'" };
  }
  return { value: t };
}

async function create(req, res) {
  try {
    const {
      nombre,
      email,
      password,
      telefono,
      fechaNacimiento,
      tipoDocumento,
      numeroDocumento,
      mesInicioMensualidades,
    } = req.body;
    if (!nombre || !email || !password || !tipoDocumento || !numeroDocumento) {
      return res.status(400).json({
        message:
          'nombre, email, password, tipoDocumento y numeroDocumento son obligatorios',
      });
    }

    if (!TIPOS_DOC_KARATECA.has(String(tipoDocumento).trim())) {
      return res.status(400).json({ message: 'tipoDocumento no válido' });
    }

    const doc = String(numeroDocumento).trim();
    if (!/^\d+$/.test(doc)) {
      return res.status(400).json({ message: 'numeroDocumento debe contener solo dígitos' });
    }

    const duplicado = await prisma.user.findUnique({ where: { numeroDocumento: doc } });
    if (duplicado) {
      return res.status(400).json({ message: 'Ya existe un karateca con ese número de documento' });
    }

    const mesIniParsed = parseMesInicioMensualidades(mesInicioMensualidades);
    if (mesIniParsed.error) {
      return res.status(400).json({ message: mesIniParsed.error });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          nombre,
          email,
          password: hashed,
          rol: 'KARATECA',
          tipoDocumento: String(tipoDocumento).trim(),
          numeroDocumento: doc,
          telefono: telefono ?? undefined,
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : undefined,
        },
      });
      const k = await tx.karateca.create({
        data: {
          userId: user.id,
          ...(!mesIniParsed.skip && { mesInicioMensualidades: mesIniParsed.value }),
        },
        include: {
          user: userSelectPublic,
        },
      });
      return k;
    });

    return res.status(201).json(result);
  } catch (err) {
    if (err.code === 'P2002') {
      const target = err.meta?.target;
      const isDoc =
        Array.isArray(target) && target.includes('numeroDocumento');
      return res.status(isDoc ? 400 : 409).json({
        message: isDoc
          ? 'Ya existe un karateca con ese número de documento'
          : 'El email ya está registrado',
      });
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

    const { nombre, telefono, fechaNacimiento, tipoDocumento, numeroDocumento, mesInicioMensualidades } =
      req.body;

    const karateca = await prisma.karateca.findUnique({ where: { id } });
    if (!karateca) {
      return res.status(404).json({ message: 'Karateca no encontrado' });
    }

    if (tipoDocumento !== undefined && !TIPOS_DOC_KARATECA.has(String(tipoDocumento).trim())) {
      return res.status(400).json({ message: 'tipoDocumento no válido' });
    }

    if (numeroDocumento !== undefined) {
      const doc = String(numeroDocumento).trim();
      if (!/^\d+$/.test(doc)) {
        return res.status(400).json({ message: 'numeroDocumento debe contener solo dígitos' });
      }
      const otro = await prisma.user.findFirst({
        where: { numeroDocumento: doc, NOT: { id: karateca.userId } },
      });
      if (otro) {
        return res.status(400).json({ message: 'Ya existe un karateca con ese número de documento' });
      }
    }

    const user = await prisma.user.update({
      where: { id: karateca.userId },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(telefono !== undefined && { telefono }),
        ...(fechaNacimiento !== undefined && {
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        }),
        ...(tipoDocumento !== undefined && { tipoDocumento: String(tipoDocumento).trim() }),
        ...(numeroDocumento !== undefined && { numeroDocumento: String(numeroDocumento).trim() }),
      },
      ...userSelectPublic,
    });

    if (mesInicioMensualidades !== undefined) {
      const mesIniParsed = parseMesInicioMensualidades(mesInicioMensualidades);
      if (mesIniParsed.error) {
        return res.status(400).json({ message: mesIniParsed.error });
      }
      await prisma.karateca.update({
        where: { id },
        data: { mesInicioMensualidades: mesIniParsed.value },
      });
    }

    return res.json(user);
  } catch (err) {
    if (err.code === 'P2002') {
      const target = err.meta?.target;
      const isDoc = Array.isArray(target) && target.includes('numeroDocumento');
      if (isDoc) {
        return res.status(400).json({ message: 'Ya existe un karateca con ese número de documento' });
      }
    }
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
      await tx.asistencia.deleteMany({ where: { karatecaId: id } });
      await tx.mensualidad.deleteMany({ where: { karatecaId: id } });
      await tx.poliza.deleteMany({ where: { karatecaId: id } });

      const karateca = await tx.karateca.findUnique({ where: { id } });
      if (!karateca) {
        const error = new Error('NOT_FOUND');
        error.status = 404;
        throw error;
      }

      await tx.asistencia.deleteMany({ where: { registradoPorId: karateca.userId } });
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
