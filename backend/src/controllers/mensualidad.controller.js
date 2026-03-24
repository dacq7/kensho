const { Prisma } = require('@prisma/client');
const { prisma } = require('../lib/prisma');

const MES_REGEX = /^\d{4}-\d{2}$/;

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

function decimalToApi(monto) {
  if (monto == null) return null;
  return monto.toString();
}

function serializeMensualidad(m) {
  if (!m) return null;
  return {
    id: m.id,
    karatecaId: m.karatecaId,
    mes: m.mes,
    monto: decimalToApi(m.monto),
    pagado: m.pagado,
    fechaPago: m.fechaPago,
  };
}

/**
 * true si ya pasó el día 5 del mes consultado y la cuota no está pagada
 * (no hay registro o pagado === false).
 */
function computeEnMora(mesYyyyMm, pagado) {
  const [y, mo] = mesYyyyMm.split('-').map(Number);
  const inicioDia6 = new Date(y, mo - 1, 6, 0, 0, 0, 0);
  if (new Date() < inicioDia6) return false;
  if (pagado === true) return false;
  return true;
}

function parseFechaPagoInput(fechaPago) {
  if (typeof fechaPago === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaPago)) {
    const [y, mo, d] = fechaPago.split('-').map(Number);
    return new Date(y, mo - 1, d, 12, 0, 0, 0);
  }
  return new Date(fechaPago);
}

async function getByMes(req, res) {
  try {
    const mes = req.query.mes;
    if (!mes || !MES_REGEX.test(mes)) {
      return res.status(400).json({ message: "mes debe tener formato 'YYYY-MM'" });
    }

    const karatecas = await prisma.karateca.findMany({
      where: { activo: true },
      include: {
        user: userSelectPublic,
        mensualidades: {
          where: { mes },
        },
      },
      orderBy: { id: 'asc' },
    });

    const resultado = karatecas.map((k) => {
      const m = k.mensualidades[0];
      const pagado = m ? m.pagado : null;
      return {
        karatecaId: k.id,
        user: k.user,
        kyuActual: k.kyuActual,
        dan: k.dan,
        mensualidad: serializeMensualidad(m),
        enMora: computeEnMora(mes, pagado),
      };
    });

    return res.json(resultado);
  } catch (err) {
    console.error('ERROR getByMes:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function registrarPago(req, res) {
  try {
    const { karatecaId, mes, monto, fechaPago } = req.body;

    if (karatecaId == null || !mes || monto === undefined || fechaPago === undefined) {
      return res.status(400).json({
        message: 'Se requiere karatecaId, mes, monto y fechaPago',
      });
    }

    if (!MES_REGEX.test(mes)) {
      return res.status(400).json({ message: "mes debe tener formato 'YYYY-MM'" });
    }

    const kid = Number.parseInt(String(karatecaId), 10);
    if (Number.isNaN(kid)) {
      return res.status(400).json({ message: 'karatecaId inválido' });
    }

    const karateca = await prisma.karateca.findFirst({
      where: { id: kid, activo: true },
    });
    if (!karateca) {
      return res.status(404).json({ message: 'Karateca activo no encontrado' });
    }

    const fecha = parseFechaPagoInput(fechaPago);
    if (Number.isNaN(fecha.getTime())) {
      return res.status(400).json({ message: 'fechaPago inválida' });
    }

    let montoDecimal;
    try {
      montoDecimal = new Prisma.Decimal(String(monto));
    } catch {
      return res.status(400).json({ message: 'monto inválido' });
    }

    const existing = await prisma.mensualidad.findFirst({
      where: { karatecaId: kid, mes },
    });

    let row;
    if (existing) {
      row = await prisma.mensualidad.update({
        where: { id: existing.id },
        data: {
          monto: montoDecimal,
          pagado: true,
          fechaPago: fecha,
        },
      });
    } else {
      row = await prisma.mensualidad.create({
        data: {
          karatecaId: kid,
          mes,
          monto: montoDecimal,
          pagado: true,
          fechaPago: fecha,
        },
      });
    }

    return res.json(serializeMensualidad(row));
  } catch (err) {
    console.error('ERROR registrarPago:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function anularPago(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const mensualidad = await prisma.mensualidad.update({
      where: { id },
      data: {
        pagado: false,
        fechaPago: null,
      },
    });

    return res.json(serializeMensualidad(mensualidad));
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Mensualidad no encontrada' });
    }
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

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

    return res.json(mensualidades.map((m) => serializeMensualidad(m)));
  } catch (err) {
    console.error('ERROR getByKarateca:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = {
  getByMes,
  registrarPago,
  anularPago,
  getByKarateca,
};
