import type { Note } from '../types/note';

export function matchesQuery(note: Pick<Note, 'title' | 'content'>, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (normalized === '') return true;
  return (
    note.title.toLowerCase().includes(normalized) || note.content.toLowerCase().includes(normalized)
  );
}
