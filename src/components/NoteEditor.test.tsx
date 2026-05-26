import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { NoteEditor } from './NoteEditor';
import type { Note } from '../types/note';

let mockNotes: Note[] = [];
const mockCreateNote = vi.fn();
const mockUpdateNote = vi.fn();

vi.mock('../context/NotesContext', () => ({
  useNotes: () => ({
    notes: mockNotes,
    createNote: mockCreateNote,
    updateNote: mockUpdateNote,
  }),
}));

beforeEach(() => {
  mockNotes = [];
  mockCreateNote.mockReset();
  mockUpdateNote.mockReset();
});

describe('NoteEditor', () => {
  it('should render existing tags as chips between title input and content textarea when selected note has non-empty tags', () => {
    mockNotes = [
      {
        id: 'n1',
        title: '제목',
        content: '본문',
        tags: ['react', 'demo'],
        createdAt: '2026-05-26T00:00:00.000Z',
        updatedAt: '2026-05-26T00:00:00.000Z',
      },
    ];

    render(<NoteEditor selectedNoteId="n1" isCreating={false} onDone={() => {}} />);

    const titleInput = screen.getByPlaceholderText('제목');
    const contentTextarea = screen.getByPlaceholderText('내용을 입력하세요...');
    const reactChip = screen.getByText('react');
    const demoChip = screen.getByText('demo');

    const all = Array.from(document.querySelectorAll('*'));
    const pos = (el: Element) => all.indexOf(el);
    expect(pos(titleInput)).toBeLessThan(pos(reactChip));
    expect(pos(titleInput)).toBeLessThan(pos(demoChip));
    expect(pos(reactChip)).toBeLessThan(pos(contentTextarea));
    expect(pos(demoChip)).toBeLessThan(pos(contentTextarea));
  });

  it('should render the tag area without any chip when selected note has empty tags', () => {
    mockNotes = [
      {
        id: 'n1',
        title: '제목',
        content: '본문',
        tags: [],
        createdAt: '2026-05-26T00:00:00.000Z',
        updatedAt: '2026-05-26T00:00:00.000Z',
      },
    ];

    render(<NoteEditor selectedNoteId="n1" isCreating={false} onDone={() => {}} />);

    expect(screen.getByTestId('tag-area')).toBeInTheDocument();
    expect(screen.queryByText('react')).toBeNull();
    expect(screen.queryByText('demo')).toBeNull();
    expect(screen.queryByText(/태그/)).toBeNull();
    expect(screen.queryByText(/추가/)).toBeNull();
  });

  it('should update displayed chips immediately when selectedNoteId switches to a note with different tags', () => {
    mockNotes = [
      {
        id: 'nA',
        title: 'A',
        content: '',
        tags: ['react'],
        createdAt: '2026-05-26T00:00:00.000Z',
        updatedAt: '2026-05-26T00:00:00.000Z',
      },
      {
        id: 'nB',
        title: 'B',
        content: '',
        tags: ['typescript', 'study'],
        createdAt: '2026-05-26T00:00:00.000Z',
        updatedAt: '2026-05-26T00:00:00.000Z',
      },
    ];

    const { rerender } = render(
      <NoteEditor selectedNoteId="nA" isCreating={false} onDone={() => {}} />,
    );
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.queryByText('typescript')).toBeNull();

    rerender(<NoteEditor selectedNoteId="nB" isCreating={false} onDone={() => {}} />);
    expect(screen.queryByText('react')).toBeNull();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('study')).toBeInTheDocument();
  });

  it('should render the tag area without any chip in creating mode (no selectedNote)', () => {
    mockNotes = [];

    render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={() => {}} />);

    expect(screen.getByTestId('tag-area')).toBeInTheDocument();
    expect(screen.queryByText(/태그/)).toBeNull();
    expect(screen.queryByText(/추가/)).toBeNull();
  });

  it('should call createNote with tags as an empty array when saving a new note in creating mode', async () => {
    mockNotes = [];
    mockCreateNote.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={() => {}} />);

    await user.type(screen.getByPlaceholderText('제목'), '새 노트');
    await user.type(screen.getByPlaceholderText('내용을 입력하세요...'), '본문');
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(mockCreateNote).toHaveBeenCalledTimes(1);
    expect(mockCreateNote).toHaveBeenCalledWith({
      title: '새 노트',
      content: '본문',
      tags: [],
    });
  });

  describe('handleSave (issue #10 tags fix)', () => {
    it("should call updateNote with `tags` equal to the selected note's existing tags when saving an edited note whose tags are non-empty", async () => {
      mockNotes = [
        {
          id: 'n1',
          title: '제목',
          content: '본문',
          tags: ['react', 'study'],
          createdAt: '2026-05-26T00:00:00.000Z',
          updatedAt: '2026-05-26T00:00:00.000Z',
        },
      ];
      mockUpdateNote.mockResolvedValueOnce(undefined);
      const user = userEvent.setup();

      render(<NoteEditor selectedNoteId="n1" isCreating={false} onDone={() => {}} />);
      await user.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateNote).toHaveBeenCalledTimes(1);
      expect(mockUpdateNote).toHaveBeenCalledWith(
        'n1',
        expect.objectContaining({ tags: ['react', 'study'] }),
      );
    });

    it('should call updateNote with `tags: []` when saving an edited note whose existing tags are an empty array', async () => {
      mockNotes = [
        {
          id: 'n1',
          title: '제목',
          content: '본문',
          tags: [],
          createdAt: '2026-05-26T00:00:00.000Z',
          updatedAt: '2026-05-26T00:00:00.000Z',
        },
      ];
      mockUpdateNote.mockResolvedValueOnce(undefined);
      const user = userEvent.setup();

      render(<NoteEditor selectedNoteId="n1" isCreating={false} onDone={() => {}} />);
      await user.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateNote).toHaveBeenCalledTimes(1);
      expect(mockUpdateNote).toHaveBeenCalledWith('n1', expect.objectContaining({ tags: [] }));
    });

    it("should call createNote with `tags: []` when saving a new note in creating mode (no tag input UI in this issue's scope)", async () => {
      mockNotes = [];
      mockCreateNote.mockResolvedValueOnce(undefined);
      const user = userEvent.setup();

      render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={() => {}} />);
      await user.type(screen.getByPlaceholderText('제목'), '신규');
      await user.click(screen.getByRole('button', { name: '저장' }));

      expect(mockCreateNote).toHaveBeenCalledTimes(1);
      expect(mockCreateNote).toHaveBeenCalledWith(expect.objectContaining({ tags: [] }));
    });

    it('should not call createNote or updateNote when title trims to empty (existing guard preserved across the tags fix)', async () => {
      mockNotes = [];
      mockCreateNote.mockResolvedValueOnce(undefined);
      mockUpdateNote.mockResolvedValueOnce(undefined);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup();

      render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={() => {}} />);
      await user.click(screen.getByRole('button', { name: '저장' }));

      expect(mockCreateNote).not.toHaveBeenCalled();
      expect(mockUpdateNote).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('form sync (issue #10 tags fix)', () => {
    it('should initialize internal tags state from `selectedNote.tags` when a note with non-empty tags is selected', async () => {
      mockNotes = [
        {
          id: 'n1',
          title: '제목',
          content: '본문',
          tags: ['typescript'],
          createdAt: '2026-05-26T00:00:00.000Z',
          updatedAt: '2026-05-26T00:00:00.000Z',
        },
      ];
      mockUpdateNote.mockResolvedValueOnce(undefined);
      const user = userEvent.setup();

      render(<NoteEditor selectedNoteId="n1" isCreating={false} onDone={() => {}} />);
      await user.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateNote).toHaveBeenCalledTimes(1);
      expect(mockUpdateNote).toHaveBeenCalledWith(
        'n1',
        expect.objectContaining({ tags: expect.arrayContaining(['typescript']) }),
      );
    });

    it("should resync internal tags state to the new note's tags when `selectedNoteId` switches between notes with different tags", async () => {
      mockNotes = [
        {
          id: 'nA',
          title: 'A',
          content: '',
          tags: ['react'],
          createdAt: '2026-05-26T00:00:00.000Z',
          updatedAt: '2026-05-26T00:00:00.000Z',
        },
        {
          id: 'nB',
          title: 'B',
          content: '',
          tags: ['typescript', 'study'],
          createdAt: '2026-05-26T00:00:00.000Z',
          updatedAt: '2026-05-26T00:00:00.000Z',
        },
      ];
      mockUpdateNote.mockResolvedValueOnce(undefined);
      const user = userEvent.setup();

      const { rerender } = render(
        <NoteEditor selectedNoteId="nA" isCreating={false} onDone={() => {}} />,
      );
      rerender(<NoteEditor selectedNoteId="nB" isCreating={false} onDone={() => {}} />);
      await user.click(screen.getByRole('button', { name: '저장' }));

      expect(mockUpdateNote).toHaveBeenCalledTimes(1);
      expect(mockUpdateNote).toHaveBeenCalledWith(
        'nB',
        expect.objectContaining({ tags: ['typescript', 'study'] }),
      );
    });

    it('should initialize internal tags state to `[]` when entering creating mode (`isCreating=true`, no selectedNote)', async () => {
      mockNotes = [];
      mockCreateNote.mockResolvedValueOnce(undefined);
      const user = userEvent.setup();

      render(<NoteEditor selectedNoteId={null} isCreating={true} onDone={() => {}} />);
      await user.type(screen.getByPlaceholderText('제목'), '신규');
      await user.click(screen.getByRole('button', { name: '저장' }));

      expect(mockCreateNote).toHaveBeenCalledTimes(1);
      expect(mockCreateNote).toHaveBeenCalledWith(
        expect.objectContaining({ tags: expect.arrayContaining([]) }),
      );
      const calledArg = mockCreateNote.mock.calls[0][0];
      expect(calledArg.tags).toEqual([]);
    });
  });
});
