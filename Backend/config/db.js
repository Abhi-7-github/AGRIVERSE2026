import mongoose from 'mongoose';

let cachedPromise = null;

export const connectDB = async (retries = 2) => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const errorMsg = 'MONGODB_URI environment variable is not defined in the runtime environment.';
    console.error(`\n❌ [MongoDB Config Error]: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const attemptConnect = async (remaining) => {
    try {
      const conn = await mongoose.connect(uri, {
        maxPoolSize: process.env.VERCEL ? 20 : 75,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
      });
      console.log(`[MongoDB] Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      if (remaining > 0) {
        console.warn(`[MongoDB] Connection attempt failed (${error.message}). Retrying in 250ms... (${remaining} left)`);
        await new Promise((r) => setTimeout(r, 250));
        return attemptConnect(remaining - 1);
      }
      throw error;
    }
  };

  cachedPromise = attemptConnect(retries).catch((error) => {
    cachedPromise = null;
    console.error(`\n❌ [MongoDB Connection Error]: ${error.message}`);
    throw error;
  });

  return cachedPromise;
};

