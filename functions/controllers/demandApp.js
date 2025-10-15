const { db } = require('../firebase');

exports.createBulkDemand = async (req, res) => {
  try {
    const doc = await db.collection('bulkDemands').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.listBulkDemands = async (req, res) => {
  try {
    const snap = await db.collection('bulkDemands').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createProductTest = async (req, res) => {
  try {
    const doc = await db.collection('productTests').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.listProductTests = async (req, res) => {
  try {
    const snap = await db.collection('productTests').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createPolicyExecution = async (req, res) => {
  try {
    const doc = await db.collection('policyExecutions').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.listPolicyExecutions = async (req, res) => {
  try {
    const snap = await db.collection('policyExecutions').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.subscribeService = async (req, res) => {
  // Placeholder for subscription/payment logic
  res.json({ success: true, message: 'Subscription endpoint' });
};

exports.login = async (req, res) => {
  // Placeholder for login logic
  res.json({ success: true, message: 'Login endpoint' });
};

exports.getProfile = async (req, res) => {
  // Placeholder for profile fetch logic
  res.json({ success: true, message: 'Profile endpoint' });
};
