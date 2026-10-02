// Local PostgreSQL 16 for development (no Docker needed). Run: node .local-postgres/start.mjs
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('./data', import.meta.url));
const pg = new EmbeddedPostgres({ databaseDir: dir, user: 'cityplus', password: 'cityplus', port: 5432, persistent: true });

if (!existsSync(dir)) {
  await pg.initialise();
  await pg.start();
  await pg.createDatabase('cityplus');
} else {
  await pg.start();
}
console.log('PostgreSQL running on localhost:5432 (Ctrl+C to stop)');
const stop = async () => { await pg.stop(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
