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

// Types
interface CaseData {
  name: string;
  cases: number;
  revenue: number;
  expenses: number;
}

interface CaseType {
  name: string;
  value: number;
}

interface BillingData {
  month: string;
  paid: number;
  outstanding: number;
}

interface TaskData {
  task: string;
  frequency: number;
}

interface SummaryStats {
  totalCases: number;
  activeCases: number;
  totalRevenue: number;
  averageCaseDuration: number;
  clientSatisfaction: number;
  totalClients: number;
  successRate: number;
}

interface CaseStatus {
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
  const [caseData, setCaseData] = useState<CaseData[]>([]);
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [billingPerformance, setBillingPerformance] = useState<BillingData[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<TaskData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalCases: 0,
    activeCases: 0,
    totalRevenue: 0,
    averageCaseDuration: 0,
    clientSatisfaction: 0,
    totalClients: 0,
    successRate: 0,
  });
  const [caseStatuses, setCaseStatuses] = useState<CaseStatus[]>([]);
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
        { data: cases, error: casesError },
        { data: types, error: typesError },
        { data: billing, error: billingError },
        { data: tasks, error: tasksError },
        { data: statusData, error: statusError },
        { data: feedbackData, error: feedbackError }
      ] = await Promise.all([
        supabase.from('cases').select('*').order('created_at', { ascending: true }),
        supabase.from('case_types').select('*'),
        supabase.from('billing').select('*').order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').eq('is_recurring', true),
        supabase.from('cases').select('status'),
        supabase.from('client_feedback').select('rating')
      ]);

      // Handle errors
      if (casesError) throw new Error('Failed to fetch cases data');
      if (typesError) throw new Error('Failed to fetch case types');
      if (billingError) throw new Error('Failed to fetch billing data');
      if (tasksError) throw new Error('Failed to fetch tasks');
      if (statusError) throw new Error('Failed to fetch case statuses');
      if (feedbackError) throw new Error('Failed to fetch client feedback');

      // Process and set data
      setCaseData(processCaseData(cases || []));
      setCaseTypes(types || []);
      setBillingPerformance(processBillingData(billing || []));
      setRecurringTasks(processTasksData(tasks || []));

      // Process status data
      const statusCounts = (statusData ?? []).reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      const statuses = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count: Number(count),
      }));
      setCaseStatuses(statuses);

      // Process feedback data
      const feedbackCounts = (feedbackData ?? []).reduce((acc: Record<number, number>, item: any) => {
        acc[item.rating] = (acc[item.rating] || 0) + 1;
        return acc;
      }, {});

      const feedback = Object.entries(feedbackCounts).map(([rating, count]) => ({
        rating: Number(rating),
        count: Number(count),
      }));
      setClientFeedback(feedback);

      // Calculate summary statistics
      const stats = calculateSummaryStats(cases || []);
      setSummaryStats(stats);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching data');
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const processCaseData = (cases: any[]): CaseData[] => {
    return cases.reduce((acc: CaseData[], case_: any) => {
      const month = new Date(case_.created_at).toLocaleString('default', { month: 'short' });
      const existingMonth = acc.find(item => item.name === month);

      if (existingMonth) {
        existingMonth.cases++;
        existingMonth.revenue += case_.revenue || 0;
        existingMonth.expenses += case_.expenses || 0;
      } else {
        acc.push({
          name: month,
          cases: 1,
          revenue: case_.revenue || 0,
          expenses: case_.expenses || 0,
        });
      }
      return acc;
    }, []);
  };

  const processBillingData = (billing: any[]): BillingData[] => {
    return billing.reduce((acc: BillingData[], bill: any) => {
      const month = bill.month;
      const existingMonth = acc.find(item => item.month === month);

      if (existingMonth) {
        existingMonth.paid += bill.paid || 0;
        existingMonth.outstanding += bill.outstanding || 0;
      } else {
        acc.push({
          month,
          paid: bill.paid || 0,
          outstanding: bill.outstanding || 0,
        });
      }
      return acc;
    }, []);
  };

  const processTasksData = (tasks: any[]): TaskData[] => {
    return tasks.map(task => ({
      task: task.name,
      frequency: task.frequency || 0,
    }));
  };

  const calculateSummaryStats = (cases: any[]): SummaryStats => {
    const totalCases = cases.length;
    const activeCases = cases.filter(c => c.status === 'active').length;
    const totalRevenue = cases.reduce((sum, c) => sum + (c.revenue || 0), 0);
    const totalDuration = cases.reduce((sum, c) => {
      if (c.closed_at) {
        const startDate = new Date(c.created_at).getTime();
        const endDate = new Date(c.closed_at).getTime();
        return sum + (endDate - startDate) / (1000 * 60 * 60 * 24);
      }
      return sum;
    }, 0);
    const closedCases = cases.filter(c => c.closed_at).length;
    const averageCaseDuration = closedCases > 0 ? totalDuration / closedCases : 0;
    const totalClients = new Set(cases.map(c => c.client_id)).size;
    const successfulCases = cases.filter(c => c.status === 'closed' && c.outcome === 'successful').length;
    const successRate = closedCases > 0 ? (successfulCases / closedCases) * 100 : 0;

    return {
      totalCases,
      activeCases,
      totalRevenue,
      averageCaseDuration,
      clientSatisfaction: 4.5, // This would come from actual feedback data
      totalClients,
      successRate,
    };
  };

  const exportToCSV = () => {
    try {
      const csvContent = [
        ['Metric', 'Value'],
        ['Total Cases', summaryStats.totalCases],
        ['Active Cases', summaryStats.activeCases],
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics data...</p>
        </div>
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
      title: "Cases Over Time",
      chart: (data) => (
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="cases" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      ),
      data: caseData,
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
      data: caseData,
    },
    {
      title: "Case Types Distribution",
      chart: () => (
        <PieChart>
          <Pie data={caseTypes} dataKey="value" nameKey="name" outerRadius={70} label>
            {caseTypes.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      ),
      data: caseTypes,
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
      title: "Case Status Overview",
      chart: (data) => (
        <PieChart>
          <Pie data={caseStatuses} dataKey="count" nameKey="status" outerRadius={70} label>
            {caseStatuses.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      ),
      data: caseStatuses,
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={exportToCSV}>Export CSV</Button>
            <Button variant="outline">Export PDF</Button>
          </div>
        </div>

        {/* Summary Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Cases</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summaryStats.totalCases}</p>
              <p className="text-sm text-gray-500 mt-1">{summaryStats.activeCases} Active</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">${summaryStats.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summaryStats.successRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-500 mt-1">Based on closed cases</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-gray-500">Client Satisfaction</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summaryStats.clientSatisfaction}/5</p>
              <p className="text-sm text-gray-500 mt-1">Average rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
          <Input
            placeholder="Filter by Attorney"
            value={filters.attorney}
            onChange={handleFilterChange}
            name="attorney"
            className="w-full sm:w-48"
          />
          <Input
            placeholder="Filter by Client"
            value={filters.client}
            onChange={handleFilterChange}
            name="client"
            className="w-full sm:w-48"
          />
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 items-center">
            <DatePicker
              selected={dateRange.start}
              onChange={(date) => setDateRange({ ...dateRange, start: date })}
              placeholderText="Start Date"
              className="border px-2 py-1 rounded text-sm"
            />
            <DatePicker
              selected={dateRange.end}
              onChange={(date) => setDateRange({ ...dateRange, end: date })}
              placeholderText="End Date"
              className="border px-2 py-1 rounded text-sm"
            />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {chartConfigs.map(({ title, chart, data }, i) => (
            <Card
              key={i}
              className={`bg-white transition-all duration-300 cursor-pointer ${focusedChartIndex === i
                ? "shadow-[0_0_25px_rgba(59,130,246,0.5)] border-2 border-blue-500 scale-[1.01]"
                : "hover:shadow-md"
                }`}
              onClick={() => setFocusedChartIndex(focusedChartIndex === i ? null : i)}
            >
              <CardContent className="p-6">
                <h2 className="font-semibold text-lg text-gray-900 mb-4">{title}</h2>
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