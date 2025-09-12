'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  TrendingUp, 
  Calendar,
  Target,
  Clock
} from 'lucide-react';
import { ProductivityMetrics } from '@/types';

interface MetricsOverviewProps {
  metrics: ProductivityMetrics;
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  const completionPercentage = metrics.totalTasks > 0 
    ? (metrics.completedTasks / metrics.totalTasks) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <Circle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalTasks}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.averageTasksPerDay.toFixed(1)} per day average
          </p>
        </CardContent>
      </Card>

      {/* Completed Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{metrics.completedTasks}</div>
          <div className="flex items-center space-x-2 mt-1">
            <Progress value={completionPercentage} className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {metrics.completionRate}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Current Streak */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{metrics.streaks.current}</div>
          <p className="text-xs text-muted-foreground">
            Best: {metrics.streaks.longest} days
          </p>
        </CardContent>
      </Card>

      {/* Completion Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <Target className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{metrics.completionRate}%</div>
          <div className="flex items-center gap-1 mt-1">
            {metrics.completionRate >= 80 && (
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                Excellent
              </Badge>
            )}
            {metrics.completionRate >= 60 && metrics.completionRate < 80 && (
              <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-800">
                Good
              </Badge>
            )}
            {metrics.completionRate < 60 && (
              <Badge variant="default" className="text-xs bg-red-100 text-red-800">
                Needs Work
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Priority Breakdown */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Priority Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-muted rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all" 
                    style={{ 
                      width: `${metrics.totalTasks > 0 ? (metrics.priorityDistribution.high / metrics.totalTasks) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">
                  {metrics.priorityDistribution.high}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Medium Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-muted rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all" 
                    style={{ 
                      width: `${metrics.totalTasks > 0 ? (metrics.priorityDistribution.medium / metrics.totalTasks) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">
                  {metrics.priorityDistribution.medium}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Low Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all" 
                    style={{ 
                      width: `${metrics.totalTasks > 0 ? (metrics.priorityDistribution.low / metrics.totalTasks) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">
                  {metrics.priorityDistribution.low}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last activity:</span>
              <span className="font-medium">
                {metrics.streaks.lastActivity 
                  ? new Date(metrics.streaks.lastActivity).toLocaleDateString()
                  : 'No recent activity'
                }
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Daily average:</span>
              <span className="font-medium">{metrics.averageTasksPerDay} tasks</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Best streak:</span>
              <span className="font-medium">{metrics.streaks.longest} days</span>
            </div>
            {metrics.streaks.current > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current streak:</span>
                <Badge variant="outline" className="text-xs">
                  {metrics.streaks.current} days 🔥
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}