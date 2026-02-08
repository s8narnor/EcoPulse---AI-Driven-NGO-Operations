#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class EcoPulseAPITester:
    def __init__(self, base_url: str = "https://eco-impact-ngos.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.org_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200) -> tuple[bool, Dict]:
        """Make HTTP request and return success status and response data"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}

            return success, response_data

        except Exception as e:
            return False, {"error": str(e)}

    def test_health_endpoint(self):
        """Test /api/health endpoint"""
        success, data = self.make_request("GET", "/health")
        self.log_test("Health Check", success, 
                     "" if success else f"Expected healthy status, got: {data}")
        return success

    def test_user_registration(self):
        """Test user registration"""
        test_user_data = {
            "email": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@ecopulse.test",
            "password": "TestPassword123!",
            "name": "Test User",
            "organization_name": "Test NGO Organization"
        }
        
        success, data = self.make_request("POST", "/auth/register", test_user_data)
        
        if success and "access_token" in data and "user" in data:
            self.token = data["access_token"]
            self.user_id = data["user"]["id"]
            self.org_id = data["user"]["organization_id"]
            self.log_test("User Registration", True)
            return True
        else:
            self.log_test("User Registration", False, 
                         f"Registration failed: {data}")
            return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not self.token:
            self.log_test("User Login", False, "No token from registration")
            return False
            
        # Test /auth/me endpoint to verify token works
        success, data = self.make_request("GET", "/auth/me")
        self.log_test("User Login (Token Verification)", success,
                     "" if success else f"Token verification failed: {data}")
        return success

    def test_travel_activity_creation(self):
        """Test creating travel activity with auto carbon calculation"""
        travel_data = {
            "description": "Field visit to partner NGO",
            "date": datetime.now().strftime('%Y-%m-%d'),
            "vehicle_type": "petrol_car",
            "distance_km": 50.0,
            "passengers": 2,
            "cost": 100.50
        }
        
        success, data = self.make_request("POST", "/activities/travel", travel_data, 201)
        
        if success and "carbon_emission_kg" in data:
            expected_emission = 0.21 * 50.0 / 2  # petrol_car factor * distance / passengers
            actual_emission = data["carbon_emission_kg"]
            calculation_correct = abs(actual_emission - expected_emission) < 0.01
            
            self.log_test("Travel Activity Creation", calculation_correct,
                         f"Expected ~{expected_emission:.2f} kg CO2, got {actual_emission} kg CO2" if not calculation_correct else "",
                         data)
            return calculation_correct
        else:
            self.log_test("Travel Activity Creation", False,
                         f"Failed to create travel activity: {data}")
            return False

    def test_staff_welfare_activity_creation(self):
        """Test creating staff welfare activity (Health & Wellness category)"""
        welfare_data = {
            "description": "Monthly gym membership for staff wellness",
            "date": datetime.now().strftime('%Y-%m-%d'),
            "welfare_type": "gym_membership",
            "category": "health_wellness",
            "beneficiaries": 5,
            "cost": 500.00
        }
        
        success, data = self.make_request("POST", "/activities/staff-welfare", welfare_data, 201)
        
        if success and "carbon_emission_kg" in data:
            expected_emission = 5.0 * 5  # gym_membership factor * beneficiaries
            actual_emission = data["carbon_emission_kg"]
            calculation_correct = abs(actual_emission - expected_emission) < 0.01
            
            self.log_test("Staff Welfare Activity Creation", calculation_correct,
                         f"Expected {expected_emission} kg CO2, got {actual_emission} kg CO2" if not calculation_correct else "",
                         data)
            return calculation_correct
        else:
            self.log_test("Staff Welfare Activity Creation", False,
                         f"Failed to create staff welfare activity: {data}")
            return False

    def test_energy_data_creation(self):
        """Test creating energy data entry"""
        energy_data = {
            "date": datetime.now().strftime('%Y-%m-%d'),
            "electricity_kwh": 150.5,
            "num_people": 25,
            "num_systems": 10,
            "ac_hours": 8.0,
            "outdoor_temp_celsius": 28.5,
            "notes": "Daily office energy consumption"
        }
        
        success, data = self.make_request("POST", "/energy", energy_data, 201)
        
        if success and "carbon_emission_kg" in data:
            expected_emission = 150.5 * 0.5  # electricity_kwh * electricity factor
            actual_emission = data["carbon_emission_kg"]
            calculation_correct = abs(actual_emission - expected_emission) < 0.01
            
            self.log_test("Energy Data Creation", calculation_correct,
                         f"Expected {expected_emission} kg CO2, got {actual_emission} kg CO2" if not calculation_correct else "",
                         data)
            return calculation_correct
        else:
            self.log_test("Energy Data Creation", False,
                         f"Failed to create energy data: {data}")
            return False

    def test_goal_creation(self):
        """Test creating emission reduction goal"""
        goal_data = {
            "title": "Reduce travel emissions by 25%",
            "description": "Focus on using public transport and electric vehicles",
            "target_reduction_percent": 25.0,
            "target_date": (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d'),
            "baseline_emissions_kg": 1000.0
        }
        
        success, data = self.make_request("POST", "/goals", goal_data, 201)
        self.log_test("Goal Creation", success,
                     "" if success else f"Failed to create goal: {data}",
                     data)
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        success, data = self.make_request("GET", "/dashboard/stats")
        
        if success and "total_emissions_kg" in data and "sustainability_score" in data:
            self.log_test("Dashboard Stats", True, "", data)
            return True
        else:
            self.log_test("Dashboard Stats", False,
                         f"Missing required fields in dashboard stats: {data}")
            return False

    def test_insights_generation(self):
        """Test AI insights generation"""
        success, data = self.make_request("GET", "/insights/generate")
        
        if success and "recommendations" in data and "sustainability_score" in data:
            has_recommendations = len(data.get("recommendations", [])) > 0
            self.log_test("AI Insights Generation", has_recommendations,
                         "No AI recommendations generated" if not has_recommendations else "",
                         data)
            return has_recommendations
        else:
            self.log_test("AI Insights Generation", False,
                         f"Failed to generate insights: {data}")
            return False

    def test_energy_forecast(self):
        """Test AI energy forecasting"""
        success, data = self.make_request("GET", "/energy/forecast")
        
        if success and "forecast" in data:
            self.log_test("Energy Forecasting", True, "", data)
            return True
        else:
            self.log_test("Energy Forecasting", False,
                         f"Failed to get energy forecast: {data}")
            return False

    def test_activities_list(self):
        """Test retrieving activities list"""
        success, data = self.make_request("GET", "/activities")
        
        if success and isinstance(data, list):
            self.log_test("Activities List", True, f"Retrieved {len(data)} activities")
            return True
        else:
            self.log_test("Activities List", False,
                         f"Failed to get activities: {data}")
            return False

    def test_leaderboard(self):
        """Test leaderboard endpoint"""
        success, data = self.make_request("GET", "/dashboard/leaderboard")
        
        if success and isinstance(data, list):
            self.log_test("Leaderboard", True, f"Retrieved {len(data)} organizations")
            return True
        else:
            self.log_test("Leaderboard", False,
                         f"Failed to get leaderboard: {data}")
            return False

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting EcoPulse API Test Suite")
        print("=" * 50)
        
        # Core functionality tests
        tests = [
            self.test_health_endpoint,
            self.test_user_registration,
            self.test_user_login,
            self.test_travel_activity_creation,
            self.test_staff_welfare_activity_creation,
            self.test_energy_data_creation,
            self.test_goal_creation,
            self.test_dashboard_stats,
            self.test_activities_list,
            self.test_leaderboard,
            self.test_insights_generation,
            self.test_energy_forecast,
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, f"Exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            
            # Print failed tests
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
            
            return 1

def main():
    """Main test execution"""
    tester = EcoPulseAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())