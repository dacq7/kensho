const { prisma } = require('../lib/prisma');

const userNombreSelect = {
  select: { nombre: true },
};

function ymdLocal(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mesActualString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

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

function addMonthsYm(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function ultimos6MesesDesc() {
  const mes = mesActualString();
  const list = [mes];
  for (let i = 1; i < 6; i += 1) {
    list.push(addMonthsYm(mes, -i));
  }
  return list.sort((a, b) => b.localeCompare(a));
}

function decimalToNum(monto) {
  if (monto == null) return null;
  return Number(String(monto));
}

function karatecaResumen(k) {
  return {
    karatecaId: k.id,
    nombre: k.user?.nombre ?? '',
    kyu: k.kyuActual ?? '8kyu',
  };
}

async function getResumen(req, res) {
  try {
    const mesActual = mesActualString();

    const [activosTotal, preExamenCount, polizasRows, inventarioGroups, asistenciaRows, mensualidadesRows, karatecasActivos] =
      await Promise.all([
        prisma.karateca.count({ where: { activo: true } }),
        prisma.karateca.count({ where: { activo: true, preExamenAprobado: true } }),
        prisma.poliza.findMany({ select: { fechaVencimiento: true } }),
        prisma.inventario.groupBy({
          by: ['estado'],
          _count: { _all: true },
        }),
        prisma.asistencia.findMany({
          select: { fecha: true, karatecaId: true, presente: true },
        }),
        prisma.mensualidad.findMany({
          select: { karatecaId: true, mes: true, pagado: true },
        }),
        prisma.karateca.findMany({
          where: { activo: true },
          include: { user: userNombreSelect },
          orderBy: { id: 'asc' },
        }),
      ]);

    const polizas = { activas: 0, porVencer: 0, vencidas: 0 };
    for (const p of polizasRows) {
      const e = estadoPoliza(p.fechaVencimiento);
      if (e === 'activa') polizas.activas += 1;
      else if (e === 'por_vencer') polizas.porVencer += 1;
      else polizas.vencidas += 1;
    }

    const inventario = { bueno: 0, regular: 0, malo: 0 };
    for (const g of inventarioGroups) {
      const c = g._count._all;
      if (g.estado === 'BUENO') inventario.bueno = c;
      if (g.estado === 'REGULAR') inventario.regular = c;
      if (g.estado === 'MALO') inventario.malo = c;
    }

    const diasGlobales = new Set();
    const presentesPorKarateca = new Map();
    for (const r of asistenciaRows) {
      const key = ymdLocal(r.fecha);
      diasGlobales.add(key);
      if (!r.presente) continue;
      if (!presentesPorKarateca.has(r.karatecaId)) {
        presentesPorKarateca.set(r.karatecaId, new Set());
      }
      presentesPorKarateca.get(r.karatecaId).add(key);
    }
    const totalClases = diasGlobales.size;

    const mensByKarateca = new Map();
    for (const m of mensualidadesRows) {
      if (!mensByKarateca.has(m.karatecaId)) mensByKarateca.set(m.karatecaId, []);
      mensByKarateca.get(m.karatecaId).push(m);
    }

    const alDia = [];
    const unMes = [];
    const masDe1Mes = [];

    for (const k of karatecasActivos) {
      const mens = mensByKarateca.get(k.id) ?? [];
      const paidCurrent = mens.some((m) => m.mes === mesActual && m.pagado === true);
      if (paidCurrent) {
        alDia.push(karatecaResumen(k));
        continue;
      }
      const unpaid = mens.filter((m) => !m.pagado);
      const hasOlderUnpaid = unpaid.some((m) => m.mes < mesActual);
      if (hasOlderUnpaid) {
        masDe1Mes.push(karatecaResumen(k));
      } else {
        unMes.push(karatecaResumen(k));
      }
    }

    const asistenciaPromedio = karatecasActivos.map((k) => {
      const presentSet = presentesPorKarateca.get(k.id);
      const presentDays = presentSet ? presentSet.size : 0;
      const promedio =
        totalClases === 0 ? 0 : Math.round((presentDays / totalClases) * 100);
      return {
        karatecaId: k.id,
        nombre: k.user?.nombre ?? '',
        kyu: k.kyuActual ?? '8kyu',
        promedio,
      };
    });

    return res.json({
      karatecas: {
        total: activosTotal,
        preExamenAprobado: preExamenCount,
      },
      mensualidades: {
        alDia,
        unMes,
        masDe1Mes,
      },
      polizas,
      asistenciaPromedio,
      inventario,
    });
  } catch (err) {
    console.error('ERROR dashboard.getResumen:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

const userKaratecaDashboardSelect = {
  select: {
    nombre: true,
    email: true,
    telefono: true,
    fechaNacimiento: true,
    fechaIngreso: true,
  },
};

async function getResumenKarateca(req, res) {
  try {
    const userId = req.user?.userId;
    if (userId == null) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const karateca = await prisma.karateca.findUnique({
      where: { userId },
      include: {
        user: userKaratecaDashboardSelect,
      },
    });

    if (!karateca) {
      return res.status(404).json({ message: 'Karateca no encontrado' });
    }

    const [asistenciaRows, mensualidadesKarateca, polizaReciente] = await Promise.all([
      prisma.asistencia.findMany({
        select: { fecha: true, karatecaId: true, presente: true },
      }),
      prisma.mensualidad.findMany({
        where: { karatecaId: karateca.id },
        orderBy: { mes: 'desc' },
      }),
      prisma.poliza.findFirst({
        where: { karatecaId: karateca.id },
        orderBy: { fechaVencimiento: 'desc' },
      }),
    ]);

    const diasGlobales = new Set();
    const presentesKarateca = new Set();
    for (const r of asistenciaRows) {
      const key = ymdLocal(r.fecha);
      diasGlobales.add(key);
      if (r.karatecaId === karateca.id && r.presente) {
        presentesKarateca.add(key);
      }
    }
    const totalClases = diasGlobales.size;
    const clasesAsistidas = presentesKarateca.size;
    const promedioAsistencia =
      totalClases === 0 ? 0 : Math.round((clasesAsistidas / totalClases) * 100);

    const mesesVentana = ultimos6MesesDesc();
    const mensMap = new Map(mensualidadesKarateca.map((m) => [m.mes, m]));
    const mensualidades = mesesVentana.map((mes) => {
      const m = mensMap.get(mes);
      if (!m) {
        return {
          mes,
          pagado: false,
          monto: null,
          fechaPago: null,
        };
      }
      return {
        mes: m.mes,
        pagado: m.pagado,
        monto: decimalToNum(m.monto),
        fechaPago: m.fechaPago,
      };
    });

    let poliza = null;
    if (polizaReciente) {
      poliza = {
        aseguradora: polizaReciente.aseguradora,
        numeroPoliza: polizaReciente.numeroPoliza,
        fechaInicio: polizaReciente.fechaInicio,
        fechaVencimiento: polizaReciente.fechaVencimiento,
        estado: estadoPoliza(polizaReciente.fechaVencimiento),
      };
    }

    return res.json({
      karateca: {
        id: karateca.id,
        kyuActual: karateca.kyuActual,
        preExamenAprobado: karateca.preExamenAprobado,
        fechaUltimoAscenso: karateca.fechaUltimoAscenso,
        user: karateca.user,
      },
      asistencia: {
        promedio: promedioAsistencia,
        totalClases,
        clasesAsistidas,
      },
      mensualidades,
      poliza,
    });
  } catch (err) {
    console.error('ERROR dashboard.getResumenKarateca:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = {
  getResumen,
  getResumenKarateca,
};
