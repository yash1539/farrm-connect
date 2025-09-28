const { db, admin } = require('../firebase');

exports.signup = async (req, res) => {
  // Placeholder for Aadhaar/KCC onboarding logic
  res.json({ success: true, message: 'Signup endpoint' });
};

exports.verify = async (req, res) => {
  // Placeholder for identity verification logic
  res.json({ success: true, message: 'Verify endpoint' });
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.query.userId;
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateConsent = async (req, res) => {
  try {
    const userId = req.body.userId;
    await db.collection('users').doc(userId).update({ consent: req.body.consent });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
