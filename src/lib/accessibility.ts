// Accessibility utilities and improvements

export interface AccessibilityOptions {
  announceChanges?: boolean;
  focusManagement?: boolean;
  keyboardNavigation?: boolean;
}

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private announcer: HTMLElement | null = null;

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  // Initialize accessibility features
  initialize(options: AccessibilityOptions = {}): void {
    if (typeof document === 'undefined') return;

    const {
      announceChanges = true,
      focusManagement = true,
      keyboardNavigation = true,
    } = options;

    if (announceChanges) {
      this.createScreenReaderAnnouncer();
    }

    if (focusManagement) {
      this.setupFocusManagement();
    }

    if (keyboardNavigation) {
      this.setupKeyboardNavigation();
    }
  }

  // Create screen reader announcer
  private createScreenReaderAnnouncer(): void {
    if (this.announcer) return;

    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(this.announcer);
  }

  // Announce message to screen readers
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcer) return;

    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = '';
      }
    }, 1000);
  }

  // Setup focus management
  private setupFocusManagement(): void {
    // Focus trap for modals
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (modal) {
          this.trapFocus(event, modal as HTMLElement);
        }
      }
    });

    // Return focus to trigger element when modal closes
    this.setupModalFocusReturn();
  }

  // Trap focus within an element
  private trapFocus(event: KeyboardEvent, container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }

  // Setup modal focus return
  private setupModalFocusReturn(): void {
    let lastFocusedElement: HTMLElement | null = null;

    // Store focus when modal opens
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            if (element.getAttribute('role') === 'dialog') {
              lastFocusedElement = document.activeElement as HTMLElement;
              // Focus first focusable element in modal
              const firstFocusable = element.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
              ) as HTMLElement;
              if (firstFocusable) {
                setTimeout(() => firstFocusable.focus(), 100);
              }
            }
          }
        });

        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            if (element.getAttribute('role') === 'dialog' && lastFocusedElement) {
              setTimeout(() => lastFocusedElement?.focus(), 100);
              lastFocusedElement = null;
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Setup keyboard navigation
  private setupKeyboardNavigation(): void {
    // Arrow key navigation for lists
    document.addEventListener('keydown', (event) => {
      const target = event.target as HTMLElement;
      
      if (target.getAttribute('role') === 'listbox' || target.closest('[role="listbox"]')) {
        this.handleListNavigation(event);
      }
    });

    // Escape key handling
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (modal) {
          const closeButton = modal.querySelector('[data-close-modal]') as HTMLElement;
          if (closeButton) {
            closeButton.click();
          }
        }
      }
    });
  }

  // Handle list navigation with arrow keys
  private handleListNavigation(event: KeyboardEvent): void {
    const { key } = event;
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;

    event.preventDefault();
    
    const listbox = (event.target as HTMLElement).closest('[role="listbox"]') as HTMLElement;
    const options = Array.from(listbox.querySelectorAll('[role="option"]')) as HTMLElement[];
    const currentIndex = options.findIndex(option => option === document.activeElement);

    let nextIndex = currentIndex;

    switch (key) {
      case 'ArrowUp':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        break;
      case 'ArrowDown':
        nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = options.length - 1;
        break;
    }

    if (options[nextIndex]) {
      options[nextIndex].focus();
    }
  }

  // Add ARIA labels to elements
  addAriaLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label);
  }

  // Add ARIA descriptions
  addAriaDescription(element: HTMLElement, description: string): void {
    const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
    const descElement = document.createElement('div');
    descElement.id = descId;
    descElement.className = 'sr-only';
    descElement.textContent = description;
    
    document.body.appendChild(descElement);
    element.setAttribute('aria-describedby', descId);
  }

  // Check color contrast
  checkColorContrast(foreground: string, background: string): number {
    // Simple contrast ratio calculation
    const getLuminance = (color: string): number => {
      const rgb = parseInt(color.replace('#', ''), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Validate accessibility
  validateAccessibility(): string[] {
    const issues: string[] = [];

    // Check for missing alt text on images
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      issues.push(`${images.length} images missing alt text`);
    }

    // Check for missing form labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    const unlabeledInputs = Array.from(inputs).filter(input => {
      const id = input.getAttribute('id');
      return !id || !document.querySelector(`label[for="${id}"]`);
    });
    if (unlabeledInputs.length > 0) {
      issues.push(`${unlabeledInputs.length} form inputs missing labels`);
    }

    // Check for missing headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
      issues.push('No heading elements found');
    }

    // Check for missing focus indicators
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    // This would need CSS checking which is complex, so we'll skip for now

    return issues;
  }
}

// Accessibility utilities
export const a11yUtils = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix = 'a11y'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Check if element is visible to screen readers
  isVisibleToScreenReader: (element: HTMLElement): boolean => {
    const style = window.getComputedStyle(element);
    return !(
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      element.getAttribute('aria-hidden') === 'true' ||
      element.hasAttribute('hidden')
    );
  },

  // Get accessible name for element
  getAccessibleName: (element: HTMLElement): string => {
    // Check aria-label first
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // Check aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) return labelElement.textContent || '';
    }

    // Check associated label
    const id = element.getAttribute('id');
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent || '';
    }

    // Fallback to text content
    return element.textContent || '';
  },
};

// Export singleton instance
export const accessibilityManager = AccessibilityManager.getInstance();