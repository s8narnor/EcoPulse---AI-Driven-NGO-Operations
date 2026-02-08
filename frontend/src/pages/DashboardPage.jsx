import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient } from "../App";
import { toast } from "sonner";
import { 
  TreePine, 
  Activity, 
  Target, 
  TrendingDown,
  Trophy,
  Medal,
  Award,
  Loader2,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";

const COLORS = ['#1A4D2E', '#4F6F52', '#F9E400', '#3B82F6', '#EF4444', '#8B5CF6'];

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, leaderboardRes] = await Promise.all([
        apiClient.get("/dashboard/stats"),
        apiClient.get("/dashboard/leaderboard")
      ]);
      setStats(statsRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#1A4D2E]" />
        </div>
      </DashboardLayout>
    );
  }

  const categoryData = stats?.emissions_by_category 
    ? Object.entries(stats.emissions_by_category).map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value: Math.round(value * 100) / 100
      }))
    : [];

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-[#F9E400]" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-[#71717A]">{rank}</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold text-[#1A1A1A]">Dashboard</h1>
          <p className="text-[#71717A] mt-1">Your sustainability overview at a glance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-base" data-testid="total-emissions-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#71717A] mb-1">Total Emissions</p>
                  <p className="font-heading text-3xl font-bold text-[#1A1A1A]">
                    {stats?.total_emissions_kg?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-[#71717A]">kg CO₂</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#1A4D2E]/10 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-[#1A4D2E]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-base" data-testid="activities-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#71717A] mb-1">Activities Tracked</p>
                  <p className="font-heading text-3xl font-bold text-[#1A1A1A]">
                    {stats?.total_activities || 0}
                  </p>
                  <p className="text-sm text-[#71717A]">total entries</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#4F6F52]/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-[#4F6F52]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-base" data-testid="trees-saved-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#71717A] mb-1">Trees Equivalent</p>
                  <p className="font-heading text-3xl font-bold text-[#22C55E]">
                    {stats?.trees_saved_equivalent?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-[#71717A]">trees to offset</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center">
                  <TreePine className="w-6 h-6 text-[#22C55E]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-base" data-testid="sustainability-score-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#71717A] mb-1">Sustainability Score</p>
                  <p className="font-heading text-3xl font-bold text-[#1A4D2E]">
                    {stats?.sustainability_score || 50}
                  </p>
                  <p className="text-sm text-[#71717A]">out of 100</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#F9E400]/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-[#D9C600]" />
                </div>
              </div>
              <Progress 
                value={stats?.sustainability_score || 50} 
                className="mt-4 h-2 bg-[#F5F7F5]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <Card className="card-base" data-testid="monthly-trend-chart">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Monthly Emissions Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.monthly_trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.monthly_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#71717A', fontSize: 12 }}
                      tickFormatter={(value) => value.slice(5)}
                    />
                    <YAxis tick={{ fill: '#71717A', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`${value} kg CO₂`, 'Emissions']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="emissions" 
                      stroke="#1A4D2E" 
                      strokeWidth={3}
                      dot={{ fill: '#1A4D2E', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#F9E400' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-[#71717A]">
                  <p>Add activities to see your emission trends</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="card-base" data-testid="category-breakdown-chart">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Emissions by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} kg CO₂`, 'Emissions']}
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-[#71717A]">
                  <p>No category data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card className="card-base" data-testid="leaderboard-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#F9E400]" />
              NGO Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#71717A]">Rank</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#71717A]">Organization</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#71717A]">Total Emissions</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#71717A]">Reduction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.slice(0, 10).map((entry, index) => (
                      <tr 
                        key={entry.organization_id} 
                        className={`border-b border-border/50 hover:bg-[#F5F7F5] transition-colors ${
                          index < 3 ? 'bg-[#F9E400]/5' : ''
                        }`}
                        data-testid={`leaderboard-row-${index}`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getRankIcon(entry.rank)}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#1A1A1A]">
                          {entry.organization_name}
                        </td>
                        <td className="py-3 px-4 text-right text-[#4A4A4A]">
                          {entry.total_emissions_kg.toLocaleString()} kg
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-flex items-center gap-1 ${
                            entry.reduction_percent > 0 ? 'text-[#22C55E]' : 'text-[#71717A]'
                          }`}>
                            {entry.reduction_percent > 0 && <ArrowDown className="w-4 h-4" />}
                            {entry.reduction_percent.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-[#71717A]">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No leaderboard data yet. Start tracking to compete!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals Overview */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Card className="card-base card-highlight" data-testid="active-goals-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#1A4D2E]/10 flex items-center justify-center">
                  <Target className="w-7 h-7 text-[#1A4D2E]" />
                </div>
                <div>
                  <p className="text-sm text-[#71717A]">Active Goals</p>
                  <p className="font-heading text-3xl font-bold text-[#1A1A1A]">
                    {stats?.active_goals || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-base card-highlight" data-testid="completed-goals-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center">
                  <Target className="w-7 h-7 text-[#22C55E]" />
                </div>
                <div>
                  <p className="text-sm text-[#71717A]">Completed Goals</p>
                  <p className="font-heading text-3xl font-bold text-[#22C55E]">
                    {stats?.completed_goals || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
