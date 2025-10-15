const functions = require("firebase-functions");

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const firebase = require('./firebase');

const demandRoutes = require('./routes/demand');
const produceRoutes = require('./routes/produce');
const wasteRoutes = require('./routes/waste');
const equipmentRoutes = require('./routes/equipment');
const financeRoutes = require('./routes/finance');
const reelsRoutes = require('./routes/reels');
const advisoryRoutes = require('./routes/advisory');
const govRoutes = require('./routes/gov');
const complaintsRoutes = require('./routes/complaints');
const earningsRoutes = require('./routes/earnings');
const authRoutes = require('./routes/auth');
const demandAppRoutes = require('./routes/demandApp');
const districtRoutes = require('./routes/district');
const hqRoutes = require('./routes/hq');
const merchantRoutes = require('./routes/merchant');

const app = express();

// Configure CORS - Allow all origins
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.status(200).json({
      status: 'success',
      message: 'OK'
    });
  }
  next();
});

app.use(cors());
app.use(bodyParser.json());

// API Routes
app.use('/api/demands', demandRoutes);
app.use('/api/produce', produceRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/reels', reelsRoutes);
app.use('/api/advisory', advisoryRoutes);
app.use('/api/gov', govRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/demand-app', demandAppRoutes);
app.use('/api/district', districtRoutes);
app.use('/api/hq', hqRoutes);
app.use('/api/merchant', merchantRoutes);

// Welcome route with API documentation
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'ON SAHP Agri API running',
    version: '1.0.0',
    documentation: {
      description: 'Agricultural services API',
      endpoints: {
        demands: '/api/demands',
        produce: '/api/produce',
        waste: '/api/waste',
        equipment: '/api/equipment',
        finance: '/api/finance',
        reels: '/api/reels',
        advisory: '/api/advisory',
        gov: '/api/gov',
        complaints: '/api/complaints',
        earnings: '/api/earnings',
        auth: '/api/auth',
        demandApp: '/api/demand-app',
        district: '/api/district',
        hq: '/api/hq',
        merchant: '/api/merchant'
      }
    }
  });
});

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong on the server'
  });
});

// For Firebase deployment
exports.api = functions.https.onRequest((req, res) => {
  // Set CORS headers for all responses
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  return app(req, res);
});