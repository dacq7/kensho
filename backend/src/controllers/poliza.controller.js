const { prisma } = require('../lib/prisma');

async function getAll(req, res) {
  try {
    const polizas = await prisma.poliza.findMany({
      include: {
        karateca: {
          include: {
            user: {
              omit: { password: true },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });
    return res.json(polizas);
  } catch (err) {
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

    return res.json(polizas);
  } catch (err) {
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

    const karateca = await prisma.karateca.findUnique({ where: { id: karatecaId } });
    if (!karateca) {
      return res.status(404).json({ message: 'Karateca no encontrado' });
    }

    const poliza = await prisma.poliza.create({
      data: {
        karatecaId,
        aseguradora,
        numeroPoliza,
        fechaInicio: new Date(fechaInicio),
        fechaVencimiento: new Date(fechaVencimiento),
      },
    });

    return res.status(201).json(poliza);
  } catch (err) {
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

    const poliza = await prisma.poliza.update({
      where: { id },
      data: {
        ...(aseguradora !== undefined && { aseguradora }),
        ...(numeroPoliza !== undefined && { numeroPoliza }),
        ...(fechaInicio !== undefined && { fechaInicio: new Date(fechaInicio) }),
        ...(fechaVencimiento !== undefined && { fechaVencimiento: new Date(fechaVencimiento) }),
      },
    });

    return res.json(poliza);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Póliza no encontrada' });
    }
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = {
  getAll,
  getByKarateca,
  create,
  update,
};
