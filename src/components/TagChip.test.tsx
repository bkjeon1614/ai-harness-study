import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TagChip } from './TagChip';

describe('TagChip', () => {
  it('should render the label text inside the chip when label is a normal non-empty string', () => {
    render(<TagChip label="react" />);
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  it('should render multi-word label preserving internal whitespace when label contains a space', () => {
    render(<TagChip label="front end" />);
    expect(screen.getByText('front end')).toBeInTheDocument();
  });
});
