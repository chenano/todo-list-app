'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Upload, 
  Trash2, 
  FileText, 
  Database,
  AlertTriangle
} from 'lucide-react';
import { ProductivityMetrics } from '@/types';
import { format } from 'date-fns';

interface AnalyticsExportProps {
  metrics: ProductivityMetrics;
  onExport: () => void;
  onClearData: () => void;
  className?: string;
}

export function AnalyticsExport({ 
  metrics, 
  onExport, 
  onClearData, 
  className 
}: AnalyticsExportProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      onClearData();
      setShowClearConfirm(false);
    } finally {
      setIsClearing(false);
    }
  };

  const exportAsCSV = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Tasks', metrics.totalTasks.toString()],
      ['Completed Tasks', metrics.completedTasks.toString()],
      ['Completion Rate', `${metrics.completionRate}%`],
      ['Average Tasks Per Day', metrics.averageTasksPerDay.toString()],
      ['Current Streak', metrics.streaks.current.toString()],
      ['Longest Streak', metrics.streaks.longest.toString()],
      ['High Priority Tasks', metrics.priorityDistribution.high.toString()],
      ['Medium Priority Tasks', metrics.priorityDistribution.medium.toString()],
      ['Low Priority Tasks', metrics.priorityDistribution.low.toString()],
      ['Last Activity', metrics.streaks.lastActivity || 'N/A'],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-metrics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = () => {
    const jsonData = {
      exportDate: new Date().toISOString(),
      metrics,
      summary: {
        totalTasks: metrics.totalTasks,
        completedTasks: metrics.completedTasks,
        completionRate: metrics.completionRate,
        averageTasksPerDay: metrics.averageTasksPerDay,
        currentStreak: metrics.streaks.current,
        longestStreak: metrics.streaks.longest
      }
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Options */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Export Analytics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={exportAsJSON} 
                variant="outline" 
                className="justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </Button>
              <Button 
                onClick={exportAsCSV} 
                variant="outline" 
                className="justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Download your productivity data for backup or analysis in external tools.
            </p>
          </div>

          {/* Raw Data Export */}
          <div>
            <h4 className="font-medium mb-3">Raw Data Export</h4>
            <Button 
              onClick={onExport} 
              variant="outline" 
              className="justify-start"
            >
              <Database className="h-4 w-4 mr-2" />
              Export Raw Analytics Data
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Export complete analytics database including all events and timestamps.
            </p>
          </div>
        </div>

        {/* Data Summary */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-medium">Current Data Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Tasks:</span>
                <Badge variant="secondary">{metrics.totalTasks}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed:</span>
                <Badge variant="secondary">{metrics.completedTasks}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Success Rate:</span>
                <Badge variant="secondary">{metrics.completionRate}%</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Streak:</span>
                <Badge variant="secondary">{metrics.streaks.current}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best Streak:</span>
                <Badge variant="secondary">{metrics.streaks.longest}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Average:</span>
                <Badge variant="secondary">{metrics.averageTasksPerDay}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="space-y-4 pt-4 border-t">
          <div>
            <h4 className="font-medium text-red-600 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </h4>
            
            {!showClearConfirm ? (
              <div className="space-y-3">
                <Button 
                  onClick={() => setShowClearConfirm(true)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Analytics Data
                </Button>
                <p className="text-sm text-muted-foreground">
                  Permanently delete all analytics data and start fresh. This action cannot be undone.
                </p>
              </div>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="space-y-3">
                    <p className="font-medium">
                      Are you sure you want to delete all analytics data?
                    </p>
                    <p className="text-sm">
                      This will permanently remove:
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      <li>All task completion history</li>
                      <li>Productivity streaks and patterns</li>
                      <li>Time-based activity data</li>
                      <li>All analytics events and metrics</li>
                    </ul>
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={handleClearData}
                        variant="destructive"
                        size="sm"
                        disabled={isClearing}
                      >
                        {isClearing ? 'Clearing...' : 'Yes, Delete All Data'}
                      </Button>
                      <Button 
                        onClick={() => setShowClearConfirm(false)}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
          <p className="font-medium mb-1">🔒 Privacy Notice</p>
          <p>
            All analytics data is stored locally in your browser. No data is sent to external servers. 
            Your productivity insights remain completely private.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}