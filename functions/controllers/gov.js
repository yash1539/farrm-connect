const { db } = require('../firebase');

exports.listForms = async (req, res) => {
  try {
    const snap = await db.collection('govForms').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.submitForm = async (req, res) => {
  try {
    const doc = await db.collection('govFormsSubmissions').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createLegalSupport = async (req, res) => {
  try {
    const doc = await db.collection('legalSupport').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.trackLegalSupport = async (req, res) => {
  try {
    const userId = req.query.userId;
    let query = db.collection('legalSupport');
    if (userId) query = query.where('userId', '==', userId);
    const snap = await query.get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
