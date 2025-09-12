'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendData } from '@/types';
import { format, parseISO } from 'date-fns';

interface ProductivityChartsProps {
  trends: TrendData;
  type: 'completion-rate' | 'daily-tasks' | 'weekly-average' | 'monthly-overview';
  title: string;
  className?: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

export function ProductivityCharts({ trends, type, title, className }: ProductivityChartsProps) {
  const renderChart = () => {
    switch (type) {
      case 'completion-rate':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends.daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), 'MMM d')}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                labelFormatter={(value) => format(parseISO(value as string), 'MMM d, yyyy')}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Completion Rate']}
              />
              <Line 
                type="monotone" 
                dataKey="completionRate" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'daily-tasks':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends.daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), 'MMM d')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => format(parseISO(value as string), 'MMM d, yyyy')}
                formatter={(value: number, name: string) => [
                  value, 
                  name === 'completed' ? 'Completed' : 'Created'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="created" 
                stackId="1"
                stroke="#ffc658" 
                fill="#ffc658"
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="completed" 
                stackId="1"
                stroke="#82ca9d" 
                fill="#82ca9d"
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'weekly-average':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends.weekly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="weekStart" 
                tickFormatter={(value) => format(parseISO(value), 'MMM d')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => {
                  const weekData = trends.weekly.find(w => w.weekStart === value);
                  return weekData 
                    ? `Week of ${format(parseISO(weekData.weekStart), 'MMM d')} - ${format(parseISO(weekData.weekEnd), 'MMM d')}`
                    : value;
                }}
                formatter={(value: number, name: string) => [
                  name === 'averagePerDay' ? `${value.toFixed(1)} per day` : value,
                  name === 'averagePerDay' ? 'Daily Average' : 
                  name === 'completed' ? 'Completed' : 'Created'
                ]}
              />
              <Bar dataKey="completed" fill="#82ca9d" />
              <Bar dataKey="averagePerDay" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'monthly-overview':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={(value, index) => {
                  const monthData = trends.monthly[index];
                  return monthData ? `${value} ${monthData.year}` : value;
                }}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                labelFormatter={(value, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${data.month} ${data.year}`;
                  }
                  return value;
                }}
                formatter={(value: number, name: string) => [
                  name === 'averagePerDay' ? `${value.toFixed(1)} per day` : 
                  name === 'completionRate' ? `${value.toFixed(1)}%` : value,
                  name === 'completed' ? 'Completed' : 
                  name === 'created' ? 'Created' :
                  name === 'averagePerDay' ? 'Daily Average' : 'Completion Rate'
                ]}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="completed" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={{ fill: '#82ca9d' }}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="created" 
                stroke="#ffc658" 
                strokeWidth={2}
                dot={{ fill: '#ffc658' }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="completionRate" 
                stroke="#8884d8" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Chart type not supported</div>;
    }
  };

  const getChartDescription = () => {
    switch (type) {
      case 'completion-rate':
        return 'Track your task completion percentage over time';
      case 'daily-tasks':
        return 'Daily task creation and completion activity';
      case 'weekly-average':
        return 'Weekly task completion and daily averages';
      case 'monthly-overview':
        return 'Monthly productivity trends and completion rates';
      default:
        return '';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{getChartDescription()}</p>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}