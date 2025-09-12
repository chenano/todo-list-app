import React from 'react';
import { render, screen } from '@testing-library/react';
import { MetricsOverview } from '../MetricsOverview';
import { ProductivityMetrics } from '@/types';

const mockMetrics: ProductivityMetrics = {
  completionRate: 75.5,
  averageTasksPerDay: 2.3,
  totalTasks: 20,
  completedTasks: 15,
  priorityDistribution: {
    high: 5,
    medium: 10,
    low: 5,
  },
  timePatterns: [],
  streaks: {
    current: 7,
    longest: 14,
    lastActivity: '2024-01-15',
    streakDates: ['2024-01-09', '2024-01-10', '2024-01-11', '2024-01-12', '2024-01-13', '2024-01-14', '2024-01-15'],
  },
  trends: {
    daily: [],
    weekly: [],
    monthly: [],
  },
};

describe('MetricsOverview', () => {
  it('renders all metric cards', () => {
    render(<MetricsOverview metrics={mockMetrics} />);

    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Current Streak')).toBeInTheDocument();
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
  });

  it('displays correct metric values', () => {
    render(<MetricsOverview metrics={mockMetrics} />);

    // Use more specific queries to avoid multiple matches
    expect(screen.getByRole('heading', { name: /total tasks/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /completed/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /current streak/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /success rate/i })).toBeInTheDocument();
    
    // Check for specific values in context
    expect(screen.getByText('20')).toBeInTheDocument(); // Total tasks
    expect(screen.getByText('15')).toBeInTheDocument(); // Completed tasks
    expect(screen.getByText('7')).toBeInTheDocument(); // Current streak
    expect(screen.getAllByText('75.5%')).toHaveLength(2); // Success rate appears twice
  });

  it('displays priority distribution', () => {
    render(<MetricsOverview metrics={mockMetrics} />);

    expect(screen.getByText('Priority Distribution')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('Medium Priority')).toBeInTheDocument();
    expect(screen.getByText('Low Priority')).toBeInTheDocument();
  });

  it('shows correct completion rate badge for excellent performance', () => {
    const excellentMetrics = {
      ...mockMetrics,
      completionRate: 85,
    };

    render(<MetricsOverview metrics={excellentMetrics} />);

    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('shows correct completion rate badge for good performance', () => {
    const goodMetrics = {
      ...mockMetrics,
      completionRate: 70,
    };

    render(<MetricsOverview metrics={goodMetrics} />);

    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('shows correct completion rate badge for poor performance', () => {
    const poorMetrics = {
      ...mockMetrics,
      completionRate: 45,
    };

    render(<MetricsOverview metrics={poorMetrics} />);

    expect(screen.getByText('Needs Work')).toBeInTheDocument();
  });

  it('displays activity summary', () => {
    render(<MetricsOverview metrics={mockMetrics} />);

    expect(screen.getByText('Activity Summary')).toBeInTheDocument();
    expect(screen.getByText('Last activity:')).toBeInTheDocument();
    expect(screen.getByText('Daily average:')).toBeInTheDocument();
    expect(screen.getByText('Best streak:')).toBeInTheDocument();
    expect(screen.getByText('Current streak:')).toBeInTheDocument();
  });

  it('handles zero tasks correctly', () => {
    const emptyMetrics: ProductivityMetrics = {
      completionRate: 0,
      averageTasksPerDay: 0,
      totalTasks: 0,
      completedTasks: 0,
      priorityDistribution: {
        high: 0,
        medium: 0,
        low: 0,
      },
      timePatterns: [],
      streaks: {
        current: 0,
        longest: 0,
        lastActivity: null,
        streakDates: [],
      },
      trends: {
        daily: [],
        weekly: [],
        monthly: [],
      },
    };

    render(<MetricsOverview metrics={emptyMetrics} />);

    // Check for multiple zeros (there will be many)
    expect(screen.getAllByText('0')).toHaveLength(6); // Multiple zero values
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('displays priority distribution bars with correct proportions', () => {
    render(<MetricsOverview metrics={mockMetrics} />);

    // Check that priority numbers are displayed
    const priorityElements = screen.getAllByText('5'); // High and Low priority both have 5
    expect(priorityElements).toHaveLength(2);
    expect(screen.getByText('10')).toBeInTheDocument(); // Medium priority
  });

  it('shows current streak badge when streak is active', () => {
    render(<MetricsOverview metrics={mockMetrics} />);

    expect(screen.getByText('7 days 🔥')).toBeInTheDocument();
  });

  it('does not show current streak badge when no active streak', () => {
    const noStreakMetrics = {
      ...mockMetrics,
      streaks: {
        ...mockMetrics.streaks,
        current: 0,
      },
    };

    render(<MetricsOverview metrics={noStreakMetrics} />);

    expect(screen.queryByText(/days 🔥/)).not.toBeInTheDocument();
  });
});