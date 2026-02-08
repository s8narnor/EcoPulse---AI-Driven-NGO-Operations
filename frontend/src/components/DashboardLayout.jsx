import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { 
  Leaf, 
  LayoutDashboard, 
  Zap, 
  Activity, 
  Lightbulb, 
  Target, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useState } from "react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/energy", label: "Energy", icon: Zap },
  { path: "/activities", label: "Activities", icon: Activity },
  { path: "/insights", label: "Insights", icon: Lightbulb },
  { path: "/planner", label: "Planner", icon: Target },
];

export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#F5F7F5]">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2" data-testid="dashboard-logo">
              <div className="w-9 h-9 rounded-full bg-[#1A4D2E] flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-lg text-[#1A4D2E]">EcoPulse</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive 
                        ? "bg-[#1A4D2E] text-white" 
                        : "text-[#4A4A4A] hover:bg-[#1A4D2E]/10"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* User & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-[#1A1A1A]">{user?.name}</p>
                <p className="text-xs text-[#71717A]">{user?.organization_name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-[#71717A] hover:text-[#EF4444] hover:bg-red-50"
                data-testid="logout-btn"
              >
                <LogOut className="w-5 h-5" />
              </Button>
              
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-btn"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-white">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? "bg-[#1A4D2E] text-white" 
                        : "text-[#4A4A4A] hover:bg-[#F5F7F5]"
                    }`}
                    data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
