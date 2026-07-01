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

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    // Open dropdown to check options
    fireEvent.click(button);

    // Check that all theme options are present
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent('Light');
    expect(options[1]).toHaveTextContent('Dark');
    expect(options[2]).toHaveTextContent('Darcula');
    expect(options[3]).toHaveTextContent('System');
  });

  it('should display the current theme as selected', () => {
    render(<ThemeSelector theme="dark" onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Dark');
  });

  it('should call onChange when a different theme is selected', () => {
    render(<ThemeSelector theme="light" onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const darkOption = screen.getByText('Dark');
    fireEvent.click(darkOption);

    expect(mockOnChange).toHaveBeenCalledWith('dark');
  });

  it('should call onChange when switching to darcula theme', () => {
    render(<ThemeSelector theme="light" onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const darculaOption = screen.getByText('Darcula');
    fireEvent.click(darculaOption);

    expect(mockOnChange).toHaveBeenCalledWith('darcula');
  });

  it('should call onChange when switching to system theme', () => {
    render(<ThemeSelector theme="dark" onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const systemOption = screen.getByText('System');
    fireEvent.click(systemOption);

    expect(mockOnChange).toHaveBeenCalledWith('system');
  });

  it('should have the correct size class', () => {
    render(<ThemeSelector theme="light" onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-3 py-1.5 text-sm'); // sm size classes
  });

  it('should have a width of w-32', () => {
    render(<ThemeSelector theme="light" onChange={mockOnChange} />);

    const container = screen.getByRole('button').parentElement?.parentElement;
    expect(container).toHaveClass('w-32');
  });
});
