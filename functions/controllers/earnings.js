const { db } = require('../firebase');

exports.getEarnings = async (req, res) => {
  try {
    const userId = req.query.userId;
    let query = db.collection('earnings');
    if (userId) query = query.where('userId', '==', userId);
    const snap = await query.get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const doc = await db.collection('expenses').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.addIncome = async (req, res) => {
  try {
    const doc = await db.collection('income').add({ ...req.body, createdAt: new Date() });
    res.status(201).json({ id: doc.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getReminders = async (req, res) => {
  try {
    const snap = await db.collection('reminders').get();
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
