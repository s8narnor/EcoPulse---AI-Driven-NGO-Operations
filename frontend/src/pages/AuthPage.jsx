import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../App";
import { Leaf, Mail, Lock, User, Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "register");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    organizationName: "",
  });
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(
          formData.email,
          formData.password,
          formData.name,
          formData.organizationName
        );
      }
      
      if (result.success) {
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-10" data-testid="auth-logo">
          <div className="w-12 h-12 rounded-full bg-[#1A4D2E] flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="font-heading font-bold text-2xl text-[#1A4D2E]">EcoPulse</span>
        </Link>

        {/* Auth Card */}
        <div className="card-base p-8" data-testid="auth-card">
          <div className="text-center mb-8">
            <h1 className="font-heading text-2xl font-bold text-[#1A1A1A] mb-2">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-[#71717A]">
              {isLogin 
                ? "Sign in to access your sustainability dashboard" 
                : "Start tracking your organization's impact"
              }
            </p>
          </div>

          {/* Toggle */}
          <div className="flex bg-[#F5F7F5] rounded-lg p-1 mb-8">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                isLogin 
                  ? "bg-white shadow-sm text-[#1A4D2E]" 
                  : "text-[#71717A] hover:text-[#4A4A4A]"
              }`}
              data-testid="login-tab"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                !isLogin 
                  ? "bg-white shadow-sm text-[#1A4D2E]" 
                  : "text-[#71717A] hover:text-[#4A4A4A]"
              }`}
              data-testid="register-tab"
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#4A4A4A]">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10 input-base"
                      required={!isLogin}
                      data-testid="name-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationName" className="text-[#4A4A4A]">Organization Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
                    <Input
                      id="organizationName"
                      name="organizationName"
                      type="text"
                      placeholder="Green Earth Foundation"
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      className="pl-10 input-base"
                      required={!isLogin}
                      data-testid="org-name-input"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#4A4A4A]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 input-base"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#4A4A4A]">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 input-base"
                  required
                  minLength={6}
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#4A4A4A]"
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3"
              data-testid="submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isLogin ? "Signing In..." : "Creating Account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>
        </div>

        {/* Back to home */}
        <p className="text-center mt-6 text-[#71717A]">
          <Link to="/" className="hover:text-[#1A4D2E] transition-colors">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
