const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db'); // Database connection trigger
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const viewRoutes = require('./routes/viewRoutes');
const oyuncuRoutes = require('./routes/oyuncuRoutes');
const sponsorRoutes = require('./routes/sponsorRoutes');
const teknikEkipRoutes = require('./routes/teknikEkipRoutes');
const tesisRoutes = require('./routes/tesisRoutes');
const taraftarRoutes = require('./routes/taraftarRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const agirlikRoutes = require('./routes/agirlikRoutes');
const senaryoRoutes = require('./routes/senaryoRoutes');
const utilRoutes = require('./routes/utilRoutes');

// API Mount Points
app.use('/', viewRoutes);
app.use('/api/oyuncular', oyuncuRoutes);
app.use('/api/sponsorlar', sponsorRoutes);
app.use('/api/teknik-ekip', teknikEkipRoutes);
app.use('/api/tesisler', tesisRoutes);
app.use('/api/taraftar-gruplari', taraftarRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/agirlik-ayarlari', agirlikRoutes);
app.use('/api/karsilastirma-senaryo', senaryoRoutes);
app.use('/api', utilRoutes); // For /api/pozisyonlar, /api/gorevler

// Function to get Local IP Address
const os = require('os');
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Serve frontend for any other route
app.get('*', (req, res) => {
  res.render('index');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const localIp = getLocalIpAddress();
  console.log(`🚀 Server başlatıldı:`);
  console.log(`📡 Local:   http://localhost:${PORT}`);
  console.log(`🌐 Network: http://${localIp}:${PORT}`);
});
