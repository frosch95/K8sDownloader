import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { APP } from './shared/constants';

// Mock the icon import
vi.mock('/icon.svg', () => ({ default: 'mock-icon-path' }));

describe('App Component', () => {
  it('should display the application version in the footer', () => {
    // Mock the APP.VERSION constant
    const originalVersion = APP.VERSION;
    APP.VERSION = '0.9.4';

    render(<App />);

    // Check that the version is displayed in the footer
    const footerText = screen.getByText(/MIT License/i);
    expect(footerText).toBeInTheDocument();
    expect(footerText.textContent).toContain('v0.9.4');

    // Restore original version
    APP.VERSION = originalVersion;
  });

  it('should display the correct version from APP constant', () => {
    const testVersion = '1.2.3-test';
    const originalVersion = APP.VERSION;
    APP.VERSION = testVersion;

    render(<App />);

    const footerText = screen.getByText(/MIT License/i);
    expect(footerText.textContent).toContain(`v${testVersion}`);

    // Restore original version
    APP.VERSION = originalVersion;
  });
});