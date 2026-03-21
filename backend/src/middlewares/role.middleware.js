function requireRole(rol) {
  return (req, res, next) => {
    if (!req.user || req.user.rol !== rol) {
      return res.status(403).json({ message: 'Prohibido' });
    }
    next();
  };
}

module.exports = requireRole;
