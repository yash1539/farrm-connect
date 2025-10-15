const admin = require('firebase-admin');
const serviceAccount = require('./fir-ac00e-firebase-adminsdk-fbsvc-44fb7b2a3f.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'fir-ac00e.appspot.com' // <-- Replace with your bucket name
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

module.exports = { admin, db, bucket };
