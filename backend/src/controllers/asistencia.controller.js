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

function parseDayBounds(yyyyMmDd) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return null;
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { start, end };
}

function monthBoundsFromMes(mes) {
  if (!/^\d{4}-\d{2}$/.test(mes)) return null;
  const [y, m] = mes.split('-').map(Number);
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return { start, end };
}

function mesActualString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function fechaKeyLocal(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function getByFecha(req, res) {
  try {
    const fecha = req.query.fecha;
    if (!fecha) {
      return res.status(400).json({ message: 'Se requiere query fecha=YYYY-MM-DD' });
    }
    const bounds = parseDayBounds(fecha);
    if (!bounds) {
      return res.status(400).json({ message: 'fecha debe ser YYYY-MM-DD' });
    }

    const karatecas = await prisma.karateca.findMany({
      where: { activo: true },
      include: {
        user: userSelectPublic,
        asistencias: {
          where: {
            fecha: { gte: bounds.start, lte: bounds.end },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const resultado = karatecas.map((k) => {
      const reg = k.asistencias[0];
      return {
        id: k.id,
        kyuActual: k.kyuActual,
        dan: k.dan,
        activo: k.activo,
        user: k.user,
        presente: reg === undefined ? null : reg.presente,
      };
    });

    return res.json(resultado);
  } catch (err) {
    console.error('ERROR getByFecha:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function getFechas(req, res) {
  try {
    const mes = req.query.mes || mesActualString();
    const bounds = monthBoundsFromMes(mes);
    if (!bounds) {
      return res.status(400).json({ message: 'mes debe ser YYYY-MM' });
    }

    const registros = await prisma.asistencia.findMany({
      where: {
        fecha: { gte: bounds.start, lte: bounds.end },
      },
      select: {
        fecha: true,
        presente: true,
      },
    });

    const porDia = new Map();
    for (const r of registros) {
      const key = fechaKeyLocal(r.fecha);
      if (!porDia.has(key)) {
        porDia.set(key, { fecha: key, presentes: 0, ausentes: 0 });
      }
      const agg = porDia.get(key);
      if (r.presente) agg.presentes += 1;
      else agg.ausentes += 1;
    }

    const lista = [...porDia.values()].sort((a, b) => b.fecha.localeCompare(a.fecha));
    return res.json(lista);
  } catch (err) {
    console.error('ERROR getFechas:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function registrar(req, res) {
  try {
    const { fecha, registros } = req.body;
    if (!fecha || !Array.isArray(registros)) {
      return res.status(400).json({ message: 'Se requiere fecha (YYYY-MM-DD) y registros (array)' });
    }
    const bounds = parseDayBounds(fecha);
    if (!bounds) {
      return res.status(400).json({ message: 'fecha debe ser YYYY-MM-DD' });
    }

    for (const row of registros) {
      if (row.karatecaId == null || typeof row.presente !== 'boolean') {
        return res.status(400).json({
          message: 'Cada registro debe tener karatecaId y presente (boolean)',
        });
      }
    }

    const registradoPorId = req.user.userId;

    await prisma.$transaction(async (tx) => {
      for (const row of registros) {
        const existing = await tx.asistencia.findFirst({
          where: {
            karatecaId: row.karatecaId,
            fecha: { gte: bounds.start, lte: bounds.end },
          },
        });

        if (existing) {
          await tx.asistencia.update({
            where: { id: existing.id },
            data: {
              presente: row.presente,
              registradoPorId,
            },
          });
        } else {
          await tx.asistencia.create({
            data: {
              karatecaId: row.karatecaId,
              fecha: bounds.start,
              presente: row.presente,
              registradoPorId,
            },
          });
        }
      }
    });

    return res.json({ message: 'Asistencias registradas' });
  } catch (err) {
    console.error('ERROR registrar:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function getByKarateca(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const mes = req.query.mes;
    const where = { karatecaId: id };
    if (mes) {
      const bounds = monthBoundsFromMes(mes);
      if (!bounds) {
        return res.status(400).json({ message: 'mes debe ser YYYY-MM' });
      }
      where.fecha = { gte: bounds.start, lte: bounds.end };
    }

    const asistencias = await prisma.asistencia.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        registradoPor: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });

    return res.json(asistencias);
  } catch (err) {
    console.error('ERROR getByKarateca:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = {
  getByFecha,
  getFechas,
  registrar,
  getByKarateca,
};
