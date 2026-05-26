import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('db.json seed', () => {
  it('should include a tags array on every note entry in the seed data', () => {
    const raw = readFileSync(resolve(__dirname, '../../db.json'), 'utf-8');
    const db = JSON.parse(raw) as { notes: Array<Record<string, unknown>> };

    expect(Array.isArray(db.notes)).toBe(true);
    expect(db.notes.length).toBeGreaterThan(0);

    for (const note of db.notes) {
      expect(Array.isArray(note.tags)).toBe(true);
    }
  });
});
