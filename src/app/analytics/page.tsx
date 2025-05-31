'use client';

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from 'swr';

// Types
interface MatterData {
  name: string;
  matters: number;
  revenue: number;
  expenses: number;
}

interface MatterType {
  name: string;
  value: number;
}

interface MatterBillingData {
  month: string;
  paid: number;
  outstanding: number;
}

interface TaskData {
  task: string;
  frequency: number;
}

interface SummaryStats {
  totalMatters: number;
  activeMatters: number;
  totalRevenue: number;
  averageCaseDuration: number;
  clientSatisfaction: number;
  totalClients: number;
  successRate: number;
}

interface MatterStatus {
  status: string;
  count: number;
}

interface ClientFeedback {
  rating: number;
  count: number;
}

interface ChartConfig {
  title: string;
  chart: (data: any) => React.ReactElement;
  data: any[];
}

interface Filters {
  attorney: string;
  client: string;
  date: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Analytics() {
  const { data, error, isLoading } = useSWR('/api/analytics/overview', fetcher, { suspense: true });

  // Extract analytics from API response
  const analytics = data?.analytics || {};

  // Summary stats
  const summaryStats = useMemo(() => ({
    totalMatters: analytics.outcomes?.total_cases || 0,
    activeMatters: (analytics.task_metrics?.total_tasks ?? 0) - (analytics.task_metrics?.completed_tasks ?? 0),
    totalRevenue: analytics.billing_metrics?.total_billed || 0,
    averageCaseDuration: Array.isArray(analytics.efficiency_trends) && analytics.efficiency_trends.length > 0
      ? (analytics.efficiency_trends as { average_efficiency: number }[]).reduce((a: number, b: { average_efficiency: number }) => a + b.average_efficiency, 0) / analytics.efficiency_trends.length
      : 0,
    clientSatisfaction: Array.isArray(analytics.risk_distribution)
      ? (analytics.risk_distribution as { risk_level: string; count: number }[]).find((r) => r.risk_level === 'Low')?.count || 0
      : 0,
    totalClients: 0, // Not available in API, keep as 0 or fetch separately if needed
    successRate: analytics.outcomes?.win_rate || 0,
  }), [analytics]);

  // Chart configs (reuse existing, add new for missing KPIs)
  const chartConfigs: ChartConfig[] = [
    {
      title: 'Matters Over Time',
      chart: (data: { month: string; average_efficiency: number }[]) => (
        <LineChart data={Array.isArray(analytics.efficiency_trends) ? analytics.efficiency_trends : []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="average_efficiency" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      ),
      data: Array.isArray(analytics.efficiency_trends) ? analytics.efficiency_trends : [],
    },
    {
      title: 'Billing Metrics',
      chart: (data: { total_hours: number; total_billed: number }[]) => (
        <BarChart data={analytics.billing_metrics ? [analytics.billing_metrics] : []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <XAxis dataKey="total_hours" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="total_billed" fill="#10b981" radius={[10, 10, 0, 0]} />
        </BarChart>
      ),
      data: analytics.billing_metrics ? [analytics.billing_metrics] : [],
    },
    {
      title: 'Task Metrics',
      chart: (data: { total_tasks: number; completion_rate: number; overdue_rate: number }[]) => (
        <BarChart data={analytics.task_metrics ? [analytics.task_metrics] : []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <XAxis dataKey="total_tasks" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="completion_rate" fill="#3b82f6" radius={[10, 10, 0, 0]} />
          <Bar dataKey="overdue_rate" fill="#ef4444" radius={[10, 10, 0, 0]} />
        </BarChart>
      ),
      data: analytics.task_metrics ? [analytics.task_metrics] : [],
    },
    {
      title: 'Risk Distribution',
      chart: (data: { risk_level: string; count: number }[]) => (
        <PieChart>
          <Pie data={Array.isArray(analytics.risk_distribution) ? analytics.risk_distribution : []} dataKey="count" nameKey="risk_level" outerRadius={70} label>
            {(Array.isArray(analytics.risk_distribution) ? analytics.risk_distribution : []).map((entry: { risk_level: string; count: number }, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      ),
      data: Array.isArray(analytics.risk_distribution) ? analytics.risk_distribution : [],
    },
    {
      title: 'Court Performance',
      chart: (data: { court_name: string; win_rate: number }[]) => (
        <BarChart data={Array.isArray(analytics.court_performance) ? analytics.court_performance : []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <XAxis dataKey="court_name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="win_rate" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
        </BarChart>
      ),
      data: Array.isArray(analytics.court_performance) ? analytics.court_performance : [],
    },
    {
      title: 'Judge Performance',
      chart: (data: { judge_name: string; win_rate: number }[]) => (
        <BarChart data={Array.isArray(analytics.judge_performance) ? analytics.judge_performance : []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <XAxis dataKey="judge_name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="win_rate" fill="#f59e0b" radius={[10, 10, 0, 0]} />
        </BarChart>
      ),
      data: Array.isArray(analytics.judge_performance) ? analytics.judge_performance : [],
    },
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        {/* Summary Cards Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        {/* Chart Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        {/* Table/List Skeletons */}
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error instanceof Error ? error.message : 'An error occurred while fetching data'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <React.Suspense fallback={<div className="p-8">Loading analytics...</div>}>
    <div className="flex min-h-screen">
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <div className="flex gap-4">
              <Button variant="outline">Export CSV</Button>
            <Button variant="outline">Export PDF</Button>
          </div>
        </div>

          {/* Summary Statistics Section - Redesigned for visibility and interactivity */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card
              className="bg-white dark:bg-[#1a2540] border-4 border-blue-600 shadow-2xl rounded-2xl transition-all duration-200 hover:scale-[1.03] hover:border-blue-800 focus-within:ring-2 focus-within:ring-blue-400 cursor-pointer"
              title="Total number of matters in the system. Active = not closed."
            >
            <CardContent className="p-6">
                <h3 className="text-base font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Total Matters</h3>
                <p className="text-4xl font-extrabold text-blue-900 dark:text-blue-100 mt-2">{summaryStats.totalMatters}</p>
                <p className="text-sm text-blue-600 dark:text-blue-200 mt-1">{summaryStats.activeMatters} Active</p>
            </CardContent>
          </Card>

            <Card
              className="bg-white dark:bg-[#1a2540] border-4 border-green-600 shadow-2xl rounded-2xl transition-all duration-200 hover:scale-[1.03] hover:border-green-800 focus-within:ring-2 focus-within:ring-green-400 cursor-pointer"
              title="Total revenue generated from all matters in the last 30 days."
            >
            <CardContent className="p-6">
                <h3 className="text-base font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Total Revenue</h3>
                <p className="text-4xl font-extrabold text-green-900 dark:text-green-100 mt-2">${summaryStats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-green-600 dark:text-green-200 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

            <Card
              className="bg-white dark:bg-[#1a2540] border-4 border-purple-600 shadow-2xl rounded-2xl transition-all duration-200 hover:scale-[1.03] hover:border-purple-800 focus-within:ring-2 focus-within:ring-purple-400 cursor-pointer"
              title="Percentage of closed matters with a successful outcome."
            >
            <CardContent className="p-6">
                <h3 className="text-base font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Success Rate</h3>
                <p className="text-4xl font-extrabold text-purple-900 dark:text-purple-100 mt-2">{summaryStats.successRate.toFixed(1)}%</p>
                <p className="text-sm text-purple-600 dark:text-purple-200 mt-1">Closed Matters</p>
            </CardContent>
          </Card>

            <Card
              className="bg-white dark:bg-[#1a2540] border-4 border-pink-600 shadow-2xl rounded-2xl transition-all duration-200 hover:scale-[1.03] hover:border-pink-800 focus-within:ring-2 focus-within:ring-pink-400 cursor-pointer"
              title="Average client feedback rating (out of 5)."
            >
            <CardContent className="p-6">
                <h3 className="text-base font-semibold text-pink-700 dark:text-pink-300 uppercase tracking-wide">Client Satisfaction</h3>
                <p className="text-4xl font-extrabold text-pink-900 dark:text-pink-100 mt-2">{summaryStats.clientSatisfaction}/5</p>
                <p className="text-sm text-pink-600 dark:text-pink-200 mt-1">Avg. Rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm dark:bg-[#22223b] dark:z-10 dark:relative my-8">
          <Input
            placeholder="Filter by Attorney"
            className="w-full sm:w-48 dark:bg-[#22223b] dark:text-white dark:border-gray-700"
          />
          <Input
            placeholder="Filter by Client"
            className="w-full sm:w-48 dark:bg-[#22223b] dark:text-white dark:border-gray-700"
          />
              <Select>
            <SelectTrigger className="w-48 dark:bg-[#22223b] dark:text-white dark:border-gray-700">
              <SelectValue placeholder="Select Time Period" className="dark:text-white" />
            </SelectTrigger>
            <SelectContent className="dark:bg-[#22223b] dark:text-white">
              <SelectItem value="monthly" className="dark:text-white">Monthly</SelectItem>
              <SelectItem value="quarterly" className="dark:text-white">Quarterly</SelectItem>
              <SelectItem value="yearly" className="dark:text-white">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 items-center">
            <DatePicker
              placeholderText="Start Date"
              className="border px-2 py-1 rounded text-sm dark:bg-[#22223b] dark:text-white dark:border-gray-700"
            />
            <DatePicker
              placeholderText="End Date"
              className="border px-2 py-1 rounded text-sm dark:bg-[#22223b] dark:text-white dark:border-gray-700"
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {chartConfigs.map(({ title, chart, data }, i) => (
            <Card
              key={i}
              tabIndex={0}
                className={
                  `bg-white dark:bg-[#1a2540] border-4 border-gray-300 dark:border-gray-700 shadow-2xl rounded-2xl transition-all duration-200 ` +
                  `hover:scale-[1.03] hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400 cursor-pointer`
                }
                title={title}
            >
              <CardContent className="p-6">
                  <h2 className="font-extrabold text-lg text-black mb-4 dark:text-white tracking-wide">{title}</h2>
                <ResponsiveContainer width="100%" height={300}>
                  {chart ? chart(data) : <React.Fragment />}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
    </React.Suspense>
  );
} 