import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('should render with new unified placeholder text (e.g., "키워드로 검색...") when value is empty', () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('키워드로 검색...')).toBeInTheDocument();
  });
});
