const { db } = require('../firebase');

exports.applyFinance = async (req, res) => {
  try {
    const doc = await db.collection('finance').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.trackStatus = async (req, res) => {
  try {
    const userId = req.query.userId;
    let query = db.collection('finance');
    if (userId) query = query.where('userId', '==', userId);
    const snap = await query.get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.uploadDocs = async (req, res) => {
  // Placeholder for document upload logic
  res.json({ success: true, message: 'Document upload endpoint' });
};

exports.qrBilling = async (req, res) => {
  // Placeholder for QR billing logic
  res.json({ success: true, message: 'QR billing endpoint' });
};
