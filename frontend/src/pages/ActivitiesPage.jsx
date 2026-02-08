import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { apiClient } from "../App";
import { toast } from "sonner";
import { 
  Plus, 
  Loader2,
  Car,
  CalendarDays,
  Building,
  Megaphone,
  Briefcase,
  Heart,
  Trash2,
  Info,
  Leaf
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import { format } from "date-fns";

const ACTIVITY_CATEGORIES = {
  travel: {
    label: "Travel & Transportation",
    icon: Car,
    color: "bg-blue-100 text-blue-800",
    types: [
      { value: "petrol_car", label: "Petrol Car", factor: "0.21 kg/km" },
      { value: "diesel_car", label: "Diesel Car", factor: "0.27 kg/km" },
      { value: "electric_car", label: "Electric Car", factor: "0.05 kg/km" },
      { value: "hybrid_car", label: "Hybrid Car", factor: "0.12 kg/km" },
      { value: "motorcycle", label: "Motorcycle", factor: "0.10 kg/km" },
      { value: "bus", label: "Bus", factor: "0.089 kg/km" },
      { value: "train", label: "Train", factor: "0.041 kg/km" },
      { value: "flight_domestic", label: "Flight (Domestic)", factor: "0.255 kg/km" },
      { value: "flight_international", label: "Flight (International)", factor: "0.195 kg/km" },
      { value: "bicycle", label: "Bicycle", factor: "0 kg/km" },
      { value: "walking", label: "Walking", factor: "0 kg/km" }
    ]
  },
  events: {
    label: "Events",
    icon: CalendarDays,
    color: "bg-purple-100 text-purple-800",
    types: [
      { value: "indoor_conference", label: "Indoor Conference", factor: "2.5 kg/person/hr" },
      { value: "outdoor_event", label: "Outdoor Event", factor: "1.2 kg/person/hr" },
      { value: "virtual_meeting", label: "Virtual Meeting", factor: "0.05 kg/person/hr" },
      { value: "workshop", label: "Workshop", factor: "1.8 kg/person/hr" },
      { value: "training_session", label: "Training Session", factor: "1.5 kg/person/hr" },
      { value: "fundraiser", label: "Fundraiser", factor: "3.0 kg/person/hr" },
      { value: "community_gathering", label: "Community Gathering", factor: "1.0 kg/person/hr" }
    ]
  },
  infrastructure: {
    label: "Infrastructure",
    icon: Building,
    color: "bg-amber-100 text-amber-800",
    types: [
      { value: "electricity", label: "General Electricity", factor: "0.5 kg/kWh" },
      { value: "generator_diesel", label: "Diesel Generator", factor: "2.68 kg/kWh" },
      { value: "solar_panel", label: "Solar Panel", factor: "0.02 kg/kWh" },
      { value: "air_conditioning", label: "Air Conditioning", factor: "0.8 kg/hr/unit" },
      { value: "heating", label: "Heating", factor: "0.6 kg/hr/unit" },
      { value: "lighting", label: "Lighting", factor: "0.4 kg/kWh" },
      { value: "computers", label: "Computers", factor: "0.3 kg/kWh" },
      { value: "servers", label: "Servers", factor: "0.5 kg/kWh" }
    ]
  },
  marketing: {
    label: "Marketing",
    icon: Megaphone,
    color: "bg-pink-100 text-pink-800",
    types: [
      { value: "digital_campaign", label: "Digital Campaign", factor: "0.02 kg/impression" },
      { value: "email_marketing", label: "Email Marketing", factor: "0.004 kg/email" },
      { value: "social_media_post", label: "Social Media Post", factor: "0.01 kg/post" },
      { value: "printed_brochure", label: "Printed Brochure", factor: "0.05 kg/page" },
      { value: "printed_banner", label: "Printed Banner", factor: "2.5 kg/banner" },
      { value: "video_production", label: "Video Production", factor: "50 kg/minute" },
      { value: "website_hosting", label: "Website Hosting", factor: "0.3 kg/day" }
    ]
  },
  office: {
    label: "Office Operations",
    icon: Briefcase,
    color: "bg-slate-100 text-slate-800",
    types: [
      { value: "phone_call", label: "Phone Calls", factor: "0.01 kg/minute" },
      { value: "internet_usage", label: "Internet Usage", factor: "0.05 kg/GB" },
      { value: "paper_usage", label: "Paper Usage", factor: "0.005 kg/sheet" },
      { value: "courier_local", label: "Courier (Local)", factor: "1.5 kg/package" },
      { value: "courier_national", label: "Courier (National)", factor: "5.0 kg/package" },
      { value: "courier_international", label: "Courier (International)", factor: "15.0 kg/package" },
      { value: "water_consumption", label: "Water Consumption", factor: "0.0003 kg/liter" }
    ]
  },
  staff_welfare: {
    label: "Staff Welfare",
    icon: Heart,
    color: "bg-rose-100 text-rose-800",
    categories: {
      health_wellness: {
        label: "Health & Wellness",
        types: [
          { value: "gym_membership", label: "Gym Membership", factor: "5.0 kg/month/person" },
          { value: "health_checkup", label: "Health Checkup", factor: "3.0 kg/checkup" },
          { value: "medical_insurance_admin", label: "Medical Insurance Admin", factor: "1.0 kg/month/person" },
          { value: "wellness_program", label: "Wellness Program", factor: "2.0 kg/session" }
        ]
      },
      recreation: {
        label: "Recreation",
        types: [
          { value: "team_outing_local", label: "Team Outing (Local)", factor: "15.0 kg/person" },
          { value: "team_outing_travel", label: "Team Outing (Travel)", factor: "50.0 kg/person" },
          { value: "staff_party", label: "Staff Party", factor: "8.0 kg/person" },
          { value: "gifts_physical", label: "Physical Gifts", factor: "2.0 kg/gift" },
          { value: "gifts_digital", label: "Digital Gifts", factor: "0.1 kg/gift" }
        ]
      },
      uniforms_safety: {
        label: "Uniforms & Safety",
        types: [
          { value: "uniform_cotton", label: "Cotton Uniform", factor: "10.0 kg/piece" },
          { value: "uniform_synthetic", label: "Synthetic Uniform", factor: "15.0 kg/piece" },
          { value: "safety_equipment", label: "Safety Equipment", factor: "5.0 kg/item" },
          { value: "ppe_disposable", label: "Disposable PPE", factor: "0.5 kg/item" }
        ]
      }
    }
  }
};

const ActivitiesPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("travel");
  const [deleting, setDeleting] = useState(null);

  // Form states for different categories
  const [travelForm, setTravelForm] = useState({
    description: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    vehicle_type: "",
    distance_km: "",
    passengers: "1",
    cost: ""
  });

  const [eventForm, setEventForm] = useState({
    description: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    event_type: "",
    attendees: "",
    duration_hours: "",
    has_catering: false,
    has_travel: false,
    cost: ""
  });

  const [infrastructureForm, setInfrastructureForm] = useState({
    description: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    equipment_type: "",
    usage_hours: "",
    power_rating_kw: "1",
    quantity: "1",
    cost: ""
  });

  const [marketingForm, setMarketingForm] = useState({
    description: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    marketing_type: "",
    quantity: "",
    duration_days: "1",
    cost: ""
  });

  const [officeForm, setOfficeForm] = useState({
    description: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    activity_type: "",
    quantity: "",
    cost: ""
  });

  const [staffWelfareForm, setStaffWelfareForm] = useState({
    description: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    welfare_type: "",
    category: "health_wellness",
    beneficiaries: "1",
    cost: ""
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await apiClient.get("/activities");
      setActivities(response.data);
    } catch (error) {
      toast.error("Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      let endpoint = `/activities/${selectedCategory}`;
      let data;

      switch (selectedCategory) {
        case "travel":
          data = {
            ...travelForm,
            distance_km: parseFloat(travelForm.distance_km),
            passengers: parseInt(travelForm.passengers),
            cost: travelForm.cost ? parseFloat(travelForm.cost) : null
          };
          break;
        case "events":
          data = {
            ...eventForm,
            attendees: parseInt(eventForm.attendees),
            duration_hours: parseFloat(eventForm.duration_hours),
            cost: eventForm.cost ? parseFloat(eventForm.cost) : null
          };
          break;
        case "infrastructure":
          data = {
            ...infrastructureForm,
            usage_hours: parseFloat(infrastructureForm.usage_hours),
            power_rating_kw: parseFloat(infrastructureForm.power_rating_kw),
            quantity: parseInt(infrastructureForm.quantity),
            cost: infrastructureForm.cost ? parseFloat(infrastructureForm.cost) : null
          };
          break;
        case "marketing":
          data = {
            ...marketingForm,
            quantity: parseInt(marketingForm.quantity),
            duration_days: parseInt(marketingForm.duration_days),
            cost: marketingForm.cost ? parseFloat(marketingForm.cost) : null
          };
          break;
        case "office":
          data = {
            ...officeForm,
            quantity: parseFloat(officeForm.quantity),
            cost: officeForm.cost ? parseFloat(officeForm.cost) : null
          };
          break;
        case "staff_welfare":
          endpoint = "/activities/staff-welfare";
          data = {
            ...staffWelfareForm,
            beneficiaries: parseInt(staffWelfareForm.beneficiaries),
            cost: staffWelfareForm.cost ? parseFloat(staffWelfareForm.cost) : null
          };
          break;
        default:
          throw new Error("Invalid category");
      }

      await apiClient.post(endpoint, data);
      toast.success("Activity added with auto-calculated emissions!");
      setDialogOpen(false);
      resetForms();
      fetchActivities();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add activity");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForms = () => {
    const defaultDate = format(new Date(), 'yyyy-MM-dd');
    setTravelForm({ description: "", date: defaultDate, vehicle_type: "", distance_km: "", passengers: "1", cost: "" });
    setEventForm({ description: "", date: defaultDate, event_type: "", attendees: "", duration_hours: "", has_catering: false, has_travel: false, cost: "" });
    setInfrastructureForm({ description: "", date: defaultDate, equipment_type: "", usage_hours: "", power_rating_kw: "1", quantity: "1", cost: "" });
    setMarketingForm({ description: "", date: defaultDate, marketing_type: "", quantity: "", duration_days: "1", cost: "" });
    setOfficeForm({ description: "", date: defaultDate, activity_type: "", quantity: "", cost: "" });
    setStaffWelfareForm({ description: "", date: defaultDate, welfare_type: "", category: "health_wellness", beneficiaries: "1", cost: "" });
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await apiClient.delete(`/activities/${id}`);
      toast.success("Activity deleted");
      setActivities(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      toast.error("Failed to delete activity");
    } finally {
      setDeleting(null);
    }
  };

  const getCategoryInfo = (category) => {
    return ACTIVITY_CATEGORIES[category] || { label: category, color: "bg-gray-100 text-gray-800" };
  };

  const totalEmissions = activities.reduce((sum, a) => sum + a.carbon_emission_kg, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-[#1A1A1A]">Smart Activity Tracking</h1>
            <p className="text-[#71717A] mt-1">Automatic carbon calculation based on your activity details</p>
          </div>
          
          <Button 
            className="btn-primary" 
            onClick={() => setDialogOpen(true)}
            data-testid="add-activity-btn"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Activity
          </Button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="card-base" data-testid="total-activities-stat">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1A4D2E]/10 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-[#1A4D2E]" />
                </div>
                <div>
                  <p className="text-sm text-[#71717A]">Total Activities</p>
                  <p className="font-heading text-2xl font-bold text-[#1A1A1A]">{activities.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-base" data-testid="total-emissions-stat">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F9E400]/20 flex items-center justify-center">
                  <Info className="w-6 h-6 text-[#D9C600]" />
                </div>
                <div>
                  <p className="text-sm text-[#71717A]">Total Emissions</p>
                  <p className="font-heading text-2xl font-bold text-[#1A1A1A]">{totalEmissions.toFixed(2)} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-base sm:col-span-2 lg:col-span-1" data-testid="auto-calc-info">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#4A4A4A]">
                  Carbon emissions are <strong>automatically calculated</strong> based on your activity inputs using standard emission factors.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Add New Activity</DialogTitle>
            </DialogHeader>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mt-4">
              <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto gap-1">
                {Object.entries(ACTIVITY_CATEGORIES).map(([key, cat]) => {
                  const Icon = cat.icon;
                  return (
                    <TabsTrigger 
                      key={key} 
                      value={key}
                      className="flex flex-col gap-1 py-2 px-2 data-[state=active]:bg-[#1A4D2E] data-[state=active]:text-white"
                      data-testid={`tab-${key}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{cat.label.split(' ')[0]}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Travel Form */}
              <TabsContent value="travel" className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="e.g., Field visit to partner NGO"
                        value={travelForm.description}
                        onChange={(e) => setTravelForm(prev => ({ ...prev, description: e.target.value }))}
                        required
                        data-testid="travel-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={travelForm.date}
                        onChange={(e) => setTravelForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                        data-testid="travel-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vehicle Type</Label>
                      <Select
                        value={travelForm.vehicle_type}
                        onValueChange={(value) => setTravelForm(prev => ({ ...prev, vehicle_type: value }))}
                        required
                      >
                        <SelectTrigger data-testid="travel-vehicle-type">
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_CATEGORIES.travel.types.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label} ({type.factor})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Distance (km)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 50"
                        value={travelForm.distance_km}
                        onChange={(e) => setTravelForm(prev => ({ ...prev, distance_km: e.target.value }))}
                        required
                        data-testid="travel-distance"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Passengers</Label>
                      <Input
                        type="number"
                        min="1"
                        value={travelForm.passengers}
                        onChange={(e) => setTravelForm(prev => ({ ...prev, passengers: e.target.value }))}
                        required
                        data-testid="travel-passengers"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Cost (Optional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 250.00"
                        value={travelForm.cost}
                        onChange={(e) => setTravelForm(prev => ({ ...prev, cost: e.target.value }))}
                        data-testid="travel-cost"
                      />
                    </div>
                  </div>
                  <div className="bg-[#1A4D2E]/5 rounded-lg p-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#1A4D2E]" />
                    <span className="text-sm text-[#4A4A4A]">
                      Carbon emissions will be automatically calculated based on vehicle type and distance
                    </span>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" className="btn-primary" disabled={submitting} data-testid="submit-travel">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add Activity
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Events Form */}
              <TabsContent value="events" className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Event Description</Label>
                      <Input
                        placeholder="e.g., Annual donor meeting"
                        value={eventForm.description}
                        onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                        required
                        data-testid="event-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={eventForm.date}
                        onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                        data-testid="event-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Event Type</Label>
                      <Select
                        value={eventForm.event_type}
                        onValueChange={(value) => setEventForm(prev => ({ ...prev, event_type: value }))}
                        required
                      >
                        <SelectTrigger data-testid="event-type">
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_CATEGORIES.events.types.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label} ({type.factor})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Attendees</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g., 50"
                        value={eventForm.attendees}
                        onChange={(e) => setEventForm(prev => ({ ...prev, attendees: e.target.value }))}
                        required
                        data-testid="event-attendees"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (hours)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="e.g., 4"
                        value={eventForm.duration_hours}
                        onChange={(e) => setEventForm(prev => ({ ...prev, duration_hours: e.target.value }))}
                        required
                        data-testid="event-duration"
                      />
                    </div>
                    <div className="flex items-center justify-between col-span-2 sm:col-span-1">
                      <Label htmlFor="has-catering">Includes Catering?</Label>
                      <Switch
                        id="has-catering"
                        checked={eventForm.has_catering}
                        onCheckedChange={(checked) => setEventForm(prev => ({ ...prev, has_catering: checked }))}
                        data-testid="event-catering"
                      />
                    </div>
                    <div className="flex items-center justify-between col-span-2 sm:col-span-1">
                      <Label htmlFor="has-travel">Includes Travel?</Label>
                      <Switch
                        id="has-travel"
                        checked={eventForm.has_travel}
                        onCheckedChange={(checked) => setEventForm(prev => ({ ...prev, has_travel: checked }))}
                        data-testid="event-travel"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Cost (Optional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 5000.00"
                        value={eventForm.cost}
                        onChange={(e) => setEventForm(prev => ({ ...prev, cost: e.target.value }))}
                        data-testid="event-cost"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" className="btn-primary" disabled={submitting} data-testid="submit-event">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add Activity
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Infrastructure Form */}
              <TabsContent value="infrastructure" className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="e.g., Office AC usage for the day"
                        value={infrastructureForm.description}
                        onChange={(e) => setInfrastructureForm(prev => ({ ...prev, description: e.target.value }))}
                        required
                        data-testid="infra-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={infrastructureForm.date}
                        onChange={(e) => setInfrastructureForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                        data-testid="infra-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Equipment Type</Label>
                      <Select
                        value={infrastructureForm.equipment_type}
                        onValueChange={(value) => setInfrastructureForm(prev => ({ ...prev, equipment_type: value }))}
                        required
                      >
                        <SelectTrigger data-testid="infra-type">
                          <SelectValue placeholder="Select equipment" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_CATEGORIES.infrastructure.types.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label} ({type.factor})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Usage Hours</Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="e.g., 8"
                        value={infrastructureForm.usage_hours}
                        onChange={(e) => setInfrastructureForm(prev => ({ ...prev, usage_hours: e.target.value }))}
                        required
                        data-testid="infra-hours"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Power Rating (kW)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 2.5"
                        value={infrastructureForm.power_rating_kw}
                        onChange={(e) => setInfrastructureForm(prev => ({ ...prev, power_rating_kw: e.target.value }))}
                        required
                        data-testid="infra-power"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={infrastructureForm.quantity}
                        onChange={(e) => setInfrastructureForm(prev => ({ ...prev, quantity: e.target.value }))}
                        required
                        data-testid="infra-quantity"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cost (Optional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 150.00"
                        value={infrastructureForm.cost}
                        onChange={(e) => setInfrastructureForm(prev => ({ ...prev, cost: e.target.value }))}
                        data-testid="infra-cost"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" className="btn-primary" disabled={submitting} data-testid="submit-infra">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add Activity
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Marketing Form */}
              <TabsContent value="marketing" className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Campaign Description</Label>
                      <Input
                        placeholder="e.g., Social media awareness campaign"
                        value={marketingForm.description}
                        onChange={(e) => setMarketingForm(prev => ({ ...prev, description: e.target.value }))}
                        required
                        data-testid="marketing-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={marketingForm.date}
                        onChange={(e) => setMarketingForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                        data-testid="marketing-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Marketing Type</Label>
                      <Select
                        value={marketingForm.marketing_type}
                        onValueChange={(value) => setMarketingForm(prev => ({ ...prev, marketing_type: value }))}
                        required
                      >
                        <SelectTrigger data-testid="marketing-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_CATEGORIES.marketing.types.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label} ({type.factor})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity (impressions/emails/pages)</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g., 1000"
                        value={marketingForm.quantity}
                        onChange={(e) => setMarketingForm(prev => ({ ...prev, quantity: e.target.value }))}
                        required
                        data-testid="marketing-quantity"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (days)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={marketingForm.duration_days}
                        onChange={(e) => setMarketingForm(prev => ({ ...prev, duration_days: e.target.value }))}
                        required
                        data-testid="marketing-duration"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Cost (Optional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 500.00"
                        value={marketingForm.cost}
                        onChange={(e) => setMarketingForm(prev => ({ ...prev, cost: e.target.value }))}
                        data-testid="marketing-cost"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" className="btn-primary" disabled={submitting} data-testid="submit-marketing">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add Activity
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Office Form */}
              <TabsContent value="office" className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="e.g., Monthly paper usage"
                        value={officeForm.description}
                        onChange={(e) => setOfficeForm(prev => ({ ...prev, description: e.target.value }))}
                        required
                        data-testid="office-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={officeForm.date}
                        onChange={(e) => setOfficeForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                        data-testid="office-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Activity Type</Label>
                      <Select
                        value={officeForm.activity_type}
                        onValueChange={(value) => setOfficeForm(prev => ({ ...prev, activity_type: value }))}
                        required
                      >
                        <SelectTrigger data-testid="office-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_CATEGORIES.office.types.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label} ({type.factor})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity (minutes/GB/sheets/packages/liters)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="e.g., 500"
                        value={officeForm.quantity}
                        onChange={(e) => setOfficeForm(prev => ({ ...prev, quantity: e.target.value }))}
                        required
                        data-testid="office-quantity"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cost (Optional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 100.00"
                        value={officeForm.cost}
                        onChange={(e) => setOfficeForm(prev => ({ ...prev, cost: e.target.value }))}
                        data-testid="office-cost"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" className="btn-primary" disabled={submitting} data-testid="submit-office">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add Activity
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Staff Welfare Form */}
              <TabsContent value="staff_welfare" className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Description</Label>
                      <Input
                        placeholder="e.g., Team building outing"
                        value={staffWelfareForm.description}
                        onChange={(e) => setStaffWelfareForm(prev => ({ ...prev, description: e.target.value }))}
                        required
                        data-testid="welfare-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={staffWelfareForm.date}
                        onChange={(e) => setStaffWelfareForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                        data-testid="welfare-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={staffWelfareForm.category}
                        onValueChange={(value) => {
                          setStaffWelfareForm(prev => ({ ...prev, category: value, welfare_type: "" }));
                        }}
                        required
                      >
                        <SelectTrigger data-testid="welfare-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ACTIVITY_CATEGORIES.staff_welfare.categories).map(([key, cat]) => (
                            <SelectItem key={key} value={key}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={staffWelfareForm.welfare_type}
                        onValueChange={(value) => setStaffWelfareForm(prev => ({ ...prev, welfare_type: value }))}
                        required
                      >
                        <SelectTrigger data-testid="welfare-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_CATEGORIES.staff_welfare.categories[staffWelfareForm.category]?.types.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label} ({type.factor})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Beneficiaries</Label>
                      <Input
                        type="number"
                        min="1"
                        value={staffWelfareForm.beneficiaries}
                        onChange={(e) => setStaffWelfareForm(prev => ({ ...prev, beneficiaries: e.target.value }))}
                        required
                        data-testid="welfare-beneficiaries"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Cost (Optional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 2000.00"
                        value={staffWelfareForm.cost}
                        onChange={(e) => setStaffWelfareForm(prev => ({ ...prev, cost: e.target.value }))}
                        data-testid="welfare-cost"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" className="btn-primary" disabled={submitting} data-testid="submit-welfare">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add Activity
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Activities List */}
        <Card className="card-base" data-testid="activities-list">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A4D2E]" />
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => {
                  const catInfo = getCategoryInfo(activity.activity_category);
                  const Icon = catInfo.icon || Leaf;
                  return (
                    <div 
                      key={activity.id}
                      className="flex items-start justify-between p-4 rounded-xl border border-border/50 hover:bg-[#F5F7F5] transition-colors"
                      data-testid={`activity-${activity.id}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${catInfo.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={catInfo.color}>
                              {catInfo.label}
                            </Badge>
                            <span className="text-sm text-[#71717A]">{activity.date}</span>
                          </div>
                          <p className="font-medium text-[#1A1A1A] mt-1">{activity.description}</p>
                          <p className="text-sm text-[#71717A] mt-0.5">
                            Type: {activity.activity_type.replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-heading font-bold text-[#1A4D2E]">
                            {activity.carbon_emission_kg.toFixed(2)} kg
                          </p>
                          <p className="text-xs text-[#71717A]">CO₂ (auto-calculated)</p>
                          {activity.cost && (
                            <p className="text-xs text-[#71717A]">Cost: ${activity.cost}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(activity.id)}
                          disabled={deleting === activity.id}
                          className="text-[#71717A] hover:text-[#EF4444] hover:bg-red-50"
                          data-testid={`delete-${activity.id}`}
                        >
                          {deleting === activity.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-[#71717A]">
                <Leaf className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No activities tracked yet. Add your first activity to start tracking emissions!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ActivitiesPage;
