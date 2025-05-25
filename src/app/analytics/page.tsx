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

export default function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ attorney: "", client: "", date: "" });
  const [timePeriod, setTimePeriod] = useState("monthly");
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [focusedChartIndex, setFocusedChartIndex] = useState<number | null>(null);
  const [matterData, setMatterData] = useState<MatterData[]>([]);
  const [matterTypes, setMatterTypes] = useState<MatterType[]>([]);
  const [billingPerformance, setBillingPerformance] = useState<MatterBillingData[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<TaskData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalMatters: 0,
    activeMatters: 0,
    totalRevenue: 0,
    averageCaseDuration: 0,
    clientSatisfaction: 0,
    totalClients: 0,
    successRate: 0,
  });
  const [matterStatuses, setMatterStatuses] = useState<MatterStatus[]>([]);
  const [clientFeedback, setClientFeedback] = useState<ClientFeedback[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timePeriod, dateRange]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all data in parallel
      const [
        mattersResult,
        typesResult,
        billingResult,
        tasksResult,
        statusResult,
        feedbackResult
      ] = await Promise.all([
        supabase.from('matters').select('*').order('created_at', { ascending: true }),
        supabase.from('matter_types').select('*'),
        supabase.from('matter_billing').select('*').order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').eq('is_recurring', true),
        supabase.from('matters').select('status'),
        supabase.from('client_feedback').select('rating')
      ]);

      // Handle individual errors without failing the entire request
      const errors = [];
      if (mattersResult.error) errors.push(`Matters: ${mattersResult.error.message}`);
      if (typesResult.error) errors.push(`Matter types: ${typesResult.error.message}`);
      if (billingResult.error) errors.push(`Billing: ${billingResult.error.message}`);
      if (tasksResult.error) errors.push(`Tasks: ${tasksResult.error.message}`);
      if (statusResult.error) errors.push(`Status: ${statusResult.error.message}`);
      if (feedbackResult.error) errors.push(`Feedback: ${feedbackResult.error.message}`);

      if (errors.length > 0) {
        console.warn('Partial data fetch errors:', errors);
        toast.error('Some data could not be loaded');
      }

      // Process and set data with fallback to empty arrays
      setMatterData(processMatterData(mattersResult.data || []));
      setMatterTypes(typesResult.data || []);
      setBillingPerformance(processBillingData(billingResult.data || []));
      setRecurringTasks(processTasksData(tasksResult.data || []));

      // Process status data with defaults
      const statusCounts = (statusResult.data ?? []).reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      const statuses = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count: Number(count),
      }));
      setMatterStatuses(statuses.length ? statuses : [
        { status: 'Open', count: 0 },
        { status: 'Closed', count: 0 },
        { status: 'Pending', count: 0 }
      ]);

      // Process feedback data with defaults
      const feedbackCounts = (feedbackResult.data ?? []).reduce((acc: Record<number, number>, item: any) => {
        acc[item.rating] = (acc[item.rating] || 0) + 1;
        return acc;
      }, {});

      const feedback = Object.entries(feedbackCounts).map(([rating, count]) => ({
        rating: Number(rating),
        count: Number(count),
      }));
      setClientFeedback(feedback.length ? feedback : [
        { rating: 5, count: 0 },
        { rating: 4, count: 0 },
        { rating: 3, count: 0 },
        { rating: 2, count: 0 },
        { rating: 1, count: 0 }
      ]);

      // Calculate summary statistics
      const stats = calculateSummaryStats(mattersResult.data || []);
      setSummaryStats(stats);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching data');
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const processMatterData = (matters: any[]): MatterData[] => {
    // Group matters by month and calculate metrics
    const monthlyData = matters.reduce((acc: Record<string, { matters: number; revenue: number; expenses: number }>, matter_: any) => {
      const month = new Date(matter_.created_at).toLocaleString('default', { month: 'short' });
      
      if (!acc[month]) {
        acc[month] = { matters: 0, revenue: 0, expenses: 0 };
      }

      acc[month].matters++;
      acc[month].revenue += Number(matter_.revenue) || 0;
      acc[month].expenses += Number(matter_.expenses) || 0;

      return acc;
    }, {});

    // Convert to array format and sort by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        name: month,
        matters: data.matters,
        revenue: data.revenue,
        expenses: data.expenses
      }))
      .sort((a, b) => months.indexOf(a.name) - months.indexOf(b.name));
  };

  const processBillingData = (billing: any[]): MatterBillingData[] => {
    // Group billing data by month
    const monthlyData = billing.reduce((acc: Record<string, { paid: number; outstanding: number }>, bill: any) => {
      const month = new Date(bill.created_at).toLocaleString('default', { month: 'short' });

      if (!acc[month]) {
        acc[month] = { paid: 0, outstanding: 0 };
      }

      if (bill.status === 'paid' && bill.paid_date) {
        acc[month].paid += Number(bill.amount) || 0;
      } else {
        acc[month].outstanding += Number(bill.amount) || 0;
      }

      return acc;
    }, {});

    // Convert to array format
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      paid: data.paid,
      outstanding: data.outstanding
    }));
  };

  const processTasksData = (tasks: any[]): TaskData[] => {
    // Group tasks by title and count their frequency
    const taskCounts = tasks.reduce((acc: Record<string, number>, task: any) => {
      if (task.title) {
        acc[task.title] = (acc[task.title] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(taskCounts).map(([title, count]) => ({
      task: title,
      frequency: count,
    }));
  };

  const calculateSummaryStats = (matters: any[]): SummaryStats => {
    const totalMatters = matters.length;
    const activeMatters = matters.filter(c => c.status === 'active').length;
    const totalRevenue = matters.reduce((sum, c) => sum + (Number(c.revenue) || 0), 0);
    
    // Calculate case duration for closed matters
    const closedMatters = matters.filter(c => c.end_date);
    const totalDuration = closedMatters.reduce((sum, c) => {
      const startDate = new Date(c.start_date).getTime();
      const endDate = new Date(c.end_date).getTime();
      return sum + (endDate - startDate) / (1000 * 60 * 60 * 24); // Convert to days
    }, 0);
    
    const averageCaseDuration = closedMatters.length > 0 ? totalDuration / closedMatters.length : 0;
    const totalClients = new Set(matters.map(c => c.client_id).filter(Boolean)).size;
    const successfulMatters = matters.filter(c => c.status === 'closed' && c.outcome === 'successful').length;
    const successRate = closedMatters.length > 0 ? (successfulMatters / closedMatters.length) * 100 : 0;

    // Calculate client satisfaction from feedback data
    const clientSatisfaction = clientFeedback.length > 0
      ? clientFeedback.reduce((sum, f) => sum + (f.rating * f.count), 0) / 
        clientFeedback.reduce((sum, f) => sum + f.count, 0)
      : 0;

    return {
      totalMatters,
      activeMatters,
      totalRevenue,
      averageCaseDuration,
      clientSatisfaction,
      totalClients,
      successRate,
    };
  };

  const exportToCSV = () => {
    try {
      const csvContent = [
        ['Metric', 'Value'],
        ['Total Matters', summaryStats.totalMatters],
        ['Active Matters', summaryStats.activeMatters],
        ['Total Revenue', summaryStats.totalRevenue],
        ['Average Case Duration', summaryStats.averageCaseDuration],
        ['Client Satisfaction', summaryStats.clientSatisfaction],
        ['Total Clients', summaryStats.totalClients],
        ['Success Rate', `${summaryStats.successRate.toFixed(1)}%`],
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'analytics_report.csv';
      link.click();
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export report');
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

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
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchAnalyticsData}>Retry</Button>
        </div>
      </div>
    );
  }

  const chartConfigs: ChartConfig[] = [
    {
      title: "Matters Over Time",
      chart: (data) => (
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="matters" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      ),
      data: matterData,
    },
    {
      title: "Revenue vs Expenses",
      chart: (data) => (
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="revenue" fill="#10b981" radius={[10, 10, 0, 0]} />
          <Bar dataKey="expenses" fill="#ef4444" radius={[10, 10, 0, 0]} />
        </BarChart>
      ),
      data: matterData,
    },
    {
      title: "Matter Types Distribution",
      chart: () => (
        <PieChart>
          <Pie data={matterTypes} dataKey="value" nameKey="name" outerRadius={70} label>
            {matterTypes.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      ),
      data: matterTypes,
    },
    {
      title: "Billing Performance",
      chart: (data) => (
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="paid" fill="#3b82f6" radius={[10, 10, 0, 0]} />
          <Bar dataKey="outstanding" fill="#f59e0b" radius={[10, 10, 0, 0]} />
        </BarChart>
      ),
      data: billingPerformance,
    },
    {
      title: "Matter Status Overview",
      chart: (data) => (
        <PieChart>
          <Pie data={matterStatuses} dataKey="count" nameKey="status" outerRadius={70} label>
            {matterStatuses.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      ),
      data: matterStatuses,
    },
    {
      title: "Client Satisfaction",
      chart: (data) => (
        <BarChart data={clientFeedback} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <XAxis dataKey="rating" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
        </BarChart>
      ),
      data: clientFeedback,
    }
  ];

  return (
    <div className="flex min-h-screen">
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={exportToCSV}>Export CSV</Button>
            <Button variant="outline">Export PDF</Button>
          </div>
        </div>

        {/* Summary Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm transition-shadow bg-gradient-to-br from-white/90 via-blue-50 to-pink-100/50 hover:shadow-[0_4px_32px_0_rgba(59,130,246,0.12)] dark:hover:shadow-[0_4px_32px_0_rgba(255,255,255,0.27)]">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-black dark:text-black">Total Matters</h3>
              <p className="text-3xl font-bold text-black mt-2 dark:text-black">{summaryStats.totalMatters}</p>
              <p className="text-sm text-gray-700 mt-1 dark:text-black">{summaryStats.activeMatters} Active Matters</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm transition-shadow bg-gradient-to-br from-white/90 via-blue-50 to-pink-100/50 hover:shadow-[0_4px_32px_0_rgba(59,130,246,0.12)] dark:hover:shadow-[0_4px_32px_0_rgba(255,255,255,0.27)]">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-black dark:text-black">Total Revenue</h3>
              <p className="text-3xl font-bold text-black mt-2 dark:text-black">${summaryStats.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-700 mt-1 dark:text-black">Last 30 days</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm transition-shadow bg-gradient-to-br from-white/90 via-blue-50 to-pink-100/50 hover:shadow-[0_4px_32px_0_rgba(59,130,246,0.12)] dark:hover:shadow-[0_4px_32px_0_rgba(255,255,255,0.27)]">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-black dark:text-black">Success Rate</h3>
              <p className="text-3xl font-bold text-black mt-2 dark:text-black">{summaryStats.successRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-700 mt-1 dark:text-black">Based on closed matters</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm transition-shadow bg-gradient-to-br from-white/90 via-blue-50 to-pink-100/50 hover:shadow-[0_4px_32px_0_rgba(59,130,246,0.12)] dark:hover:shadow-[0_4px_32px_0_rgba(255,255,255,0.27)]">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-black dark:text-black">Client Satisfaction</h3>
              <p className="text-3xl font-bold text-black mt-2 dark:text-black">{summaryStats.clientSatisfaction}/5</p>
              <p className="text-sm text-gray-700 mt-1 dark:text-black">Average rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm dark:bg-[#22223b] dark:z-10 dark:relative my-8">
          <Input
            placeholder="Filter by Attorney"
            value={filters.attorney}
            onChange={handleFilterChange}
            name="attorney"
            className="w-full sm:w-48 dark:bg-[#22223b] dark:text-white dark:border-gray-700"
          />
          <Input
            placeholder="Filter by Client"
            value={filters.client}
            onChange={handleFilterChange}
            name="client"
            className="w-full sm:w-48 dark:bg-[#22223b] dark:text-white dark:border-gray-700"
          />
          <Select value={timePeriod} onValueChange={setTimePeriod}>
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
              selected={dateRange.start}
              onChange={(date) => setDateRange({ ...dateRange, start: date })}
              placeholderText="Start Date"
              className="border px-2 py-1 rounded text-sm dark:bg-[#22223b] dark:text-white dark:border-gray-700"
            />
            <DatePicker
              selected={dateRange.end}
              onChange={(date) => setDateRange({ ...dateRange, end: date })}
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
              className={`shadow-sm transition-shadow bg-gradient-to-br from-white/90 via-blue-50 to-pink-100/50 hover:shadow-[0_4px_32px_0_rgba(59,130,246,0.12)] dark:hover:shadow-[0_4px_32px_0_rgba(255,255,255,0.27)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${focusedChartIndex === i ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setFocusedChartIndex(focusedChartIndex === i ? null : i)}
            >
              <CardContent className="p-6">
                <h2 className="font-semibold text-lg text-black mb-4 dark:text-black">{title}</h2>
                <ResponsiveContainer width="100%" height={300}>
                  {chart ? chart(data) : <React.Fragment />}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 