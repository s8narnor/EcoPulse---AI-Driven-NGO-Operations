import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient } from "../App";
import { toast } from "sonner";
import { 
  Zap, 
  Plus, 
  Loader2,
  Users,
  Monitor,
  Wind,
  Thermometer,
  TrendingUp,
  Lightbulb,
  CalendarIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { format } from "date-fns";

const EnergyPage = () => {
  const [energyData, setEnergyData] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    electricity_kwh: "",
    num_people: "",
    num_systems: "",
    ac_hours: "",
    outdoor_temp_celsius: "",
    notes: ""
  });

  useEffect(() => {
    fetchEnergyData();
    fetchForecast();
  }, []);

  const fetchEnergyData = async () => {
    try {
      const response = await apiClient.get("/energy");
      setEnergyData(response.data);
    } catch (error) {
      toast.error("Failed to load energy data");
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async () => {
    setForecastLoading(true);
    try {
      const response = await apiClient.get("/energy/forecast");
      setForecast(response.data);
    } catch (error) {
      console.error("Forecast error:", error);
    } finally {
      setForecastLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/energy", {
        date: formData.date,
        electricity_kwh: parseFloat(formData.electricity_kwh),
        num_people: parseInt(formData.num_people),
        num_systems: parseInt(formData.num_systems),
        ac_hours: parseFloat(formData.ac_hours),
        outdoor_temp_celsius: parseFloat(formData.outdoor_temp_celsius),
        notes: formData.notes || null
      });
      toast.success("Energy data recorded successfully");
      setDialogOpen(false);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        electricity_kwh: "",
        num_people: "",
        num_systems: "",
        ac_hours: "",
        outdoor_temp_celsius: "",
        notes: ""
      });
      fetchEnergyData();
      fetchForecast();
    } catch (error) {
      toast.error("Failed to save energy data");
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = energyData
    .slice(0, 30)
    .reverse()
    .map(d => ({
      date: d.date,
      kwh: d.electricity_kwh,
      co2: d.carbon_emission_kg
    }));

  const totalKwh = energyData.reduce((sum, d) => sum + d.electricity_kwh, 0);
  const totalCO2 = energyData.reduce((sum, d) => sum + d.carbon_emission_kg, 0);
  const avgKwh = energyData.length > 0 ? totalKwh / energyData.length : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-[#1A1A1A]">Energy Tracking</h1>
            <p className="text-[#71717A] mt-1">Monitor and forecast your energy consumption</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="add-energy-btn">
                <Plus className="w-5 h-5 mr-2" />
                Add Energy Data
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Record Energy Usage</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                      data-testid="energy-date-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Electricity (kWh)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 150"
                      value={formData.electricity_kwh}
                      onChange={(e) => setFormData(prev => ({ ...prev, electricity_kwh: e.target.value }))}
                      required
                      data-testid="energy-kwh-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of People</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 25"
                      value={formData.num_people}
                      onChange={(e) => setFormData(prev => ({ ...prev, num_people: e.target.value }))}
                      required
                      data-testid="energy-people-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Systems/Computers</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 20"
                      value={formData.num_systems}
                      onChange={(e) => setFormData(prev => ({ ...prev, num_systems: e.target.value }))}
                      required
                      data-testid="energy-systems-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>AC Usage (hours)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="e.g., 8"
                      value={formData.ac_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, ac_hours: e.target.value }))}
                      required
                      data-testid="energy-ac-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Outdoor Temp (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 32"
                      value={formData.outdoor_temp_celsius}
                      onChange={(e) => setFormData(prev => ({ ...prev, outdoor_temp_celsius: e.target.value }))}
                      required
                      data-testid="energy-temp-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    placeholder="Any special circumstances..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    data-testid="energy-notes-input"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-primary" disabled={submitting} data-testid="energy-submit-btn">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Data
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-base" data-testid="total-kwh-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#71717A] mb-1">Total Energy</p>
                  <p className="font-heading text-2xl font-bold text-[#1A1A1A]">
                    {totalKwh.toLocaleString()}
                  </p>
                  <p className="text-sm text-[#71717A]">kWh</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#F9E400]/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#D9C600]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-base" data-testid="total-co2-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#71717A] mb-1">Total Emissions</p>
                  <p className="font-heading text-2xl font-bold text-[#1A1A1A]">
                    {totalCO2.toLocaleString()}
                  </p>
                  <p className="text-sm text-[#71717A]">kg CO₂</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#1A4D2E]/10 flex items-center justify-center">
                  <Wind className="w-5 h-5 text-[#1A4D2E]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-base" data-testid="avg-kwh-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#71717A] mb-1">Daily Average</p>
                  <p className="font-heading text-2xl font-bold text-[#1A1A1A]">
                    {avgKwh.toFixed(1)}
                  </p>
                  <p className="text-sm text-[#71717A]">kWh/day</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#3B82F6]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-base" data-testid="data-points-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[#71717A] mb-1">Data Points</p>
                  <p className="font-heading text-2xl font-bold text-[#1A1A1A]">
                    {energyData.length}
                  </p>
                  <p className="text-sm text-[#71717A]">records</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#4F6F52]/10 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-[#4F6F52]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Energy Chart */}
        <Card className="card-base" data-testid="energy-chart">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Energy Consumption Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-80 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A4D2E]" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A4D2E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1A4D2E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
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
                    formatter={(value, name) => [
                      `${value} ${name === 'kwh' ? 'kWh' : 'kg CO₂'}`,
                      name === 'kwh' ? 'Energy' : 'Emissions'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="kwh" 
                    stroke="#1A4D2E" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorKwh)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-[#71717A]">
                <Zap className="w-12 h-12 mb-4 opacity-20" />
                <p>No energy data yet. Start tracking to see trends.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Forecast */}
        <Card className="card-base bg-gradient-to-br from-[#1A4D2E] to-[#4F6F52]" data-testid="ai-forecast-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-[#F9E400]" />
              AI Energy Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            {forecastLoading ? (
              <div className="flex items-center gap-3 text-white/80">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing your data...</span>
              </div>
            ) : forecast?.sufficient_data ? (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-white/70 text-sm mb-1">Monthly Forecast</p>
                    <p className="font-heading text-2xl font-bold text-white">
                      {forecast.forecast?.monthly_forecast_kwh?.toLocaleString() || '—'}
                    </p>
                    <p className="text-white/70 text-sm">kWh</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-white/70 text-sm mb-1">Confidence</p>
                    <p className="font-heading text-2xl font-bold text-[#F9E400] capitalize">
                      {forecast.forecast?.confidence || 'medium'}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-white/70 text-sm mb-1">Based on</p>
                    <p className="font-heading text-2xl font-bold text-white">
                      {forecast.data_points || 0}
                    </p>
                    <p className="text-white/70 text-sm">data points</p>
                  </div>
                </div>

                {forecast.forecast?.recommendations && (
                  <div>
                    <p className="text-white/90 font-medium mb-3">AI Recommendations:</p>
                    <ul className="space-y-2">
                      {forecast.forecast.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-white/80">
                          <span className="text-[#F9E400]">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/20">
                  <div>
                    <p className="text-white/60 text-xs">Avg. People</p>
                    <p className="text-white font-medium">{forecast.factors?.avg_people || '—'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Avg. Systems</p>
                    <p className="text-white font-medium">{forecast.factors?.avg_systems || '—'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Avg. AC Hours</p>
                    <p className="text-white font-medium">{forecast.factors?.avg_ac_hours || '—'}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Avg. Temp</p>
                    <p className="text-white font-medium">{forecast.factors?.avg_temp_celsius || '—'}°C</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-white/80">
                <p className="mb-2">{forecast?.message || "Add at least 3 data points for AI forecasting"}</p>
                <p className="text-sm text-white/60">
                  Current data points: {forecast?.data_points || energyData.length}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Data Table */}
        <Card className="card-base" data-testid="energy-history-table">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Recent Energy Data</CardTitle>
          </CardHeader>
          <CardContent>
            {energyData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#71717A]">Date</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#71717A]">kWh</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#71717A]">People</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#71717A]">Systems</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#71717A]">AC (hrs)</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#71717A]">Temp</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#71717A]">CO₂</th>
                    </tr>
                  </thead>
                  <tbody>
                    {energyData.slice(0, 10).map((entry, index) => (
                      <tr key={entry.id} className="border-b border-border/50 hover:bg-[#F5F7F5]">
                        <td className="py-3 px-4 text-[#1A1A1A]">{entry.date}</td>
                        <td className="py-3 px-4 text-right font-medium text-[#1A4D2E]">{entry.electricity_kwh}</td>
                        <td className="py-3 px-4 text-right text-[#4A4A4A]">{entry.num_people}</td>
                        <td className="py-3 px-4 text-right text-[#4A4A4A]">{entry.num_systems}</td>
                        <td className="py-3 px-4 text-right text-[#4A4A4A]">{entry.ac_hours}</td>
                        <td className="py-3 px-4 text-right text-[#4A4A4A]">{entry.outdoor_temp_celsius}°C</td>
                        <td className="py-3 px-4 text-right text-[#71717A]">{entry.carbon_emission_kg} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-[#71717A]">
                <Monitor className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No energy data recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EnergyPage;
