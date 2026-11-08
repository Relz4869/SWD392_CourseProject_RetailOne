const app = require('./app');
const { port } = require('./shared/config/env');
const { getPool, closePool } = require('./shared/config/database');

// Connect to SQL Server first, then listen.
async function start() {
  try {
    await getPool();
    console.log('[DB] Connected to SQL Server');
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }

  const server = app.listen(port, () => console.log(`[API] Listening on http://localhost:${port}`));

  const shutdown = async () => {
    server.close();
    await closePool().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();

