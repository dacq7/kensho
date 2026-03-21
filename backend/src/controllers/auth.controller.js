const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const { prisma } = require('../lib/prisma');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
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

module.exports = {
  login,
  me,
};
