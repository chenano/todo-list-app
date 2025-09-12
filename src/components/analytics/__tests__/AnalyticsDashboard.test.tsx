import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyticsDashboard } from '../AnalyticsDashboard';
import { Task, List } from '@/types';

// Mock the analytics hook
jest.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: jest.fn(() => ({
    metrics: {
      completionRate: 75,
      averageTasksPerDay: 2.5,
      totalTasks: 10,
      completedTasks: 7,
      priorityDistribution: { high: 3, medium: 4, low: 3 },
      timePatterns: [],
      streaks: { current: 5, longest: 10, lastActivity: '2024-01-01', streakDates: [] },
      trends: { daily: [], weekly: [], monthly: [] },
    },
    loading: false,
    error: null,
    filter: {
      dateRange: { start: '2024-01-01', end: '2024-01-31' },
      includeCompleted: true,
      includeIncomplete: true,
    },
    setFilter: jest.fn(),
    refreshMetrics: jest.fn(),
    exportData: jest.fn(() => 'exported-data'),
    clearData: jest.fn(),
  })),
  ANALYTICS_PRESETS: {
    last7Days: () => ({
      dateRange: { start: '2024-01-24', end: '2024-01-31' },
      includeCompleted: true,
      includeIncomplete: true,
    }),
  },
}));

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="chart-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const mockTasks: Task[] = [
  {
    id: '1',
    list_id: 'list-1',
    user_id: 'user-1',
    title: 'Task 1',
    description: 'Description 1',
    completed: true,
    priority: 'high',
    due_date: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    list_id: 'list-1',
    user_id: 'user-1',
    title: 'Task 2',
    description: 'Description 2',
    completed: false,
    priority: 'medium',
    due_date: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

const mockLists: List[] = [
  {
    id: 'list-1',
    user_id: 'user-1',
    name: 'Test List',
    description: 'Test Description',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders analytics dashboard with metrics', () => {
    render(<AnalyticsDashboard tasks={mockTasks} lists={mockLists} />);

    expect(screen.getByText('Productivity Analytics')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();
    expect(screen.getByText('Patterns')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { useAnalytics } = require('@/hooks/useAnalytics');
    useAnalytics.mockReturnValue({
      metrics: null,
      loading: true,
      error: null,
      filter: { dateRange: { start: '2024-01-01', end: '2024-01-31' } },
      setFilter: jest.fn(),
      refreshMetrics: jest.fn(),
      exportData: jest.fn(),
      clearData: jest.fn(),
    });

    render(<AnalyticsDashboard tasks={mockTasks} lists={mockLists} />);

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const { useAnalytics } = require('@/hooks/useAnalytics');
    useAnalytics.mockReturnValue({
      metrics: null,
      loading: false,
      error: 'Failed to load data',
      filter: { dateRange: { start: '2024-01-01', end: '2024-01-31' } },
      setFilter: jest.fn(),
      refreshMetrics: jest.fn(),
      exportData: jest.fn(),
      clearData: jest.fn(),
    });

    render(<AnalyticsDashboard tasks={mockTasks} lists={mockLists} />);

    expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('shows empty state when no metrics available', () => {
    const { useAnalytics } = require('@/hooks/useAnalytics');
    useAnalytics.mockReturnValue({
      metrics: null,
      loading: false,
      error: null,
      filter: { dateRange: { start: '2024-01-01', end: '2024-01-31' } },
      setFilter: jest.fn(),
      refreshMetrics: jest.fn(),
      exportData: jest.fn(),
      clearData: jest.fn(),
    });

    render(<AnalyticsDashboard tasks={mockTasks} lists={mockLists} />);

    expect(screen.getByText('No analytics data available')).toBeInTheDocument();
    expect(screen.getByText('Complete some tasks to see your productivity insights')).toBeInTheDocument();
  });

  it('handles preset filter changes', async () => {
    const mockSetFilter = jest.fn();
    const { useAnalytics } = require('@/hooks/useAnalytics');
    useAnalytics.mockReturnValue({
      metrics: {
        completionRate: 75,
        averageTasksPerDay: 2.5,
        totalTasks: 10,
        completedTasks: 7,
        priorityDistribution: { high: 3, medium: 4, low: 3 },
        timePatterns: [],
        streaks: { current: 5, longest: 10, lastActivity: '2024-01-01', streakDates: [] },
        trends: { daily: [], weekly: [], monthly: [] },
      },
      loading: false,
      error: null,
      filter: { dateRange: { start: '2024-01-01', end: '2024-01-31' } },
      setFilter: mockSetFilter,
      refreshMetrics: jest.fn(),
      exportData: jest.fn(),
      clearData: jest.fn(),
    });

    render(<AnalyticsDashboard tasks={mockTasks} lists={mockLists} />);

    // Find and click the preset selector
    const presetSelect = screen.getByRole('combobox');
    fireEvent.click(presetSelect);

    // Wait for options to appear and select one
    await waitFor(() => {
      const option = screen.getByText('Last 7 days');
      fireEvent.click(option);
    });

    expect(mockSetFilter).toHaveBeenCalled();
  });

  it('handles export functionality', () => {
    const mockExportData = jest.fn(() => 'exported-data');
    const { useAnalytics } = require('@/hooks/useAnalytics');
    useAnalytics.mockReturnValue({
      metrics: {
        completionRate: 75,
        averageTasksPerDay: 2.5,
        totalTasks: 10,
        completedTasks: 7,
        priorityDistribution: { high: 3, medium: 4, low: 3 },
        timePatterns: [],
        streaks: { current: 5, longest: 10, lastActivity: '2024-01-01', streakDates: [] },
        trends: { daily: [], weekly: [], monthly: [] },
      },
      loading: false,
      error: null,
      filter: { dateRange: { start: '2024-01-01', end: '2024-01-31' } },
      setFilter: jest.fn(),
      refreshMetrics: jest.fn(),
      exportData: mockExportData,
      clearData: jest.fn(),
    });

    // Mock URL.createObjectURL and related functions
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock document.createElement and appendChild
    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);

    render(<AnalyticsDashboard tasks={mockTasks} lists={mockLists} />);

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    expect(mockExportData).toHaveBeenCalled();
  });

  it('toggles filters panel', () => {
    render(<AnalyticsDashboard tasks={mockTasks} lists={mockLists} />);

    const filtersButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filtersButton);

    expect(screen.getByText('Analytics Filters')).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    render(<AnalyticsDashboard tasks={mockTasks} lists={mockLists} />);

    // Click on Trends tab
    const trendsTab = screen.getByRole('tab', { name: 'Trends' });
    fireEvent.click(trendsTab);

    // Should show trends content
    expect(screen.getByText('Daily Task Completion')).toBeInTheDocument();

    // Click on Patterns tab
    const patternsTab = screen.getByRole('tab', { name: 'Patterns' });
    fireEvent.click(patternsTab);

    // Should show patterns content
    expect(screen.getByText('Priority Distribution')).toBeInTheDocument();
  });

  it('displays productivity insights', () => {
    render(<AnalyticsDashboard tasks={mockTasks} lists={mockLists} />);

    // Click on Insights tab
    const insightsTab = screen.getByRole('tab', { name: 'Insights' });
    fireEvent.click(insightsTab);

    expect(screen.getByText('Productivity Insights')).toBeInTheDocument();
    expect(screen.getByText('Data Management')).toBeInTheDocument();
  });
});