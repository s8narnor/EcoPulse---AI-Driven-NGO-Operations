import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient } from "../App";
import { toast } from "sonner";
import { 
  Target, 
  Plus, 
  Loader2,
  Calendar,
  TrendingDown,
  CheckCircle2,
  Trash2,
  Trophy,
  Flag
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { format, addMonths } from "date-fns";

const PlannerPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_reduction_percent: "",
    target_date: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
    baseline_emissions_kg: ""
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await apiClient.get("/goals");
      setGoals(response.data);
    } catch (error) {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/goals", {
        title: formData.title,
        description: formData.description,
        target_reduction_percent: parseFloat(formData.target_reduction_percent),
        target_date: formData.target_date,
        baseline_emissions_kg: formData.baseline_emissions_kg ? parseFloat(formData.baseline_emissions_kg) : null
      });
      toast.success("Goal created successfully!");
      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        target_reduction_percent: "",
        target_date: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
        baseline_emissions_kg: ""
      });
      fetchGoals();
    } catch (error) {
      toast.error("Failed to create goal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await apiClient.delete(`/goals/${id}`);
      toast.success("Goal deleted");
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      toast.error("Failed to delete goal");
    } finally {
      setDeleting(null);
    }
  };

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");

  const getProgressColor = (progress) => {
    if (progress >= 75) return "bg-[#22C55E]";
    if (progress >= 50) return "bg-[#F9E400]";
    if (progress >= 25) return "bg-amber-500";
    return "bg-[#1A4D2E]";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-[#1A1A1A]">Smart Planner</h1>
            <p className="text-[#71717A] mt-1">Set and track your emission reduction goals</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="add-goal-btn">
                <Plus className="w-5 h-5 mr-2" />
                Set New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Create Reduction Goal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Goal Title</Label>
                  <Input
                    placeholder="e.g., Reduce travel emissions by 20%"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    data-testid="goal-title-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your goal and how you plan to achieve it..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={3}
                    data-testid="goal-description-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Reduction (%)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="e.g., 20"
                      value={formData.target_reduction_percent}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_reduction_percent: e.target.value }))}
                      required
                      data-testid="goal-reduction-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Date</Label>
                    <Input
                      type="date"
                      value={formData.target_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                      required
                      data-testid="goal-date-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Baseline Emissions (kg CO₂) - Optional</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Leave empty to use recent 30-day average"
                    value={formData.baseline_emissions_kg}
                    onChange={(e) => setFormData(prev => ({ ...prev, baseline_emissions_kg: e.target.value }))}
                    data-testid="goal-baseline-input"
                  />
                  <p className="text-xs text-[#71717A]">
                    If not provided, we'll calculate baseline from your recent emissions
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-primary" disabled={submitting} data-testid="goal-submit-btn">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
                    Create Goal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-6">
          <Card className="card-base" data-testid="total-goals-stat">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1A4D2E]/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-[#1A4D2E]" />
                </div>
                <div>
                  <p className="text-sm text-[#71717A]">Total Goals</p>
                  <p className="font-heading text-2xl font-bold text-[#1A1A1A]">{goals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-base" data-testid="active-goals-stat">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#3B82F6]/10 flex items-center justify-center">
                  <Flag className="w-6 h-6 text-[#3B82F6]" />
                </div>
                <div>
                  <p className="text-sm text-[#71717A]">Active Goals</p>
                  <p className="font-heading text-2xl font-bold text-[#3B82F6]">{activeGoals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-base" data-testid="completed-goals-stat">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-[#22C55E]" />
                </div>
                <div>
                  <p className="text-sm text-[#71717A]">Completed</p>
                  <p className="font-heading text-2xl font-bold text-[#22C55E]">{completedGoals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Goals */}
        <Card className="card-base" data-testid="active-goals-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Flag className="w-5 h-5 text-[#3B82F6]" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A4D2E]" />
              </div>
            ) : activeGoals.length > 0 ? (
              <div className="space-y-4">
                {activeGoals.map((goal) => (
                  <div 
                    key={goal.id}
                    className="p-6 rounded-xl border border-border/50 hover:shadow-md transition-all"
                    data-testid={`goal-${goal.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-heading font-semibold text-[#1A1A1A] text-lg">{goal.title}</h3>
                        <p className="text-[#71717A] text-sm mt-1">{goal.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(goal.id)}
                        disabled={deleting === goal.id}
                        className="text-[#71717A] hover:text-[#EF4444] hover:bg-red-50"
                        data-testid={`delete-goal-${goal.id}`}
                      >
                        {deleting === goal.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#71717A]">Progress</span>
                        <span className="font-medium text-[#1A1A1A]">{goal.progress_percent.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={goal.progress_percent} 
                        className={`h-3 ${getProgressColor(goal.progress_percent)}`}
                      />
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                        <div>
                          <p className="text-xs text-[#71717A]">Target Reduction</p>
                          <p className="font-medium text-[#1A4D2E]">{goal.target_reduction_percent}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#71717A]">Baseline</p>
                          <p className="font-medium text-[#1A1A1A]">{goal.baseline_emissions_kg.toFixed(2)} kg</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#71717A]">Current</p>
                          <p className="font-medium text-[#1A1A1A]">{goal.current_emissions_kg.toFixed(2)} kg</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#71717A]">Target Date</p>
                          <p className="font-medium text-[#1A1A1A]">{goal.target_date}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-[#71717A]">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No active goals. Set your first reduction target!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <Card className="card-base" data-testid="completed-goals-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#22C55E]" />
                Completed Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedGoals.map((goal) => (
                  <div 
                    key={goal.id}
                    className="p-6 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/5"
                    data-testid={`completed-goal-${goal.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-heading font-semibold text-[#1A1A1A]">{goal.title}</h3>
                          <p className="text-[#71717A] text-sm mt-1">{goal.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge className="bg-[#22C55E] text-white">
                              {goal.target_reduction_percent}% Achieved
                            </Badge>
                            <span className="text-sm text-[#71717A]">
                              Completed by {goal.target_date}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(goal.id)}
                        disabled={deleting === goal.id}
                        className="text-[#71717A] hover:text-[#EF4444] hover:bg-red-50"
                      >
                        {deleting === goal.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips Card */}
        <Card className="card-base bg-gradient-to-br from-[#1A4D2E] to-[#4F6F52]" data-testid="tips-card">
          <CardContent className="p-8">
            <h3 className="font-heading text-xl font-semibold text-white mb-4">
              Tips for Achieving Your Goals
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Start with small, achievable targets (10-20% reduction)",
                "Focus on one high-impact category at a time",
                "Track activities consistently for accurate progress",
                "Review and adjust goals quarterly based on data"
              ].map((tip, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm"
                >
                  <TrendingDown className="w-5 h-5 text-[#F9E400] flex-shrink-0 mt-0.5" />
                  <span className="text-white/90 text-sm">{tip}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PlannerPage;
