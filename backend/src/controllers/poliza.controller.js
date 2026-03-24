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

function estadoPoliza(fechaVencimiento) {
  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);

  if (vencimiento < finHoy) return 'vencida';

  const umbral = new Date(hoy);
  umbral.setDate(umbral.getDate() + 30);
  if (vencimiento <= umbral) return 'por_vencer';

  return 'activa';
}

function serializePoliza(poliza) {
  return {
    id: poliza.id,
    karatecaId: poliza.karatecaId,
    aseguradora: poliza.aseguradora,
    numeroPoliza: poliza.numeroPoliza,
    fechaInicio: poliza.fechaInicio,
    fechaVencimiento: poliza.fechaVencimiento,
    estado: estadoPoliza(poliza.fechaVencimiento),
    karateca: poliza.karateca,
  };
}

async function getAll(req, res) {
  try {
    const karatecas = await prisma.karateca.findMany({
      where: { activo: true },
      include: {
        user: userSelectPublic,
        polizas: {
          orderBy: { fechaVencimiento: 'desc' },
        },
      },
      orderBy: { id: 'asc' },
    });

    const rows = karatecas.map((k) => {
      const poliza = k.polizas[0] || null;
      return {
        karatecaId: k.id,
        karateca: {
          id: k.id,
          user: k.user,
          kyuActual: k.kyuActual,
          dan: k.dan,
          activo: k.activo,
        },
        poliza: poliza ? serializePoliza(poliza) : null,
      };
    });

    return res.json(rows);
  } catch (err) {
    console.error('ERROR poliza.getAll:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function getByKarateca(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const polizas = await prisma.poliza.findMany({
      where: { karatecaId: id },
      orderBy: { fechaVencimiento: 'desc' },
    });

    return res.json(polizas.map((p) => serializePoliza(p)));
  } catch (err) {
    console.error('ERROR poliza.getByKarateca:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function create(req, res) {
  try {
    const { karatecaId, aseguradora, numeroPoliza, fechaInicio, fechaVencimiento } = req.body;

    if (!karatecaId || !aseguradora || !numeroPoliza || !fechaInicio || !fechaVencimiento) {
      return res.status(400).json({
        message: 'karatecaId, aseguradora, numeroPoliza, fechaInicio y fechaVencimiento son obligatorios',
      });
    }

    const kid = Number.parseInt(String(karatecaId), 10);
    if (Number.isNaN(kid)) {
      return res.status(400).json({ message: 'karatecaId inválido' });
    }

    const karateca = await prisma.karateca.findUnique({ where: { id: kid } });
    if (!karateca) {
      return res.status(404).json({ message: 'Karateca no encontrado' });
    }

    const inicio = new Date(fechaInicio);
    const venc = new Date(fechaVencimiento);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(venc.getTime())) {
      return res.status(400).json({ message: 'Fechas inválidas' });
    }

    const poliza = await prisma.poliza.create({
      data: {
        karatecaId: kid,
        aseguradora,
        numeroPoliza,
        fechaInicio: inicio,
        fechaVencimiento: venc,
      },
      include: {
        karateca: {
          include: {
            user: userSelectPublic,
          },
        },
      },
    });

    return res.json(serializePoliza(poliza));
  } catch (err) {
    console.error('ERROR poliza.create:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function update(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const { aseguradora, numeroPoliza, fechaInicio, fechaVencimiento } = req.body;
    if (!aseguradora || !numeroPoliza || !fechaInicio || !fechaVencimiento) {
      return res.status(400).json({
        message: 'aseguradora, numeroPoliza, fechaInicio y fechaVencimiento son obligatorios',
      });
    }

    const inicio = new Date(fechaInicio);
    const venc = new Date(fechaVencimiento);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(venc.getTime())) {
      return res.status(400).json({ message: 'Fechas inválidas' });
    }

    const poliza = await prisma.poliza.update({
      where: { id },
      data: {
        aseguradora,
        numeroPoliza,
        fechaInicio: inicio,
        fechaVencimiento: venc,
      },
      include: {
        karateca: {
          include: {
            user: userSelectPublic,
          },
        },
      },
    });

    return res.json(serializePoliza(poliza));
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Póliza no encontrada' });
    }
    console.error('ERROR poliza.update:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function remove(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    await prisma.poliza.delete({ where: { id } });
    return res.json({ message: 'Póliza eliminada' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Póliza no encontrada' });
    }
    console.error('ERROR poliza.remove:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function removeAll(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const result = await prisma.poliza.deleteMany({
      where: { karatecaId: id },
    });
    return res.json({ message: 'Pólizas eliminadas', eliminadas: result.count });
  } catch (err) {
    console.error('ERROR poliza.removeAll:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = {
  getAll,
  getByKarateca,
  create,
  update,
  remove,
  removeAll,
};
