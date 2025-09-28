const { db } = require('../firebase');

exports.getWarehouseStock = async (req, res) => {
  try {
    const snap = await db.collection('warehouseStock').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getDemandSupply = async (req, res) => {
  try {
    const snap = await db.collection('demandSupply').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const snap = await db.collection('payments').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const snap = await db.collection('districtAnalytics').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getRoutePlanning = async (req, res) => {
  try {
    const snap = await db.collection('routePlanning').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
