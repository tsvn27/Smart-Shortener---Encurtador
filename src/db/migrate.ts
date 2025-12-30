import { existsSync, mkdirSync } from 'fs';
import { initDb, closeDb } from './index.js';

if (!existsSync('data')) mkdirSync('data');

try {
  initDb();
  console.log('Migrations complete');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  closeDb();
}
