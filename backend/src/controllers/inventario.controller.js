const { prisma } = require('../lib/prisma');

async function getAll(req, res) {
  try {
    const items = await prisma.inventario.findMany({
      orderBy: { nombre: 'asc' },
    });
    return res.json(items);
  } catch (err) {
    console.error('ERROR inventario.getAll:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function create(req, res) {
  try {
    const { nombre, categoria, cantidad, estado, notas } = req.body;

    if (!nombre || nombre === '') {
      return res.status(400).json({ message: 'El nombre es obligatorio' });
    }
    if (cantidad === undefined || cantidad === null || cantidad === '') {
      return res.status(400).json({ message: 'La cantidad es obligatoria' });
    }

    const cantidadNum = Number.parseInt(String(cantidad), 10);
    if (Number.isNaN(cantidadNum) || cantidadNum < 0) {
      return res.status(400).json({ message: 'La cantidad debe ser un número entero válido' });
    }

    if (!categoria || !estado) {
      return res.status(400).json({ message: 'categoria y estado son obligatorios' });
    }

    const item = await prisma.inventario.create({
      data: {
        nombre: String(nombre).trim(),
        categoria,
        cantidad: cantidadNum,
        estado,
        notas: notas === '' || notas == null ? undefined : String(notas),
      },
    });

    return res.status(201).json(item);
  } catch (err) {
    console.error('ERROR inventario.create:', err);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function update(req, res) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const existente = await prisma.inventario.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ message: 'Ítem no encontrado' });
    }

    const { nombre, categoria, cantidad, estado, notas } = req.body;

    const data = {};
    if (nombre !== undefined) data.nombre = String(nombre).trim();
    if (categoria !== undefined) data.categoria = categoria;
    if (cantidad !== undefined) {
      const cantidadNum = Number.parseInt(String(cantidad), 10);
      if (Number.isNaN(cantidadNum) || cantidadNum < 0) {
        return res.status(400).json({ message: 'La cantidad debe ser un número entero válido' });
      }
      data.cantidad = cantidadNum;
    }
    if (estado !== undefined) data.estado = estado;
    if (notas !== undefined) data.notas = notas === '' || notas == null ? null : String(notas);

    const item = await prisma.inventario.update({
      where: { id },
      data,
    });

    return res.json(item);
  } catch (err) {
    console.error('ERROR inventario.update:', err);
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

    const existente = await prisma.inventario.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ message: 'Ítem no encontrado' });
    }

    await prisma.inventario.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error('ERROR inventario.remove:', err);
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
