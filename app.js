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
app.use(cors());
app.use(bodyParser.json());


app.use('/demands', demandRoutes);
app.use('/produce', produceRoutes);
app.use('/waste', wasteRoutes);
app.use('/equipment', equipmentRoutes);
app.use('/finance', financeRoutes);
app.use('/reels', reelsRoutes);
app.use('/advisory', advisoryRoutes);
app.use('/gov', govRoutes);
app.use('/complaints', complaintsRoutes);
app.use('/earnings', earningsRoutes);
app.use('/auth', authRoutes);
app.use('/demand-app', demandAppRoutes);
app.use('/district', districtRoutes);
app.use('/hq', hqRoutes);
app.use('/merchant', merchantRoutes);

app.get('/', (req, res) => res.send('ON SAHP Agri API running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
