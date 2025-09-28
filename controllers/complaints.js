const { db } = require('../firebase');

exports.createComplaint = async (req, res) => {
  try {
    const doc = await db.collection('complaints').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.listComplaints = async (req, res) => {
  try {
    const userId = req.query.userId;
    let query = db.collection('complaints');
    if (userId) query = query.where('userId', '==', userId);
    const snap = await query.get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateComplaint = async (req, res) => {
  try {
    await db.collection('complaints').doc(req.params.id).update(req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
