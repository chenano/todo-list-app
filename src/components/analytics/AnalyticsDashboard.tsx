'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, Target, Clock, Download, Filter } from 'lucide-react';
import { useAnalytics, ANALYTICS_PRESETS } from '@/hooks/useAnalytics';
import { Task, List, AnalyticsFilter } from '@/types';
import { format } from 'date-fns';
import { MetricsOverview } from './MetricsOverview';
import { ProductivityCharts } from './ProductivityCharts';
import { StreakDisplay } from './StreakDisplay';
import { TimePatterns } from './TimePatterns';
import { AnalyticsFilters } from './AnalyticsFilters';
import { AnalyticsExport } from './AnalyticsExport';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AnalyticsDashboardProps {
  tasks: Task[];
  lists: List[];
  className?: string;
}

export function AnalyticsDashboard({ tasks, lists, className }: AnalyticsDashboardProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    metrics,
    loading,
    error,
    filter,
    setFilter,
    refreshMetrics,
    exportData,
    clearData
  } = useAnalytics(tasks, lists, { autoRefresh: true, refreshInterval: 30000 });

  const handlePresetChange = (presetName: string) => {
    if (presetName in ANALYTICS_PRESETS) {
      const preset = ANALYTICS_PRESETS[presetName as keyof typeof ANALYTICS_PRESETS]();
      setFilter(preset);
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="font-medium">Failed to load analytics</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button onClick={refreshMetrics} variant="outline" size="sm" className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No analytics data available</p>
            <p className="text-sm mt-1">Complete some tasks to see your productivity insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Productivity Analytics</h1>
          <p className="text-muted-foreground">
            Insights from {format(new Date(filter.dateRange.start), 'MMM d')} to{' '}
            {format(new Date(filter.dateRange.end), 'MMM d, yyyy')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quick Presets */}
          <Select onValueChange={handlePresetChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Quick filters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7Days">Last 7 days</SelectItem>
              <SelectItem value="last30Days">Last 30 days</SelectItem>
              <SelectItem value="thisWeek">This week</SelectItem>
              <SelectItem value="thisMonth">This month</SelectItem>
              <SelectItem value="completedOnly">Completed only</SelectItem>
              <SelectItem value="highPriorityOnly">High priority</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Analytics Filters</CardTitle>
            <CardDescription>
              Customize the data range and criteria for your analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsFilters
              filter={filter}
              onFilterChange={setFilter}
              lists={lists}
            />
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <MetricsOverview metrics={metrics} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StreakDisplay streaks={metrics.streaks} />
            <ProductivityCharts 
              trends={metrics.trends} 
              type="completion-rate"
              title="Completion Rate Trend"
            />
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProductivityCharts 
              trends={metrics.trends} 
              type="daily-tasks"
              title="Daily Task Completion"
            />
            <ProductivityCharts 
              trends={metrics.trends} 
              type="weekly-average"
              title="Weekly Averages"
            />
          </div>
          <ProductivityCharts 
            trends={metrics.trends} 
            type="monthly-overview"
            title="Monthly Overview"
          />
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <TimePatterns patterns={metrics.timePatterns} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Priority Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">High Priority</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(metrics.priorityDistribution.high / metrics.totalTasks) * 100}%` 
                          }}
                        />
                      </div>
                      <Badge variant="secondary">{metrics.priorityDistribution.high}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Medium Priority</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(metrics.priorityDistribution.medium / metrics.totalTasks) * 100}%` 
                          }}
                        />
                      </div>
                      <Badge variant="secondary">{metrics.priorityDistribution.medium}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Low Priority</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(metrics.priorityDistribution.low / metrics.totalTasks) * 100}%` 
                          }}
                        />
                      </div>
                      <Badge variant="secondary">{metrics.priorityDistribution.low}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Tasks</span>
                  <span className="font-semibold">{metrics.totalTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-semibold text-green-600">{metrics.completedTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <span className="font-semibold">{metrics.completionRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Daily Average</span>
                  <span className="font-semibold">{metrics.averageTasksPerDay}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Productivity Insights
              </CardTitle>
              <CardDescription>
                AI-powered insights based on your task completion patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Insights based on metrics */}
              {metrics.completionRate > 80 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">🎉 Excellent productivity!</p>
                  <p className="text-green-700 text-sm mt-1">
                    You're completing {metrics.completionRate}% of your tasks. Keep up the great work!
                  </p>
                </div>
              )}
              
              {metrics.streaks.current > 5 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium">🔥 On a roll!</p>
                  <p className="text-blue-700 text-sm mt-1">
                    You're on a {metrics.streaks.current}-day streak. Your longest streak is {metrics.streaks.longest} days.
                  </p>
                </div>
              )}
              
              {metrics.averageTasksPerDay < 1 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-medium">💡 Room for improvement</p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Consider setting daily goals to increase your task completion rate.
                  </p>
                </div>
              )}
              
              {metrics.priorityDistribution.high > metrics.priorityDistribution.medium + metrics.priorityDistribution.low && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 font-medium">⚡ High-priority focus</p>
                  <p className="text-orange-700 text-sm mt-1">
                    Most of your tasks are high priority. Consider balancing with medium and low priority tasks.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <AnalyticsExport 
            metrics={metrics}
            onExport={handleExport}
            onClearData={clearData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}