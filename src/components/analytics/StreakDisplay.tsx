'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy, Calendar } from 'lucide-react';
import { StreakData } from '@/types';
import { format, parseISO, isToday, isYesterday } from 'date-fns';

interface StreakDisplayProps {
  streaks: StreakData;
  className?: string;
}

export function StreakDisplay({ streaks, className }: StreakDisplayProps) {
  const getStreakStatus = () => {
    if (streaks.current === 0) {
      return {
        icon: Calendar,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        message: 'No current streak',
        description: 'Complete a task to start a new streak!'
      };
    }

    if (streaks.current >= 7) {
      return {
        icon: Trophy,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        message: 'Amazing streak!',
        description: 'You\'re on fire! Keep up the excellent work.'
      };
    }

    if (streaks.current >= 3) {
      return {
        icon: Flame,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        message: 'Great momentum!',
        description: 'You\'re building a solid habit.'
      };
    }

    return {
      icon: Flame,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      message: 'Getting started!',
      description: 'Keep going to build your streak.'
    };
  };

  const status = getStreakStatus();
  const StatusIcon = status.icon;

  const getLastActivityText = () => {
    if (!streaks.lastActivity) return 'No recent activity';
    
    const lastDate = parseISO(streaks.lastActivity);
    
    if (isToday(lastDate)) {
      return 'Today';
    }
    
    if (isYesterday(lastDate)) {
      return 'Yesterday';
    }
    
    return format(lastDate, 'MMM d, yyyy');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Productivity Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Streak */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${status.bgColor} mb-4`}>
            <StatusIcon className={`h-10 w-10 ${status.color}`} />
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold">{streaks.current}</div>
            <div className="text-sm text-muted-foreground">
              {streaks.current === 1 ? 'day' : 'days'} current streak
            </div>
            <Badge variant="outline" className={status.color}>
              {status.message}
            </Badge>
          </div>
        </div>

        {/* Streak Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-semibold text-yellow-600">{streaks.longest}</div>
            <div className="text-sm text-muted-foreground">Best streak</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium">{getLastActivityText()}</div>
            <div className="text-sm text-muted-foreground">Last activity</div>
          </div>
        </div>

        {/* Streak Calendar (last 7 days) */}
        {streaks.streakDates.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium">Recent Activity</div>
            <div className="flex gap-1 justify-center">
              {streaks.streakDates.slice(-7).map((date, index) => {
                const dateObj = parseISO(date);
                const isCurrentDay = isToday(dateObj);
                
                return (
                  <div
                    key={date}
                    className={`
                      w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium
                      ${isCurrentDay 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-green-100 text-green-800'
                      }
                    `}
                    title={format(dateObj, 'MMM d, yyyy')}
                  >
                    {format(dateObj, 'd')}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Motivational Message */}
        <div className={`p-3 rounded-lg ${status.bgColor}`}>
          <p className={`text-sm ${status.color} font-medium`}>
            {status.description}
          </p>
        </div>

        {/* Streak Milestones */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Next Milestones</div>
          <div className="space-y-1">
            {[3, 7, 14, 30].map((milestone) => {
              const isAchieved = streaks.longest >= milestone;
              const isNext = !isAchieved && (streaks.current < milestone);
              
              if (!isNext && !isAchieved) return null;
              
              return (
                <div 
                  key={milestone}
                  className={`flex items-center justify-between text-sm p-2 rounded ${
                    isAchieved 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span>{milestone} days</span>
                  {isAchieved ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      ✓ Achieved
                    </Badge>
                  ) : (
                    <span className="text-xs">
                      {milestone - streaks.current} more days
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}