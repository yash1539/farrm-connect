const { db } = require('../firebase');

exports.createWastePickup = async (req, res) => {
  try {
    const doc = await db.collection('waste').add({
      ...req.body,
      createdAt: new Date()
    });
    res.status(201).json({ id: doc.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.listWastePickups = async (req, res) => {
  try {
    const userId = req.query.userId;
    let query = db.collection('waste');
    if (userId) query = query.where('userId', '==', userId);
    const snap = await query.get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateWastePickup = async (req, res) => {
  try {
    await db.collection('waste').doc(req.params.id).update(req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
