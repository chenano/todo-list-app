'use client';

import React from 'react';
import { AnalyticsDashboard } from '@/components/analytics';
import { useTasks, useAllTasks } from '@/hooks/useTasks';
import { useLists } from '@/hooks/useLists';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const { tasks, loading: tasksLoading, error: tasksError } = useAllTasks();
  const { lists, loading: listsLoading, error: listsError } = useLists();

  const loading = tasksLoading || listsLoading;
  const error = tasksError || listsError;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" text="Loading analytics data..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Failed to load analytics data</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message || 'An error occurred while loading your data'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <AnalyticsDashboard 
        tasks={tasks} 
        lists={lists}
        className="w-full"
      />
    </div>
  );
}