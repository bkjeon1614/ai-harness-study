import { copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DB = path.join(ROOT, 'db.json');
const BACKUP = path.join(ROOT, 'db.json.e2e-bak');

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export default async function globalSetup(): Promise<void> {
  if (await exists(DB)) {
    await copyFile(DB, BACKUP);
  }
}
