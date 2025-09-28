const { db, bucket } = require('../firebase');

exports.createProduce = async (req, res) => {
  try {
    // For simplicity, image upload is not handled here
    const doc = await db.collection('produce').add({
      ...req.body,
      createdAt: new Date()
    });
    res.status(201).json({ id: doc.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.listProduce = async (req, res) => {
  try {
    const userId = req.query.userId;
    let query = db.collection('produce');
    if (userId) query = query.where('userId', '==', userId);
    const snap = await query.get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getProduce = async (req, res) => {
  try {
    const doc = await db.collection('produce').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateProduce = async (req, res) => {
  try {
    await db.collection('produce').doc(req.params.id).update(req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
