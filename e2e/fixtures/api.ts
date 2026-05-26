import { request } from '@playwright/test';
import { SEED_NOTES, type SeedNote } from './seed';

const API_URL = 'http://localhost:3001';

async function fetchAllIds(): Promise<string[]> {
  const ctx = await request.newContext();
  const res = await ctx.get(`${API_URL}/notes`);
  if (!res.ok()) throw new Error(`Failed to list notes: ${res.status()}`);
  const notes = (await res.json()) as Array<{ id: string }>;
  await ctx.dispose();
  return notes.map((n) => n.id);
}

export async function clearDb(): Promise<void> {
  const ids = await fetchAllIds();
  const ctx = await request.newContext();
  for (const id of ids) {
    await ctx.delete(`${API_URL}/notes/${id}`);
  }
  await ctx.dispose();
}

export async function seedDb(notes: SeedNote[] = SEED_NOTES): Promise<void> {
  const ctx = await request.newContext();
  for (const note of notes) {
    const res = await ctx.post(`${API_URL}/notes`, { data: note });
    if (!res.ok()) throw new Error(`Failed to seed note ${note.id}: ${res.status()}`);
  }
  await ctx.dispose();
}

export async function resetDb(notes: SeedNote[] = SEED_NOTES): Promise<void> {
  await clearDb();
  await seedDb(notes);
}
