const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const { prisma } = require('../lib/prisma');

async function login(req, res) {
  try {
    const { numeroDocumento, password } = req.body;
    if (!numeroDocumento || !password) {
      return res.status(400).json({ message: 'Número de documento y contraseña son obligatorios' });
    }

    const doc = String(numeroDocumento).trim();
    const user = await prisma.user.findUnique({ where: { numeroDocumento: doc } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = generateToken({ userId: user.id, rol: user.rol });
    const { password: _pw, ...userSafe } = user;

    return res.json({
      token,
      user: userSafe,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
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
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function changePassword(req, res) {
  try {
    const { passwordActual, passwordNueva } = req.body;
    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({ message: 'Contraseña actual y nueva son obligatorias' });
    }
    if (typeof passwordNueva !== 'string' || passwordNueva.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, password: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const ok = await bcrypt.compare(passwordActual, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }

    const hash = await bcrypt.hash(passwordNueva, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash },
    });

    return res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function resetPassword(req, res) {
  try {
    const userId = Number.parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    const { passwordNueva } = req.body;
    if (!passwordNueva || typeof passwordNueva !== 'string' || passwordNueva.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!exists) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const hash = await bcrypt.hash(passwordNueva, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hash },
    });

    return res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

module.exports = {
  login,
  me,
  changePassword,
  resetPassword,
};
