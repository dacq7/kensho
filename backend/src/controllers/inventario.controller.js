const { prisma } = require('../lib/prisma');

async function getAll(req, res) {
  try {
    const items = await prisma.inventario.findMany({
      orderBy: { id: 'asc' },
    });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function create(req, res) {
  try {
    const { nombre, categoria, cantidad, estado, notas } = req.body;
    if (!nombre || !categoria || cantidad === undefined || !estado) {
      return res.status(400).json({
        message: 'nombre, categoria, cantidad y estado son obligatorios',
      });
    }

    const item = await prisma.inventario.create({
      data: {
        nombre,
        categoria,
        cantidad: Number.parseInt(cantidad, 10),
        estado,
        notas: notas ?? undefined,
      },
    });

    return res.status(201).json(item);
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

    const { nombre, categoria, cantidad, estado, notas } = req.body;

    const item = await prisma.inventario.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(categoria !== undefined && { categoria }),
        ...(cantidad !== undefined && { cantidad: Number.parseInt(cantidad, 10) }),
        ...(estado !== undefined && { estado }),
        ...(notas !== undefined && { notas }),
      },
    });

    return res.json(item);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Ítem no encontrado' });
    }
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function remove(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    await prisma.inventario.delete({ where: { id } });

    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Ítem no encontrado' });
    }
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = {
  getAll,
  create,
  update,
  remove,
};
