import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface Schedule {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  type: 'meeting' | 'call' | 'email' | 'other';
  status: 'scheduled' | 'completed' | 'cancelled';
  participants: string[];
  location?: string;
  created_at: string;
  recurrence?: string;
}

interface AnalyticsTabProps {
  schedules: Schedule[];
}

export function AnalyticsTab({ schedules }: AnalyticsTabProps) {
  const totalEvents = schedules.length;
  const eventsByStatus = schedules.reduce((acc, event) => {
    acc[event.status] = (acc[event.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const eventsByType = schedules.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(eventsByStatus).map(([status, count]) => ({ status, count }));
  const typeData = Object.entries(eventsByType).map(([type, count]) => ({ type, count }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Total Events</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalEvents}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Events by Status</h3>
            <BarChart width={300} height={200} data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </CardContent>
        </Card>
        <Card className="bg-gray-50/50 dark:bg-[#1a2540]/50 backdrop-blur-sm border border-gray-200/20 dark:border-gray-800/20 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Events by Type</h3>
            <BarChart width={300} height={200} data={typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 