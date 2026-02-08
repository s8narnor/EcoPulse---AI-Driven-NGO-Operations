import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Leaf, BarChart3, Target, Lightbulb, ArrowRight, CheckCircle2, TreePine, Zap, Users } from "lucide-react";
import { Button } from "../components/ui/button";

const LandingPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Activity-Based Tracking",
      description: "Track emissions from travel, events, infrastructure, marketing, and staff welfare with automatic carbon calculations."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI-Powered Forecasting",
      description: "Predict future energy consumption using machine learning with indoor and outdoor factors."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Smart Goal Planner",
      description: "Set emission reduction targets and track your progress towards sustainability goals."
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: "Actionable Insights",
      description: "Get AI-powered recommendations and download comprehensive sustainability reports."
    }
  ];

  const stats = [
    { value: "50+", label: "NGOs Empowered" },
    { value: "10K+", label: "Tons CO₂ Tracked" },
    { value: "30%", label: "Avg. Reduction" },
    { value: "1000+", label: "Trees Equivalent Saved" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="logo">
              <div className="w-10 h-10 rounded-full bg-[#1A4D2E] flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-[#1A4D2E]">EcoPulse</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[#4A4A4A] hover:text-[#1A4D2E] transition-colors">Features</a>
              <a href="#about" className="text-[#4A4A4A] hover:text-[#1A4D2E] transition-colors">About</a>
            </div>
            
            <div className="flex items-center gap-4">
              {token ? (
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="btn-primary"
                  data-testid="go-to-dashboard-btn"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/auth")}
                    className="btn-ghost"
                    data-testid="login-btn"
                  >
                    Log In
                  </Button>
                  <Button
                    onClick={() => navigate("/auth?mode=register")}
                    className="btn-primary"
                    data-testid="get-started-btn"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1748615734058-1831b2af4a44?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHwxfHx3aW5kJTIwdHVyYmluZXMlMjBncmVlbiUyMGVuZXJneSUyMG5hdHVyZXxlbnwwfHx8fDE3NzA1NjU4Mzd8MA&ixlib=rb-4.1.0&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 mb-8 border border-white/20">
              <Leaf className="w-4 h-4 text-[#F9E400]" />
              <span className="text-white/90 text-sm font-medium">Sustainability Intelligence for NGOs</span>
            </div>
            
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Track, Predict &<br />
              <span className="text-[#F9E400]">Reduce Your Impact</span>
            </h1>
            
            <p className="text-lg text-white/80 leading-relaxed mb-10 max-w-xl">
              AI-driven carbon tracking, energy prediction, and actionable insights to optimize your environmental footprint—without breaking the budget.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate(token ? "/dashboard" : "/auth?mode=register")}
                className="btn-primary text-lg px-10 py-4"
                data-testid="hero-cta-btn"
              >
                Start Tracking Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white/10 backdrop-blur-md text-white border-white/30 hover:bg-white/20 rounded-full px-8 py-4"
                data-testid="learn-more-btn"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-border/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="font-heading text-4xl lg:text-5xl font-bold text-[#1A4D2E] mb-2">{stat.value}</p>
                <p className="text-[#71717A]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#F5F7F5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
              Everything You Need for Sustainable Operations
            </h2>
            <p className="text-[#71717A] text-lg max-w-2xl mx-auto">
              A comprehensive platform designed specifically for NGOs to measure, predict, and optimize their environmental impact.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="card-base p-8 hover:-translate-y-1 transition-all duration-300"
                data-testid={`feature-card-${index}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E] mb-6">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-xl font-semibold text-[#1A1A1A] mb-3">{feature.title}</h3>
                <p className="text-[#71717A] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6">
                Built for NGOs,<br />
                <span className="text-[#1A4D2E]">By Sustainability Experts</span>
              </h2>
              <p className="text-[#4A4A4A] text-lg leading-relaxed mb-8">
                We understand that NGOs operate under unique constraints. EcoPulse provides enterprise-grade sustainability intelligence without the enterprise price tag.
              </p>
              
              <div className="space-y-4">
                {[
                  "No expensive sensors required",
                  "Intuitive activity-based tracking",
                  "AI-powered recommendations",
                  "Donor-ready sustainability reports"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#1A4D2E] flex-shrink-0" />
                    <span className="text-[#4A4A4A]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1763856957026-a74ab4f05891?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwxfHxwbGFudGluZyUyMHRyZWVzJTIwaGFuZHMlMjBzb2lsfGVufDB8fHx8MTc3MDU2NTg0N3ww&ixlib=rb-4.1.0&q=85"
                alt="Planting trees"
                className="rounded-2xl shadow-2xl w-full h-auto object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 hidden lg:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
                    <TreePine className="w-6 h-6 text-[#22C55E]" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-2xl text-[#1A1A1A]">1,247</p>
                    <p className="text-[#71717A] text-sm">Trees Equivalent Saved</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#1A4D2E]">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Make an Impact?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Join NGOs worldwide using EcoPulse to track, reduce, and report their environmental footprint.
          </p>
          <Button
            onClick={() => navigate(token ? "/dashboard" : "/auth?mode=register")}
            className="bg-[#F9E400] text-[#1A1A1A] hover:bg-[#D9C600] rounded-full px-10 py-4 text-lg font-medium transition-all duration-300 hover:-translate-y-0.5 shadow-xl"
            data-testid="cta-btn"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1A4D2E] flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-white">EcoPulse</span>
            </div>
            <p className="text-[#71717A] text-sm">
              © 2026 EcoPulse. Sustainability Intelligence for NGOs.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
