'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  Database, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { performanceMonitor, PerformanceMetric } from '@/lib/performance';
import { performanceTestRunner, PerformanceTestSuite } from '@/lib/performance-testing';
import { cn } from '@/lib/utils';

interface PerformanceMonitorProps {
  className?: string;
  showTests?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function PerformanceMonitor({
  className,
  showTests = true,
  autoRefresh = false,
  refreshInterval = 5000,
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [testSuite, setTestSuite] = useState<PerformanceTestSuite | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Refresh metrics
  const refreshMetrics = () => {
    const allMetrics = performanceMonitor.getMetrics();
    setMetrics(allMetrics);
    setLastRefresh(new Date());
  };

  // Run performance tests
  const runTests = async () => {
    setIsRunningTests(true);
    try {
      const suite = await performanceTestRunner.runTestSuite();
      setTestSuite(suite);
    } catch (error) {
      console.error('Failed to run performance tests:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    refreshMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(refreshMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Get performance summary
  const summary = performanceMonitor.getSummary();
  
  // Calculate health score
  const calculateHealthScore = (): number => {
    if (Object.keys(summary).length === 0) return 100;
    
    let score = 100;
    const thresholds = {
      'task-list-render': 100,
      'task-item-render': 16,
      'database-query': 500,
    };
    
    Object.entries(summary).forEach(([name, stats]) => {
      const threshold = thresholds[name as keyof typeof thresholds];
      if (threshold && stats.avg > threshold) {
        const penalty = Math.min(30, (stats.avg / threshold - 1) * 20);
        score -= penalty;
      }
    });
    
    return Math.max(0, Math.round(score));
  };

  const healthScore = calculateHealthScore();
  
  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 90) return CheckCircle;
    if (score >= 70) return AlertTriangle;
    return AlertTriangle;
  };

  const HealthIcon = getHealthIcon(healthScore);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Performance Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance Overview</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <HealthIcon className={cn('h-5 w-5', getHealthColor(healthScore))} />
              <span className={cn('text-2xl font-bold', getHealthColor(healthScore))}>
                {healthScore}%
              </span>
            </div>
            <div className="flex-1">
              <Progress value={healthScore} className="h-2" />
            </div>
            <Badge variant={healthScore >= 90 ? 'default' : healthScore >= 70 ? 'secondary' : 'destructive'}>
              {healthScore >= 90 ? 'Excellent' : healthScore >= 70 ? 'Good' : 'Needs Attention'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Render Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Render Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary['task-list-render']?.avg.toFixed(1) || '0'}ms
            </div>
            <p className="text-xs text-muted-foreground">
              {summary['task-list-render']?.count || 0} measurements
            </p>
          </CardContent>
        </Card>

        {/* Database Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Query Time</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary['database-query']?.avg.toFixed(1) || '0'}ms
            </div>
            <p className="text-xs text-muted-foreground">
              {summary['database-query']?.count || 0} queries
            </p>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary['memory-usage']?.avg 
                ? `${(summary['memory-usage'].avg / 1024 / 1024).toFixed(1)}MB`
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              JavaScript heap
            </p>
          </CardContent>
        </Card>

        {/* Total Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Metrics</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.length}</div>
            <p className="text-xs text-muted-foreground">
              Performance measurements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tests */}
      {showTests && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Tests</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={runTests}
              disabled={isRunningTests}
            >
              {isRunningTests ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                'Run Tests'
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {testSuite ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{testSuite.name}</span>
                  <Badge variant={testSuite.overallPassed ? 'default' : 'destructive'}>
                    {testSuite.overallPassed ? 'PASSED' : 'FAILED'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {testSuite.results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="flex items-center space-x-2">
                        {result.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <span>{result.testName}</span>
                      </span>
                      <span className={result.passed ? 'text-green-600' : 'text-red-600'}>
                        {result.actualValue.toFixed(1)}ms
                      </span>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Test suite completed in {testSuite.duration.toFixed(1)}ms
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No test results available. Click "Run Tests" to start performance testing.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {metrics.slice(-10).reverse().map((metric, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {metric.name}
                  </Badge>
                  <span className="text-muted-foreground">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </span>
                </span>
                <span className="font-mono">
                  {metric.value.toFixed(2)}ms
                </span>
              </div>
            ))}
            {metrics.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No metrics recorded yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}