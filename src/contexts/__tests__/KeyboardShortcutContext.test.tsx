import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { KeyboardShortcutProvider, useKeyboardShortcuts } from '../KeyboardShortcutContext';
import { KeyboardShortcut } from '@/types/keyboard';

// Test component that uses the keyboard shortcuts context
function TestComponent() {
  const {
    registerShortcut,
    unregisterShortcut,
    getShortcuts,
    currentContext,
    setContext,
    pushContext,
    popContext,
    showHelp,
    toggleHelp,
  } = useKeyboardShortcuts();

  const handleRegisterShortcut = () => {
    const shortcut: KeyboardShortcut = {
      id: 'test-shortcut',
      key: 'n',
      modifiers: ['ctrl'],
      context: 'global',
      description: 'Test shortcut',
      action: () => {
        const element = document.getElementById('test-output');
        if (element) element.textContent = 'shortcut executed';
      },
    };
    registerShortcut(shortcut);
  };

  return (
    <div>
      <div data-testid="current-context">{currentContext}</div>
      <div data-testid="show-help">{showHelp.toString()}</div>
      <div data-testid="shortcuts-count">{getShortcuts().length}</div>
      <button onClick={handleRegisterShortcut}>Register Shortcut</button>
      <button onClick={() => unregisterShortcut('test-shortcut')}>Unregister Shortcut</button>
      <button onClick={() => setContext('list')}>Set List Context</button>
      <button onClick={() => pushContext('task')}>Push Task Context</button>
      <button onClick={popContext}>Pop Context</button>
      <button onClick={toggleHelp}>Toggle Help</button>
      <div id="test-output"></div>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <KeyboardShortcutProvider>
      <TestComponent />
    </KeyboardShortcutProvider>
  );
}

describe('KeyboardShortcutContext', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should provide default context values', () => {
    renderWithProvider();
    
    expect(screen.getByTestId('current-context')).toHaveTextContent('global');
    expect(screen.getByTestId('show-help')).toHaveTextContent('false');
    expect(screen.getByTestId('shortcuts-count')).toHaveTextContent('0');
  });

  it('should register and unregister shortcuts', () => {
    renderWithProvider();
    
    // Initially no shortcuts
    expect(screen.getByTestId('shortcuts-count')).toHaveTextContent('0');
    
    // Register a shortcut
    fireEvent.click(screen.getByText('Register Shortcut'));
    expect(screen.getByTestId('shortcuts-count')).toHaveTextContent('1');
    
    // Unregister the shortcut
    fireEvent.click(screen.getByText('Unregister Shortcut'));
    expect(screen.getByTestId('shortcuts-count')).toHaveTextContent('0');
  });

  it('should manage context stack', () => {
    renderWithProvider();
    
    // Initially global context
    expect(screen.getByTestId('current-context')).toHaveTextContent('global');
    
    // Set context
    fireEvent.click(screen.getByText('Set List Context'));
    expect(screen.getByTestId('current-context')).toHaveTextContent('list');
    
    // Push context
    fireEvent.click(screen.getByText('Push Task Context'));
    expect(screen.getByTestId('current-context')).toHaveTextContent('task');
    
    // Pop context
    fireEvent.click(screen.getByText('Pop Context'));
    expect(screen.getByTestId('current-context')).toHaveTextContent('list');
    
    // Pop again (should not go below first item)
    fireEvent.click(screen.getByText('Pop Context'));
    expect(screen.getByTestId('current-context')).toHaveTextContent('list');
  });

  it('should toggle help visibility', () => {
    renderWithProvider();
    
    // Initially help is hidden
    expect(screen.getByTestId('show-help')).toHaveTextContent('false');
    
    // Toggle help
    fireEvent.click(screen.getByText('Toggle Help'));
    expect(screen.getByTestId('show-help')).toHaveTextContent('true');
    
    // Toggle again
    fireEvent.click(screen.getByText('Toggle Help'));
    expect(screen.getByTestId('show-help')).toHaveTextContent('false');
  });

  it('should execute keyboard shortcuts', () => {
    renderWithProvider();
    
    // Register a shortcut
    fireEvent.click(screen.getByText('Register Shortcut'));
    
    // Simulate Ctrl+N keypress
    act(() => {
      fireEvent.keyDown(document, {
        key: 'n',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });
    
    // Check if shortcut was executed
    expect(screen.getByText('shortcut executed')).toBeInTheDocument();
  });

  it('should handle F1 key to toggle help', () => {
    renderWithProvider();
    
    // Initially help is hidden
    expect(screen.getByTestId('show-help')).toHaveTextContent('false');
    
    // Press F1
    act(() => {
      fireEvent.keyDown(document, {
        key: 'F1',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });
    
    expect(screen.getByTestId('show-help')).toHaveTextContent('true');
  });

  it('should handle ? key to toggle help', () => {
    renderWithProvider();
    
    // Initially help is hidden
    expect(screen.getByTestId('show-help')).toHaveTextContent('false');
    
    // Press ?
    act(() => {
      fireEvent.keyDown(document, {
        key: '?',
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
      });
    });
    
    expect(screen.getByTestId('show-help')).toHaveTextContent('true');
  });

  it('should handle Escape key to close help', () => {
    renderWithProvider();
    
    // Show help first
    fireEvent.click(screen.getByText('Toggle Help'));
    expect(screen.getByTestId('show-help')).toHaveTextContent('true');
    
    // Press Escape
    act(() => {
      fireEvent.keyDown(document, {
        key: 'Escape',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });
    
    expect(screen.getByTestId('show-help')).toHaveTextContent('false');
  });

  it('should handle Escape key to pop context when help is not shown', () => {
    renderWithProvider();
    
    // Push a context
    fireEvent.click(screen.getByText('Push Task Context'));
    expect(screen.getByTestId('current-context')).toHaveTextContent('task');
    
    // Press Escape
    act(() => {
      fireEvent.keyDown(document, {
        key: 'Escape',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
      });
    });
    
    expect(screen.getByTestId('current-context')).toHaveTextContent('global');
  });

  it('should not execute shortcuts when typing in input fields', () => {
    renderWithProvider();
    
    // Register a shortcut
    fireEvent.click(screen.getByText('Register Shortcut'));
    
    // Create an input field
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    
    // Simulate Ctrl+N keypress while focused on input
    act(() => {
      fireEvent.keyDown(input, {
        key: 'n',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        target: input,
      });
    });
    
    // Shortcut should not be executed
    expect(screen.queryByText('shortcut executed')).not.toBeInTheDocument();
  });
});