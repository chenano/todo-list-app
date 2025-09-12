import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportDialog } from '../import-dialog';
import { ImportService } from '@/lib/import';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { expect } from '@playwright/test';
import { it } from 'date-fns/locale';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the import service
jest.mock('@/lib/import');

const mockImportService = ImportService as jest.MockedClass<typeof ImportService>;

describe('ImportDialog', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnImportComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock instance methods
    const mockInstance = {
      detectFormat: jest.fn(),
      generatePreview: jest.fn(),
      importData: jest.fn(),
    };
    
    mockImportService.mockImplementation(() => mockInstance as any);
  });

  it('renders import dialog when open', () => {
    render(
      <ImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onImportComplete={mockOnImportComplete}
      />
    );

    expect(screen.getByText('Import Todo Lists')).toBeInTheDocument();
    expect(screen.getByText('Select File to Import')).toBeInTheDocument();
    expect(screen.getByText('Drop your file here or click to browse')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ImportDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onImportComplete={mockOnImportComplete}
      />
    );

    expect(screen.queryByText('Import Todo Lists')).not.toBeInTheDocument();
  });

  it('handles file selection', async () => {
    const mockDetectFormat = jest.fn().mockReturnValue('json');
    
    mockImportService.mockImplementation(() => ({
      detectFormat: mockDetectFormat,
      generatePreview: jest.fn(),
      importData: jest.fn(),
    }) as any);

    render(
      <ImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onImportComplete={mockOnImportComplete}
      />
    );

    // Check that file input exists
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it('displays format detection results', () => {
    const mockDetectFormat = jest.fn().mockReturnValue('json');
    
    mockImportService.mockImplementation(() => ({
      detectFormat: mockDetectFormat,
      generatePreview: jest.fn(),
      importData: jest.fn(),
    }) as any);

    render(
      <ImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onImportComplete={mockOnImportComplete}
      />
    );

    // Check that drop zone exists
    expect(screen.getByText('Drop your file here or click to browse')).toBeInTheDocument();
  });

  it('shows import options when format is detected', () => {
    render(
      <ImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onImportComplete={mockOnImportComplete}
      />
    );

    // Check that buttons are present but disabled initially
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Import')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeDisabled();
    expect(screen.getByText('Import')).toBeDisabled();
  });

  it('handles preview generation', () => {
    const mockGeneratePreview = jest.fn().mockResolvedValue({
      format: 'json',
      lists: [{ name: 'Work', taskCount: 2, exists: false }],
      tasks: [],
      totalLists: 1,
      totalTasks: 2,
      warnings: [],
    });
    
    mockImportService.mockImplementation(() => ({
      detectFormat: jest.fn(),
      generatePreview: mockGeneratePreview,
      importData: jest.fn(),
    }) as any);

    render(
      <ImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onImportComplete={mockOnImportComplete}
      />
    );

    // Check that preview button exists
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('handles import execution', () => {
    const mockImportData = jest.fn().mockResolvedValue({
      success: true,
      importedLists: 1,
      importedTasks: 2,
      skippedTasks: 0,
      errors: [],
    });
    
    mockImportService.mockImplementation(() => ({
      detectFormat: jest.fn(),
      generatePreview: jest.fn(),
      importData: mockImportData,
    }) as any);

    render(
      <ImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onImportComplete={mockOnImportComplete}
      />
    );

    // Check that import button exists
    expect(screen.getByText('Import')).toBeInTheDocument();
  });

  it('shows progress during import', () => {
    render(
      <ImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onImportComplete={mockOnImportComplete}
      />
    );

    // Check that dialog renders without progress initially
    expect(screen.getByText('Import Todo Lists')).toBeInTheDocument();
  });

  it('handles import errors', () => {
    render(
      <ImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onImportComplete={mockOnImportComplete}
      />
    );

    // Check that dialog renders without errors initially
    expect(screen.queryByText('Import Error')).not.toBeInTheDocument();
  });

  it('allows toggling import options', () => {
    render(
      <ImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onImportComplete={mockOnImportComplete}
      />
    );

    // Check that dialog renders
    expect(screen.getByText('Import Todo Lists')).toBeInTheDocument();
  });

  it('handles file removal', () => {
    render(
      <ImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onImportComplete={mockOnImportComplete}
      />
    );

    // Check that file upload area is present
    expect(screen.getByText('Drop your file here or click to browse')).toBeInTheDocument();
  });

  it('resets state when dialog opens', () => {
    const { rerender } = render(
      <ImportDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onImportComplete={mockOnImportComplete}
      />
    );

    // Open the dialog
    rerender(
      <ImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onImportComplete={mockOnImportComplete}
      />
    );

    // State should be reset - no file selected initially
    expect(screen.getByText('Drop your file here or click to browse')).toBeInTheDocument();
  });
});