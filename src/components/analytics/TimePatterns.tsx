'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar } from 'lucide-react';
import { TimePattern } from '@/types';

interface TimePatternsProps {
  patterns: TimePattern[];
  className?: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => i);

export function TimePatterns({ patterns, className }: TimePatternsProps) {
  // Aggregate patterns by hour and day of week
  const hourlyActivity = HOURS_OF_DAY.map(hour => {
    const hourPatterns = patterns.filter(p => p.hour === hour);
    const totalCompletions = hourPatterns.reduce((sum, p) => sum + p.completionCount, 0);
    const totalCreations = hourPatterns.reduce((sum, p) => sum + p.creationCount, 0);
    
    return {
      hour,
      completions: totalCompletions,
      creations: totalCreations,
      total: totalCompletions + totalCreations
    };
  });

  const dailyActivity = DAYS_OF_WEEK.map((day, index) => {
    const dayPatterns = patterns.filter(p => p.dayOfWeek === index);
    const totalCompletions = dayPatterns.reduce((sum, p) => sum + p.completionCount, 0);
    const totalCreations = dayPatterns.reduce((sum, p) => sum + p.creationCount, 0);
    
    return {
      day,
      dayIndex: index,
      completions: totalCompletions,
      creations: totalCreations,
      total: totalCompletions + totalCreations
    };
  });

  // Find peak hours and days
  const peakHour = hourlyActivity.reduce((max, current) => 
    current.total > max.total ? current : max, hourlyActivity[0]
  );

  const peakDay = dailyActivity.reduce((max, current) => 
    current.total > max.total ? current : max, dailyActivity[0]
  );

  const maxHourlyActivity = Math.max(...hourlyActivity.map(h => h.total));
  const maxDailyActivity = Math.max(...dailyActivity.map(d => d.total));

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const getActivityLevel = (value: number, max: number) => {
    if (max === 0) return 'bg-muted';
    const intensity = value / max;
    if (intensity === 0) return 'bg-muted';
    if (intensity <= 0.25) return 'bg-blue-100';
    if (intensity <= 0.5) return 'bg-blue-200';
    if (intensity <= 0.75) return 'bg-blue-400';
    return 'bg-blue-600';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Peak Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Peak Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatHour(peakHour.hour)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Most productive time with {peakHour.total} activities
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {peakHour.completions} completed
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {peakHour.creations} created
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Peak Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {peakDay.day}
                </div>
                <p className="text-sm text-muted-foreground">
                  Most productive day with {peakDay.total} activities
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {peakDay.completions} completed
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {peakDay.creations} created
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly Activity Pattern</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your task activity throughout the day
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-1">
              {hourlyActivity.map((hour) => (
                <div key={hour.hour} className="text-center">
                  <div
                    className={`
                      h-8 rounded-sm flex items-center justify-center text-xs font-medium
                      ${getActivityLevel(hour.total, maxHourlyActivity)}
                      ${hour.total > 0 ? 'text-white' : 'text-muted-foreground'}
                    `}
                    title={`${formatHour(hour.hour)}: ${hour.total} activities`}
                  >
                    {hour.hour}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {hour.total}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>11 PM</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Activity Pattern</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your task activity by day of the week
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {dailyActivity.map((day) => (
                <div key={day.dayIndex} className="text-center">
                  <div className="text-sm font-medium mb-2">{day.day}</div>
                  <div
                    className={`
                      h-16 rounded-lg flex flex-col items-center justify-center text-sm font-medium
                      ${getActivityLevel(day.total, maxDailyActivity)}
                      ${day.total > 0 ? 'text-white' : 'text-muted-foreground'}
                    `}
                    title={`${day.day}: ${day.total} activities`}
                  >
                    <div className="text-lg font-bold">{day.total}</div>
                    <div className="text-xs opacity-80">
                      {day.completions}c {day.creations}n
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-muted rounded-sm" />
                <span>No activity</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-200 rounded-sm" />
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-400 rounded-sm" />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                <span>High</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {peakHour.total > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-medium">🕐 Peak Productivity Time</p>
                <p className="text-blue-700 text-sm mt-1">
                  You're most active around {formatHour(peakHour.hour)}. Consider scheduling important tasks during this time.
                </p>
              </div>
            )}
            
            {peakDay.total > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">📅 Most Productive Day</p>
                <p className="text-green-700 text-sm mt-1">
                  {peakDay.day} is your most productive day. Plan challenging tasks for this day.
                </p>
              </div>
            )}
            
            {/* Check for consistent patterns */}
            {(() => {
              const morningActivity = hourlyActivity.slice(6, 12).reduce((sum, h) => sum + h.total, 0);
              const afternoonActivity = hourlyActivity.slice(12, 18).reduce((sum, h) => sum + h.total, 0);
              const eveningActivity = hourlyActivity.slice(18, 24).reduce((sum, h) => sum + h.total, 0);
              
              const maxPeriod = Math.max(morningActivity, afternoonActivity, eveningActivity);
              let periodName = '';
              
              if (maxPeriod === morningActivity && morningActivity > 0) periodName = 'morning';
              else if (maxPeriod === afternoonActivity && afternoonActivity > 0) periodName = 'afternoon';
              else if (maxPeriod === eveningActivity && eveningActivity > 0) periodName = 'evening';
              
              if (periodName) {
                return (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-purple-800 font-medium">⏰ Time Preference</p>
                    <p className="text-purple-700 text-sm mt-1">
                      You tend to be most active in the {periodName}. This could be your natural productivity rhythm.
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}