require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const karatecaRoutes = require('./routes/karateca.routes');
const asistenciaRoutes = require('./routes/asistencia.routes');
const mensualidadRoutes = require('./routes/mensualidad.routes');
const configRoutes = require('./routes/config.routes');
const polizaRoutes = require('./routes/poliza.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/karatecas', karatecaRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/mensualidades', mensualidadRoutes);
app.use('/api/config', configRoutes);
app.use('/api/polizas', polizaRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
