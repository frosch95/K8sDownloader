/**
 * CustomSelect Component Tests
 * 
 * Tests for the CustomSelect dropdown component.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { CustomSelect } from './CustomSelect';
import { describe, expect, it, vi, afterEach } from 'vitest';

type TestOption = 'option1' | 'option2' | 'option3';

describe('CustomSelect', () => {
  const mockOptions: { value: TestOption; label: string; disabled?: boolean }[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];
  
  const mockOptionsWithDisabled: { value: TestOption; label: string; disabled?: boolean }[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2', disabled: true },
    { value: 'option3', label: 'Option 3' },
  ];
  const mockOnChange = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render with the selected value', () => {
    render(<CustomSelect value="option2" options={mockOptions} onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Option 2');
  });

  it('should show dropdown when clicked', () => {
    render(<CustomSelect value="option1" options={mockOptions} onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const dropdown = screen.getByRole('listbox');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toBeVisible();
  });

  it('should call onChange when an option is selected', () => {
    render(<CustomSelect value="option1" options={mockOptions} onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const option = screen.getByText('Option 2');
    fireEvent.click(option);

    expect(mockOnChange).toHaveBeenCalledWith('option2');
  });

  it('should close dropdown when clicking outside', () => {
    render(<CustomSelect value="option1" options={mockOptions} onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Simulate click outside
    fireEvent.mouseDown(document);

    // Dropdown should be closed (no longer in document)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should have the correct size classes', () => {
    render(<CustomSelect value="option1" options={mockOptions} onChange={mockOnChange} size="sm" />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-3 py-1.5 text-sm');
  });

  it('should highlight the selected option in the dropdown', () => {
    render(<CustomSelect value="option2" options={mockOptions} onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const selectedOption = screen.getByRole('option', { name: 'Option 2' });
    const otherOption = screen.getByRole('option', { name: 'Option 1' });

    expect(selectedOption).toHaveClass('bg-gradient-accent/10');
    expect(otherOption).not.toHaveClass('bg-gradient-accent/10');
  });

  it('should have proper aria attributes', () => {
    render(<CustomSelect value="option1" options={mockOptions} onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('should update when value prop changes', () => {
    const { rerender } = render(<CustomSelect value="option1" options={mockOptions} onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Option 1');

    rerender(<CustomSelect value="option2" options={mockOptions} onChange={mockOnChange} />);
    expect(button).toHaveTextContent('Option 2');
  });

  it('should not allow selection of disabled options', () => {
    render(<CustomSelect value="option1" options={mockOptionsWithDisabled} onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const disabledOption = screen.getByRole('option', { name: 'Option 2' });
    expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
    expect(disabledOption).toHaveClass('opacity-50 cursor-not-allowed');

    fireEvent.click(disabledOption);
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should show disabled state when component is disabled', () => {
    render(<CustomSelect value="option1" options={mockOptions} onChange={mockOnChange} disabled={true} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('opacity-40 cursor-not-allowed');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
