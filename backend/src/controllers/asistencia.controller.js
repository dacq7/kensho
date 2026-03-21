const { prisma } = require('../lib/prisma');

function inicioYFinDelDia() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function getByKarateca(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const asistencias = await prisma.asistencia.findMany({
      where: { karatecaId: id },
      orderBy: { fecha: 'desc' },
      include: {
        registradoPor: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });

    return res.json(asistencias);
  } catch (err) {
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function getHoy(req, res) {
  try {
    const { start, end } = inicioYFinDelDia();

    const karatecas = await prisma.karateca.findMany({
      include: {
        user: {
          select: {
            nombre: true,
            email: true,
            telefono: true,
          },
        },
        asistencias: {
          where: {
            fecha: { gte: start, lte: end },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return res.json(karatecas);
  } catch (err) {
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function registrar(req, res) {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Se espera un array de { karatecaId, presente }' });
    }

    const { start, end } = inicioYFinDelDia();
    const registradoPorId = req.user.userId;

    for (const row of items) {
      if (row.karatecaId == null || typeof row.presente !== 'boolean') {
        return res.status(400).json({
          message: 'Cada elemento debe tener karatecaId y presente (boolean)',
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const row of items) {
        const existing = await tx.asistencia.findFirst({
          where: {
            karatecaId: row.karatecaId,
            fecha: { gte: start, lte: end },
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
              fecha: start,
              presente: row.presente,
              registradoPorId,
            },
          });
        }
      }
    });

    return res.json({ message: 'Asistencias registradas' });
  } catch (err) {
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = {
  getByKarateca,
  getHoy,
  registrar,
};
