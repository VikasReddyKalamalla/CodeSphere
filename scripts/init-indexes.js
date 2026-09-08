// scripts/init-indexes.js
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:rootpassword@localhost:27017/codesphere?authSource=admin';

async function applyProductionIndexes() {
  try {
    console.log('Connecting to MongoDB for production index application...');
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    console.log('Creating compound indexes across high-traffic collections...');

    // 1. DSA Submissions Indexing
    await db.collection('dsasubmissions').createIndex({ studentId: 1, problemId: 1, createdAt: -1 });
    await db.collection('dsasubmissions').createIndex({ status: 1, createdAt: -1 });

    // 2. Cloud Workspace Indexing
    await db.collection('workspaceclouds').createIndex({ studentId: 1, updatedAt: -1 });
    await db.collection('workspaceclouds').createIndex({ status: 1 });

    // 3. User Activity & Analytics Indexing
    await db.collection('activitylogs').createIndex({ studentId: 1, createdAt: -1 });
    await db.collection('analyticsevents').createIndex({ eventName: 1, timestamp: -1 });

    // 4. Test Attempts & Assessments Indexing
    await db.collection('testattempts').createIndex({ studentId: 1, testId: 1, status: 1 });

    console.log('✓ All production indexes successfully applied!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to apply database indexes:', err);
    process.exit(1);
  }
}

applyProductionIndexes();
