import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

const PORT = process.env.PORT || 5050;

async function start() {
  await connectDB();
  const app = createApp();
  const server = app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));

  const shutdown = async () => {
    server.close();
    await disconnectDB();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
