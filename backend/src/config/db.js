import mongoose from 'mongoose';

let memoryServer;

export async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI is required in production');
    }
    // Zero-config local development: spin up an in-memory MongoDB.
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('todo');
    console.warn('⚠  MONGODB_URI not set — using in-memory MongoDB (data is lost on restart)');
  }

  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
