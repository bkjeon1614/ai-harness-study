import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NoteList } from './NoteList';
import { NotesProvider } from '../context/NotesContext';
import type { Note } from '../types/note';

const FIXTURE: Note[] = [
  {
    id: '1',
    title: 'React Hooks',
    content: 'useState and useEffect',
    tags: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Vue Composition',
    content: 'ref and reactive',
    tags: [],
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
];

function renderWithProvider(searchQuery: string) {
  return render(
    <NotesProvider>
      <NoteList selectedNoteId={null} onSelect={() => {}} searchQuery={searchQuery} />
    </NotesProvider>,
  );
}

describe('NoteList', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(FIXTURE), { status: 200 }),
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it('should display the notes whose content matches `searchQuery` (new behavior)', async () => {
    renderWithProvider('useEffect');
    expect(await screen.findByText('React Hooks')).toBeInTheDocument();
    expect(screen.queryByText('Vue Composition')).not.toBeInTheDocument();
  });
});
