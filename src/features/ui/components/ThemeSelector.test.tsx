/**
 * ThemeSelector Component Tests
 * 
 * Tests for the ThemeSelector dropdown component.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSelector } from './ThemeSelector';
import { describe, expect, it, vi, afterEach } from 'vitest';

describe('ThemeSelector', () => {
  const mockOnChange = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render with the correct theme options', () => {
    render(<ThemeSelector theme="light" onChange={mockOnChange} />);

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();

    // Check that all theme options are present
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveValue('light');
    expect(options[1]).toHaveValue('dark');
    expect(options[2]).toHaveValue('darcula');
    expect(options[3]).toHaveValue('system');
  });

  it('should display the current theme as selected', () => {
    render(<ThemeSelector theme="dark" onChange={mockOnChange} />);

    const selectElement = screen.getByRole('combobox') as HTMLSelectElement;
    expect(selectElement.value).toBe('dark');
  });

  it('should call onChange when a different theme is selected', () => {
    render(<ThemeSelector theme="light" onChange={mockOnChange} />);

    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: 'dark' } });

    expect(mockOnChange).toHaveBeenCalledWith('dark');
  });

  it('should call onChange when switching to darcula theme', () => {
    render(<ThemeSelector theme="light" onChange={mockOnChange} />);

    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: 'darcula' } });

    expect(mockOnChange).toHaveBeenCalledWith('darcula');
  });

  it('should call onChange when switching to system theme', () => {
    render(<ThemeSelector theme="dark" onChange={mockOnChange} />);

    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: 'system' } });

    expect(mockOnChange).toHaveBeenCalledWith('system');
  });

  it('should have the correct size class', () => {
    render(<ThemeSelector theme="light" onChange={mockOnChange} />);

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveClass('px-3 py-1.5 text-sm'); // sm size classes
  });

  it('should have a width of w-32', () => {
    render(<ThemeSelector theme="light" onChange={mockOnChange} />);

    const container = screen.getByRole('combobox').parentElement?.parentElement;
    expect(container).toHaveClass('w-32');
  });
});
