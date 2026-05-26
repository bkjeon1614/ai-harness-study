import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TagList } from './TagList';

describe('TagList', () => {
  it('should render one chip per tag in the given order when tags has multiple entries', () => {
    render(<TagList tags={['react', 'typescript', 'vite']} />);
    const chips = screen.getAllByText(/^(react|typescript|vite)$/);
    expect(chips.map((el) => el.textContent)).toEqual(['react', 'typescript', 'vite']);
  });

  it('should render a single chip when tags has exactly one entry', () => {
    render(<TagList tags={['react']} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.queryAllByText(/.+/).filter((el) => el.textContent === 'react')).toHaveLength(1);
  });

  it('should render the container but no chips when tags is an empty array', () => {
    const { container } = render(<TagList tags={[]} />);
    expect(container.firstChild).not.toBeNull();
    expect(screen.queryByText(/.+/)).toBeNull();
  });

  it('should not render any placeholder or guide text when tags is empty', () => {
    render(<TagList tags={[]} />);
    expect(screen.queryByText(/태그/)).toBeNull();
    expect(screen.queryByText(/tag/i)).toBeNull();
    expect(screen.queryByText(/없음/)).toBeNull();
    expect(screen.queryByText(/추가/)).toBeNull();
  });
});
