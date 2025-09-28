const { db } = require('../firebase');

exports.getAnalytics = async (req, res) => {
  try {
    const snap = await db.collection('hqAnalytics').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getForecast = async (req, res) => {
  try {
    const snap = await db.collection('hqForecast').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getPolicyReports = async (req, res) => {
  try {
    const snap = await db.collection('hqPolicyReports').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
