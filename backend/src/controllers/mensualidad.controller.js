const { Prisma } = require('@prisma/client');
const { prisma } = require('../lib/prisma');

const MES_REGEX = /^\d{4}-\d{2}$/;

async function getByKarateca(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const mensualidades = await prisma.mensualidad.findMany({
      where: { karatecaId: id },
      orderBy: { mes: 'desc' },
    });

    return res.json(mensualidades);
  } catch (err) {
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function create(req, res) {
  try {
    const { karatecaId, mes, monto } = req.body;
    if (karatecaId == null || !mes || monto === undefined) {
      return res.status(400).json({ message: 'karatecaId, mes y monto son obligatorios' });
    }
    if (!MES_REGEX.test(mes)) {
      return res.status(400).json({ message: "mes debe tener formato 'YYYY-MM'" });
    }

    const karateca = await prisma.karateca.findUnique({ where: { id: karatecaId } });
    if (!karateca) {
      return res.status(404).json({ message: 'Karateca no encontrado' });
    }

    const mensualidad = await prisma.mensualidad.create({
      data: {
        karatecaId,
        mes,
        monto: new Prisma.Decimal(String(monto)),
      },
    });

    return res.status(201).json(mensualidad);
  } catch (err) {
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function pagar(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const ahora = new Date();

    const mensualidad = await prisma.mensualidad.update({
      where: { id },
      data: {
        pagado: true,
        fechaPago: ahora,
      },
    });

    return res.json(mensualidad);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Mensualidad no encontrada' });
    }
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = {
  getByKarateca,
  create,
  pagar,
};
