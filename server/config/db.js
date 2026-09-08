const mongoose = require('mongoose');

const connectDB = async () => {
  const localUri = 'mongodb://127.0.0.1:27017/codesphere';
  const primaryUri = process.env.MONGO_URI;
  const fallbackUris = [
    'mongodb://root:rootpassword@localhost:27017/codesphere?authSource=admin',
    process.env.MONGO_URI_ATLAS
  ].filter(Boolean);

  const urisToTry = Array.from(new Set([localUri, primaryUri, ...fallbackUris])).filter(Boolean);

  for (const uri of urisToTry) {
    try {
      const isAtlas = uri.includes('mongodb+srv');
      console.log(`Connecting to MongoDB (${isAtlas ? 'Atlas Remote' : 'Local'})...`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '200', 10),
        minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || '20', 10),
        maxIdleTimeMS: 30000,
        socketTimeoutMS: 45000,
        readPreference: process.env.NODE_ENV === 'production' ? 'secondaryPreferred' : 'primary',
      });
      console.log(`✓ MongoDB Connected: ${conn.connection.host} | DB Name: ${conn.connection.name}`);
      return conn;
    } catch (error) {
      console.warn(`MongoDB connection attempt failed (${uri.includes('mongodb+srv') ? 'Atlas Remote' : uri}): ${error.message}`);
    }
  }

  console.warn('⚠️ MongoDB connection failed on all targets. Server running with limited/mock fallbacks.');
};

module.exports = connectDB;

