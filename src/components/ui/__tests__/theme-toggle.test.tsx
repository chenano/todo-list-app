import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle, SimpleThemeToggle } from '../theme-toggle';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock matchMedia
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Test wrapper with ThemeProvider
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Mock system preference as light by default
    mockMatchMedia.mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : true,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it('should render theme toggle button', async () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /current theme/i })).toBeInTheDocument();
    });
  });

  it('should show theme options when clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /current theme/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /current theme/i }));

    await waitFor(() => {
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });
  });

  it('should change theme when option is selected', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /current theme/i })).toBeInTheDocument();
    });

    // Open dropdown
    await user.click(screen.getByRole('button', { name: /current theme/i }));

    await waitFor(() => {
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });

    // Select dark theme
    await user.click(screen.getByText('Dark'));

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('todo-app-theme', 'dark');
    });
  });

  it('should show current theme as selected', async () => {
    mockLocalStorage.getItem.mockReturnValue('dark');
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /current theme/i })).toBeInTheDocument();
    });

    // Open dropdown
    await user.click(screen.getByRole('button', { name: /current theme/i }));

    await waitFor(() => {
      const darkOption = screen.getByText('Dark').closest('[role="menuitem"]');
      expect(darkOption).toHaveClass('bg-accent');
    });
  });

  it('should show system theme indicator', async () => {
    mockLocalStorage.getItem.mockReturnValue('system');
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /current theme/i })).toBeInTheDocument();
    });

    // Open dropdown
    await user.click(screen.getByRole('button', { name: /current theme/i }));

    await waitFor(() => {
      expect(screen.getByText('(light)')).toBeInTheDocument();
    });
  });
});

describe('SimpleThemeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    mockMatchMedia.mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)' ? false : true,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it('should render simple toggle button', async () => {
    render(
      <TestWrapper>
        <SimpleThemeToggle />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /switch to dark theme/i })).toBeInTheDocument();
    });
  });

  it('should toggle between light and dark themes', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <SimpleThemeToggle />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /switch to dark theme/i })).toBeInTheDocument();
    });

    // Click to switch to dark
    await user.click(screen.getByRole('button', { name: /switch to dark theme/i }));

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('todo-app-theme', 'dark');
    });
  });

  it('should show correct icon for current theme', async () => {
    mockLocalStorage.getItem.mockReturnValue('dark');

    render(
      <TestWrapper>
        <SimpleThemeToggle />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /switch to light theme/i })).toBeInTheDocument();
    });
  });
});