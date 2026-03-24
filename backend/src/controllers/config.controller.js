const { prisma } = require('../lib/prisma');

async function get(req, res) {
  try {
    const { clave } = req.params;
    if (!clave || typeof clave !== 'string') {
      return res.status(400).json({ message: 'Clave inválida' });
    }

    const row = await prisma.config.findUnique({ where: { clave } });
    if (!row) {
      return res.status(404).json({ message: 'Config no encontrada' });
    }

    return res.json({ clave: row.clave, valor: row.valor });
  } catch (err) {
    console.error('ERROR config.get:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function set(req, res) {
  try {
    const { clave, valor } = req.body;
    if (!clave || typeof clave !== 'string' || valor === undefined || valor === null) {
      return res.status(400).json({ message: 'Se requiere clave (string) y valor' });
    }

    const strValor = String(valor);

    const row = await prisma.config.upsert({
      where: { clave },
      create: { clave, valor: strValor },
      update: { valor: strValor },
    });

    return res.json({ clave: row.clave, valor: row.valor });
  } catch (err) {
    console.error('ERROR config.set:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = {
  get,
  set,
};
