const { db } = require('../firebase');

// M1 Procurement & Data
exports.createProcurement = async (req, res) => {
  try {
    const doc = await db.collection('merchantProcurements').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.listProcurements = async (req, res) => {
  try {
    const snap = await db.collection('merchantProcurements').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.captureVillageData = async (req, res) => {
  try {
    const doc = await db.collection('villageData').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// M2 Input & Finance
exports.recordInputSale = async (req, res) => {
  try {
    const doc = await db.collection('inputSales').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.listInputSales = async (req, res) => {
  try {
    const snap = await db.collection('inputSales').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.facilitateFinance = async (req, res) => {
  try {
    const doc = await db.collection('financeFacilitation').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.logSoilTest = async (req, res) => {
  try {
    const doc = await db.collection('soilTests').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.recordAsfsCredit = async (req, res) => {
  try {
    const doc = await db.collection('asfsCredits').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// M3 Equipment & Schemes
exports.createEquipmentRental = async (req, res) => {
  try {
    const doc = await db.collection('equipmentRentals').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.updateEquipmentRental = async (req, res) => {
  try {
    await db.collection('equipmentRentals').doc(req.params.id).update(req.body);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.logEquipmentRepair = async (req, res) => {
  try {
    const doc = await db.collection('equipmentRepairs').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.recordEquipmentSale = async (req, res) => {
  try {
    const doc = await db.collection('equipmentSales').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// M4 Urban Merchant
exports.createB2BOrder = async (req, res) => {
  try {
    const doc = await db.collection('b2bOrders').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.updateB2BOrder = async (req, res) => {
  try {
    await db.collection('b2bOrders').doc(req.params.id).update(req.body);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.listB2BOrders = async (req, res) => {
  try {
    const snap = await db.collection('b2bOrders').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.manageLogistics = async (req, res) => {
  try {
    const doc = await db.collection('merchantLogistics').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Extras (all roles)
exports.onboardFarmer = async (req, res) => {
  try {
    const doc = await db.collection('farmers').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.createDemandForFarmer = async (req, res) => {
  try {
    const doc = await db.collection('demands').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.getEarningsAlerts = async (req, res) => {
  try {
    const snap = await db.collection('earningsAlerts').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.getLearningReels = async (req, res) => {
  try {
    const snap = await db.collection('merchantReels').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Merchant Lead
exports.listApprovals = async (req, res) => {
  try {
    const snap = await db.collection('merchantApprovals').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.updateApproval = async (req, res) => {
  try {
    await db.collection('merchantApprovals').doc(req.params.id).update(req.body);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.listLogisticsRequests = async (req, res) => {
  try {
    const snap = await db.collection('logisticsRequests').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.updateFraudCheck = async (req, res) => {
  try {
    await db.collection('fraudChecks').doc(req.params.id).update(req.body);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.logClusterQuality = async (req, res) => {
  try {
    const doc = await db.collection('clusterQuality').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
