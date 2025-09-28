const { db } = require('../firebase');

exports.listReels = async (req, res) => {
  try {
    const snap = await db.collection('reels').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.uploadReel = async (req, res) => {
  // Placeholder for video upload logic
  res.json({ success: true, message: 'Reel upload endpoint' });
};
