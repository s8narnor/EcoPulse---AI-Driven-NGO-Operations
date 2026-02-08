from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'ecopulse-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# LLM Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI(title="EcoPulse NGO Sustainability Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# ==================== EMISSION FACTORS (kg CO2) ====================
EMISSION_FACTORS = {
    # Travel (per km per passenger)
    "travel": {
        "petrol_car": 0.21,
        "diesel_car": 0.27,
        "electric_car": 0.05,
        "hybrid_car": 0.12,
        "motorcycle": 0.10,
        "bus": 0.089,
        "train": 0.041,
        "flight_domestic": 0.255,
        "flight_international": 0.195,
        "bicycle": 0,
        "walking": 0
    },
    # Events (per attendee per hour)
    "events": {
        "indoor_conference": 2.5,
        "outdoor_event": 1.2,
        "virtual_meeting": 0.05,
        "workshop": 1.8,
        "training_session": 1.5,
        "fundraiser": 3.0,
        "community_gathering": 1.0
    },
    # Infrastructure (per kWh)
    "infrastructure": {
        "electricity": 0.5,  # kg CO2 per kWh
        "generator_diesel": 2.68,
        "solar_panel": 0.02,
        "air_conditioning": 0.8,  # additional factor per hour
        "heating": 0.6,
        "lighting": 0.4,
        "computers": 0.3,
        "servers": 0.5
    },
    # Marketing (per unit)
    "marketing": {
        "digital_campaign": 0.02,  # per impression
        "email_marketing": 0.004,  # per email
        "social_media_post": 0.01,
        "printed_brochure": 0.05,  # per page
        "printed_banner": 2.5,
        "video_production": 50,  # per minute
        "website_hosting": 0.3  # per day
    },
    # Office Operations (per unit)
    "office": {
        "phone_call": 0.01,  # per minute
        "internet_usage": 0.05,  # per GB
        "paper_usage": 0.005,  # per sheet
        "courier_local": 1.5,  # per package
        "courier_national": 5.0,
        "courier_international": 15.0,
        "water_consumption": 0.0003  # per liter
    },
    # Staff Welfare (per unit)
    "staff_welfare": {
        # Health & Wellness
        "gym_membership": 5.0,  # per month per person
        "health_checkup": 3.0,  # per checkup
        "medical_insurance_admin": 1.0,  # per month per person
        "wellness_program": 2.0,  # per session
        # Recreation
        "team_outing_local": 15.0,  # per person
        "team_outing_travel": 50.0,  # per person
        "staff_party": 8.0,  # per person
        "gifts_physical": 2.0,  # per gift
        "gifts_digital": 0.1,  # per gift
        # Uniforms & Safety
        "uniform_cotton": 10.0,  # per piece
        "uniform_synthetic": 15.0,
        "safety_equipment": 5.0,  # per item
        "ppe_disposable": 0.5  # per item
    }
}

# Trees saved factor (average tree absorbs ~22kg CO2 per year)
TREES_ABSORPTION_RATE = 22  # kg CO2 per tree per year

# ==================== PYDANTIC MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    organization_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    organization_id: str
    organization_name: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class OrganizationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    created_at: str
    total_emissions: float = 0
    total_activities: int = 0

# Activity Models
class TravelActivityCreate(BaseModel):
    description: str
    date: str
    vehicle_type: str  # petrol_car, diesel_car, electric_car, etc.
    distance_km: float
    passengers: int = 1
    cost: Optional[float] = None

class EventActivityCreate(BaseModel):
    description: str
    date: str
    event_type: str  # indoor_conference, outdoor_event, etc.
    attendees: int
    duration_hours: float
    has_catering: bool = False
    has_travel: bool = False
    cost: Optional[float] = None

class InfrastructureActivityCreate(BaseModel):
    description: str
    date: str
    equipment_type: str  # electricity, air_conditioning, etc.
    usage_hours: float
    power_rating_kw: float = 1.0
    quantity: int = 1
    cost: Optional[float] = None

class MarketingActivityCreate(BaseModel):
    description: str
    date: str
    marketing_type: str  # digital_campaign, printed_brochure, etc.
    quantity: int
    duration_days: int = 1
    cost: Optional[float] = None

class OfficeActivityCreate(BaseModel):
    description: str
    date: str
    activity_type: str  # phone_call, paper_usage, courier_local, etc.
    quantity: float
    cost: Optional[float] = None

class StaffWelfareActivityCreate(BaseModel):
    description: str
    date: str
    welfare_type: str  # gym_membership, team_outing_local, uniform_cotton, etc.
    category: str  # health_wellness, recreation, uniforms_safety
    beneficiaries: int = 1
    cost: Optional[float] = None

class ActivityResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    organization_id: str
    activity_category: str
    activity_type: str
    description: str
    date: str
    details: Dict[str, Any]
    carbon_emission_kg: float
    cost: Optional[float]
    created_at: str
    created_by: str

# Energy Models
class EnergyDataCreate(BaseModel):
    date: str
    electricity_kwh: float
    num_people: int
    num_systems: int
    ac_hours: float
    outdoor_temp_celsius: float
    notes: Optional[str] = None

class EnergyDataResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    organization_id: str
    date: str
    electricity_kwh: float
    num_people: int
    num_systems: int
    ac_hours: float
    outdoor_temp_celsius: float
    carbon_emission_kg: float
    notes: Optional[str]
    created_at: str

# Goal Models
class GoalCreate(BaseModel):
    title: str
    description: str
    target_reduction_percent: float
    target_date: str
    baseline_emissions_kg: Optional[float] = None

class GoalResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    organization_id: str
    title: str
    description: str
    target_reduction_percent: float
    target_date: str
    baseline_emissions_kg: float
    current_emissions_kg: float
    progress_percent: float
    status: str
    created_at: str

class InsightResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    organization_id: str
    insight_type: str
    title: str
    content: str
    recommendations: List[str]
    created_at: str

class DashboardStats(BaseModel):
    total_emissions_kg: float
    total_activities: int
    emissions_by_category: Dict[str, float]
    monthly_trend: List[Dict[str, Any]]
    trees_saved_equivalent: float
    sustainability_score: float
    active_goals: int
    completed_goals: int

class LeaderboardEntry(BaseModel):
    organization_id: str
    organization_name: str
    total_emissions_kg: float
    reduction_percent: float
    rank: int

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, org_id: str) -> str:
    payload = {
        "user_id": user_id,
        "org_id": org_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        org_id = payload.get("org_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id, "org_id": org_id}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def calculate_travel_emission(vehicle_type: str, distance_km: float, passengers: int) -> float:
    factor = EMISSION_FACTORS["travel"].get(vehicle_type, 0.21)
    return factor * distance_km / max(passengers, 1)

def calculate_event_emission(event_type: str, attendees: int, duration_hours: float, has_catering: bool, has_travel: bool) -> float:
    factor = EMISSION_FACTORS["events"].get(event_type, 1.5)
    base_emission = factor * attendees * duration_hours
    if has_catering:
        base_emission += attendees * 2.5  # ~2.5 kg per meal
    if has_travel:
        base_emission += attendees * 5  # estimated travel emission per attendee
    return base_emission

def calculate_infrastructure_emission(equipment_type: str, usage_hours: float, power_rating_kw: float, quantity: int) -> float:
    factor = EMISSION_FACTORS["infrastructure"].get(equipment_type, 0.5)
    kwh = power_rating_kw * usage_hours * quantity
    return factor * kwh

def calculate_marketing_emission(marketing_type: str, quantity: int, duration_days: int) -> float:
    factor = EMISSION_FACTORS["marketing"].get(marketing_type, 0.02)
    if marketing_type in ["digital_campaign", "social_media_post", "website_hosting"]:
        return factor * quantity * duration_days
    return factor * quantity

def calculate_office_emission(activity_type: str, quantity: float) -> float:
    factor = EMISSION_FACTORS["office"].get(activity_type, 0.01)
    return factor * quantity

def calculate_staff_welfare_emission(welfare_type: str, beneficiaries: int) -> float:
    factor = EMISSION_FACTORS["staff_welfare"].get(welfare_type, 1.0)
    return factor * beneficiaries

def calculate_sustainability_score(total_emissions: float, reduction_percent: float, goals_completed: int) -> float:
    # Base score starts at 50
    score = 50
    # Lower emissions = higher score (max +30 points)
    if total_emissions < 1000:
        score += 30
    elif total_emissions < 5000:
        score += 20
    elif total_emissions < 10000:
        score += 10
    # Reduction percentage bonus (max +15 points)
    score += min(reduction_percent * 0.5, 15)
    # Goals completed bonus (max +5 points)
    score += min(goals_completed * 1, 5)
    return min(score, 100)

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create organization
    org_id = str(uuid.uuid4())
    org_doc = {
        "id": org_id,
        "name": user_data.organization_name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "settings": {}
    }
    await db.organizations.insert_one(org_doc)
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "organization_id": org_id,
        "organization_name": user_data.organization_name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, org_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            organization_id=org_id,
            organization_name=user_data.organization_name,
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["organization_id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            organization_id=user["organization_id"],
            organization_name=user["organization_name"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)

# ==================== ACTIVITY ENDPOINTS ====================

@api_router.post("/activities/travel", response_model=ActivityResponse)
async def create_travel_activity(data: TravelActivityCreate, current_user: dict = Depends(get_current_user)):
    carbon_emission = calculate_travel_emission(data.vehicle_type, data.distance_km, data.passengers)
    
    activity_id = str(uuid.uuid4())
    activity_doc = {
        "id": activity_id,
        "organization_id": current_user["org_id"],
        "activity_category": "travel",
        "activity_type": data.vehicle_type,
        "description": data.description,
        "date": data.date,
        "details": {
            "vehicle_type": data.vehicle_type,
            "distance_km": data.distance_km,
            "passengers": data.passengers
        },
        "carbon_emission_kg": round(carbon_emission, 2),
        "cost": data.cost,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["user_id"]
    }
    await db.activities.insert_one(activity_doc)
    return ActivityResponse(**{k: v for k, v in activity_doc.items() if k != "_id"})

@api_router.post("/activities/events", response_model=ActivityResponse)
async def create_event_activity(data: EventActivityCreate, current_user: dict = Depends(get_current_user)):
    carbon_emission = calculate_event_emission(
        data.event_type, data.attendees, data.duration_hours, data.has_catering, data.has_travel
    )
    
    activity_id = str(uuid.uuid4())
    activity_doc = {
        "id": activity_id,
        "organization_id": current_user["org_id"],
        "activity_category": "events",
        "activity_type": data.event_type,
        "description": data.description,
        "date": data.date,
        "details": {
            "event_type": data.event_type,
            "attendees": data.attendees,
            "duration_hours": data.duration_hours,
            "has_catering": data.has_catering,
            "has_travel": data.has_travel
        },
        "carbon_emission_kg": round(carbon_emission, 2),
        "cost": data.cost,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["user_id"]
    }
    await db.activities.insert_one(activity_doc)
    return ActivityResponse(**{k: v for k, v in activity_doc.items() if k != "_id"})

@api_router.post("/activities/infrastructure", response_model=ActivityResponse)
async def create_infrastructure_activity(data: InfrastructureActivityCreate, current_user: dict = Depends(get_current_user)):
    carbon_emission = calculate_infrastructure_emission(
        data.equipment_type, data.usage_hours, data.power_rating_kw, data.quantity
    )
    
    activity_id = str(uuid.uuid4())
    activity_doc = {
        "id": activity_id,
        "organization_id": current_user["org_id"],
        "activity_category": "infrastructure",
        "activity_type": data.equipment_type,
        "description": data.description,
        "date": data.date,
        "details": {
            "equipment_type": data.equipment_type,
            "usage_hours": data.usage_hours,
            "power_rating_kw": data.power_rating_kw,
            "quantity": data.quantity
        },
        "carbon_emission_kg": round(carbon_emission, 2),
        "cost": data.cost,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["user_id"]
    }
    await db.activities.insert_one(activity_doc)
    return ActivityResponse(**{k: v for k, v in activity_doc.items() if k != "_id"})

@api_router.post("/activities/marketing", response_model=ActivityResponse)
async def create_marketing_activity(data: MarketingActivityCreate, current_user: dict = Depends(get_current_user)):
    carbon_emission = calculate_marketing_emission(data.marketing_type, data.quantity, data.duration_days)
    
    activity_id = str(uuid.uuid4())
    activity_doc = {
        "id": activity_id,
        "organization_id": current_user["org_id"],
        "activity_category": "marketing",
        "activity_type": data.marketing_type,
        "description": data.description,
        "date": data.date,
        "details": {
            "marketing_type": data.marketing_type,
            "quantity": data.quantity,
            "duration_days": data.duration_days
        },
        "carbon_emission_kg": round(carbon_emission, 2),
        "cost": data.cost,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["user_id"]
    }
    await db.activities.insert_one(activity_doc)
    return ActivityResponse(**{k: v for k, v in activity_doc.items() if k != "_id"})

@api_router.post("/activities/office", response_model=ActivityResponse)
async def create_office_activity(data: OfficeActivityCreate, current_user: dict = Depends(get_current_user)):
    carbon_emission = calculate_office_emission(data.activity_type, data.quantity)
    
    activity_id = str(uuid.uuid4())
    activity_doc = {
        "id": activity_id,
        "organization_id": current_user["org_id"],
        "activity_category": "office",
        "activity_type": data.activity_type,
        "description": data.description,
        "date": data.date,
        "details": {
            "activity_type": data.activity_type,
            "quantity": data.quantity
        },
        "carbon_emission_kg": round(carbon_emission, 2),
        "cost": data.cost,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["user_id"]
    }
    await db.activities.insert_one(activity_doc)
    return ActivityResponse(**{k: v for k, v in activity_doc.items() if k != "_id"})

@api_router.post("/activities/staff-welfare", response_model=ActivityResponse)
async def create_staff_welfare_activity(data: StaffWelfareActivityCreate, current_user: dict = Depends(get_current_user)):
    carbon_emission = calculate_staff_welfare_emission(data.welfare_type, data.beneficiaries)
    
    activity_id = str(uuid.uuid4())
    activity_doc = {
        "id": activity_id,
        "organization_id": current_user["org_id"],
        "activity_category": "staff_welfare",
        "activity_type": data.welfare_type,
        "description": data.description,
        "date": data.date,
        "details": {
            "welfare_type": data.welfare_type,
            "category": data.category,
            "beneficiaries": data.beneficiaries
        },
        "carbon_emission_kg": round(carbon_emission, 2),
        "cost": data.cost,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["user_id"]
    }
    await db.activities.insert_one(activity_doc)
    return ActivityResponse(**{k: v for k, v in activity_doc.items() if k != "_id"})

@api_router.get("/activities", response_model=List[ActivityResponse])
async def get_activities(
    category: Optional[str] = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    query = {"organization_id": current_user["org_id"]}
    if category:
        query["activity_category"] = category
    
    activities = await db.activities.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return [ActivityResponse(**a) for a in activities]

@api_router.delete("/activities/{activity_id}")
async def delete_activity(activity_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.activities.delete_one({
        "id": activity_id,
        "organization_id": current_user["org_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"message": "Activity deleted"}

# ==================== ENERGY ENDPOINTS ====================

@api_router.post("/energy", response_model=EnergyDataResponse)
async def create_energy_data(data: EnergyDataCreate, current_user: dict = Depends(get_current_user)):
    # Calculate carbon emission from electricity
    base_emission = data.electricity_kwh * EMISSION_FACTORS["infrastructure"]["electricity"]
    
    energy_id = str(uuid.uuid4())
    energy_doc = {
        "id": energy_id,
        "organization_id": current_user["org_id"],
        "date": data.date,
        "electricity_kwh": data.electricity_kwh,
        "num_people": data.num_people,
        "num_systems": data.num_systems,
        "ac_hours": data.ac_hours,
        "outdoor_temp_celsius": data.outdoor_temp_celsius,
        "carbon_emission_kg": round(base_emission, 2),
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.energy_data.insert_one(energy_doc)
    return EnergyDataResponse(**{k: v for k, v in energy_doc.items() if k != "_id"})

@api_router.get("/energy", response_model=List[EnergyDataResponse])
async def get_energy_data(limit: int = 365, current_user: dict = Depends(get_current_user)):
    data = await db.energy_data.find(
        {"organization_id": current_user["org_id"]}, {"_id": 0}
    ).sort("date", -1).limit(limit).to_list(limit)
    return [EnergyDataResponse(**d) for d in data]

@api_router.get("/energy/forecast")
async def get_energy_forecast(current_user: dict = Depends(get_current_user)):
    # Get historical energy data
    energy_data = await db.energy_data.find(
        {"organization_id": current_user["org_id"]}, {"_id": 0}
    ).sort("date", -1).limit(365).to_list(365)
    
    if len(energy_data) < 3:
        return {
            "message": "Need at least 3 data points for forecasting",
            "forecast": None,
            "sufficient_data": False
        }
    
    # Simple forecasting based on averages and trends
    total_kwh = sum(d["electricity_kwh"] for d in energy_data)
    avg_kwh = total_kwh / len(energy_data)
    avg_people = sum(d["num_people"] for d in energy_data) / len(energy_data)
    avg_systems = sum(d["num_systems"] for d in energy_data) / len(energy_data)
    avg_ac = sum(d["ac_hours"] for d in energy_data) / len(energy_data)
    avg_temp = sum(d["outdoor_temp_celsius"] for d in energy_data) / len(energy_data)
    
    # Generate AI-powered forecast using GPT-5.2
    if EMERGENT_LLM_KEY:
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"forecast-{current_user['org_id']}-{datetime.now().strftime('%Y%m%d')}",
                system_message="You are an energy forecasting expert for NGOs. Provide concise, actionable forecasts."
            ).with_model("openai", "gpt-5.2")
            
            prompt = f"""Based on the following historical data for an NGO:
- Average daily electricity: {avg_kwh:.2f} kWh
- Average occupancy: {avg_people:.0f} people
- Average systems running: {avg_systems:.0f}
- Average AC usage: {avg_ac:.1f} hours/day
- Average outdoor temp: {avg_temp:.1f}°C
- Total data points: {len(energy_data)}

Provide a brief forecast for the next month's energy consumption and 3 specific recommendations to reduce energy usage. Format as JSON with keys: 'monthly_forecast_kwh', 'confidence', 'recommendations' (array of strings)."""

            response = await chat.send_message(UserMessage(text=prompt))
            
            import json
            try:
                forecast_data = json.loads(response)
            except:
                forecast_data = {
                    "monthly_forecast_kwh": avg_kwh * 30,
                    "confidence": "medium",
                    "recommendations": [
                        "Optimize AC usage during peak hours",
                        "Implement smart lighting systems",
                        "Schedule equipment shutdown during off-hours"
                    ]
                }
            
            return {
                "historical_average_kwh": round(avg_kwh, 2),
                "forecast": forecast_data,
                "factors": {
                    "avg_people": round(avg_people, 1),
                    "avg_systems": round(avg_systems, 1),
                    "avg_ac_hours": round(avg_ac, 1),
                    "avg_temp_celsius": round(avg_temp, 1)
                },
                "sufficient_data": True,
                "data_points": len(energy_data)
            }
        except Exception as e:
            logging.error(f"AI forecast error: {e}")
    
    # Fallback simple forecast
    return {
        "historical_average_kwh": round(avg_kwh, 2),
        "forecast": {
            "monthly_forecast_kwh": round(avg_kwh * 30, 2),
            "confidence": "low",
            "recommendations": [
                "Add more data points for accurate forecasting",
                "Track AC usage patterns",
                "Monitor occupancy trends"
            ]
        },
        "factors": {
            "avg_people": round(avg_people, 1),
            "avg_systems": round(avg_systems, 1),
            "avg_ac_hours": round(avg_ac, 1),
            "avg_temp_celsius": round(avg_temp, 1)
        },
        "sufficient_data": len(energy_data) >= 12,
        "data_points": len(energy_data)
    }

# ==================== GOALS ENDPOINTS ====================

@api_router.post("/goals", response_model=GoalResponse)
async def create_goal(data: GoalCreate, current_user: dict = Depends(get_current_user)):
    # Calculate baseline if not provided
    baseline = data.baseline_emissions_kg
    if not baseline:
        # Get total emissions from last 30 days
        thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        activities = await db.activities.find({
            "organization_id": current_user["org_id"],
            "created_at": {"$gte": thirty_days_ago}
        }, {"_id": 0}).to_list(1000)
        baseline = sum(a.get("carbon_emission_kg", 0) for a in activities)
        if baseline == 0:
            baseline = 1000  # Default baseline
    
    goal_id = str(uuid.uuid4())
    goal_doc = {
        "id": goal_id,
        "organization_id": current_user["org_id"],
        "title": data.title,
        "description": data.description,
        "target_reduction_percent": data.target_reduction_percent,
        "target_date": data.target_date,
        "baseline_emissions_kg": baseline,
        "current_emissions_kg": baseline,
        "progress_percent": 0,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.goals.insert_one(goal_doc)
    return GoalResponse(**{k: v for k, v in goal_doc.items() if k != "_id"})

@api_router.get("/goals", response_model=List[GoalResponse])
async def get_goals(current_user: dict = Depends(get_current_user)):
    goals = await db.goals.find(
        {"organization_id": current_user["org_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Update current emissions and progress for each goal
    for goal in goals:
        activities = await db.activities.find({
            "organization_id": current_user["org_id"],
            "created_at": {"$gte": goal["created_at"]}
        }, {"_id": 0}).to_list(1000)
        
        current = sum(a.get("carbon_emission_kg", 0) for a in activities)
        goal["current_emissions_kg"] = current
        
        if goal["baseline_emissions_kg"] > 0:
            reduction = ((goal["baseline_emissions_kg"] - current) / goal["baseline_emissions_kg"]) * 100
            goal["progress_percent"] = min(max(reduction / goal["target_reduction_percent"] * 100, 0), 100)
        
        if goal["progress_percent"] >= 100:
            goal["status"] = "completed"
    
    return [GoalResponse(**g) for g in goals]

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.goals.delete_one({
        "id": goal_id,
        "organization_id": current_user["org_id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted"}

# ==================== INSIGHTS ENDPOINTS ====================

@api_router.get("/insights/generate")
async def generate_insights(current_user: dict = Depends(get_current_user)):
    # Gather data
    activities = await db.activities.find(
        {"organization_id": current_user["org_id"]}, {"_id": 0}
    ).to_list(1000)
    
    energy_data = await db.energy_data.find(
        {"organization_id": current_user["org_id"]}, {"_id": 0}
    ).to_list(365)
    
    goals = await db.goals.find(
        {"organization_id": current_user["org_id"]}, {"_id": 0}
    ).to_list(100)
    
    # Calculate metrics
    total_emissions = sum(a.get("carbon_emission_kg", 0) for a in activities)
    total_energy_emissions = sum(e.get("carbon_emission_kg", 0) for e in energy_data)
    combined_emissions = total_emissions + total_energy_emissions
    
    # Emissions by category
    by_category = {}
    for a in activities:
        cat = a.get("activity_category", "other")
        by_category[cat] = by_category.get(cat, 0) + a.get("carbon_emission_kg", 0)
    
    # Trees saved equivalent
    trees_saved = combined_emissions / TREES_ABSORPTION_RATE if combined_emissions > 0 else 0
    
    # Calculate sustainability score
    completed_goals = len([g for g in goals if g.get("status") == "completed"])
    reduction_percent = 0
    if len(activities) > 30:
        recent = [a for a in activities[:30]]
        older = [a for a in activities[30:60]] if len(activities) > 60 else []
        if older:
            recent_total = sum(a.get("carbon_emission_kg", 0) for a in recent)
            older_total = sum(a.get("carbon_emission_kg", 0) for a in older)
            if older_total > 0:
                reduction_percent = ((older_total - recent_total) / older_total) * 100
    
    sustainability_score = calculate_sustainability_score(combined_emissions, reduction_percent, completed_goals)
    
    # Risk assessment
    risk_level = "low"
    risk_factors = []
    if combined_emissions > 10000:
        risk_level = "high"
        risk_factors.append("High total emissions")
    elif combined_emissions > 5000:
        risk_level = "medium"
        risk_factors.append("Moderate emissions level")
    
    top_category = max(by_category.items(), key=lambda x: x[1]) if by_category else ("none", 0)
    if top_category[1] > combined_emissions * 0.5:
        risk_factors.append(f"Heavy reliance on {top_category[0]} activities")
    
    # ROI calculation (estimated)
    total_cost = sum(a.get("cost", 0) or 0 for a in activities)
    cost_per_kg = total_cost / combined_emissions if combined_emissions > 0 else 0
    
    # Generate AI recommendations
    recommendations = []
    if EMERGENT_LLM_KEY and activities:
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"insights-{current_user['org_id']}-{datetime.now().strftime('%Y%m%d%H')}",
                system_message="You are a sustainability expert for NGOs. Provide actionable, cost-effective recommendations."
            ).with_model("openai", "gpt-5.2")
            
            prompt = f"""Analyze this NGO's carbon footprint and provide recommendations:

Total Emissions: {combined_emissions:.2f} kg CO2
Emissions by Category: {by_category}
Top Emitting Category: {top_category[0]} ({top_category[1]:.2f} kg)
Total Activities: {len(activities)}
Sustainability Score: {sustainability_score:.0f}/100
Risk Level: {risk_level}

Provide exactly 5 specific, actionable recommendations to reduce emissions. Each should be a single sentence. Focus on cost-effective solutions suitable for NGOs with limited budgets. Return as a JSON array of strings."""

            response = await chat.send_message(UserMessage(text=prompt))
            
            import json
            try:
                recommendations = json.loads(response)
                if not isinstance(recommendations, list):
                    recommendations = [response]
            except:
                recommendations = [
                    "Consider switching to electric or hybrid vehicles for travel activities",
                    f"Reduce {top_category[0]} emissions by 20% through efficiency improvements",
                    "Implement virtual meetings to reduce event-related travel",
                    "Install energy monitoring systems to track consumption in real-time",
                    "Set monthly emission reduction targets for each department"
                ]
        except Exception as e:
            logging.error(f"AI insights error: {e}")
            recommendations = [
                "Review travel policies to prioritize low-emission options",
                "Consider renewable energy sources for infrastructure",
                "Optimize event planning to reduce catering waste",
                "Implement digital-first marketing strategies",
                "Track and report emissions monthly for better awareness"
            ]
    else:
        recommendations = [
            "Start tracking activities to get personalized recommendations",
            "Add energy consumption data for comprehensive analysis",
            "Set emission reduction goals to improve sustainability score"
        ]
    
    return {
        "total_emissions_kg": round(combined_emissions, 2),
        "activity_emissions_kg": round(total_emissions, 2),
        "energy_emissions_kg": round(total_energy_emissions, 2),
        "emissions_by_category": {k: round(v, 2) for k, v in by_category.items()},
        "trees_saved_equivalent": round(trees_saved, 1),
        "sustainability_score": round(sustainability_score, 0),
        "risk_assessment": {
            "level": risk_level,
            "factors": risk_factors
        },
        "roi_metrics": {
            "total_cost_tracked": round(total_cost, 2),
            "cost_per_kg_co2": round(cost_per_kg, 2),
            "potential_savings_percent": 15 if combined_emissions > 1000 else 5
        },
        "recommendations": recommendations,
        "data_summary": {
            "total_activities": len(activities),
            "energy_data_points": len(energy_data),
            "active_goals": len([g for g in goals if g.get("status") == "active"]),
            "completed_goals": completed_goals
        }
    }

@api_router.get("/insights/report")
async def generate_report(current_user: dict = Depends(get_current_user)):
    # Get all data
    org = await db.organizations.find_one({"id": current_user["org_id"]}, {"_id": 0})
    activities = await db.activities.find(
        {"organization_id": current_user["org_id"]}, {"_id": 0}
    ).to_list(1000)
    energy_data = await db.energy_data.find(
        {"organization_id": current_user["org_id"]}, {"_id": 0}
    ).to_list(365)
    goals = await db.goals.find(
        {"organization_id": current_user["org_id"]}, {"_id": 0}
    ).to_list(100)
    
    # Calculate all metrics
    total_emissions = sum(a.get("carbon_emission_kg", 0) for a in activities)
    total_energy_emissions = sum(e.get("carbon_emission_kg", 0) for e in energy_data)
    combined_emissions = total_emissions + total_energy_emissions
    
    by_category = {}
    for a in activities:
        cat = a.get("activity_category", "other")
        by_category[cat] = by_category.get(cat, 0) + a.get("carbon_emission_kg", 0)
    
    # Monthly breakdown
    monthly_data = {}
    for a in activities:
        month = a.get("date", "")[:7]
        if month:
            monthly_data[month] = monthly_data.get(month, 0) + a.get("carbon_emission_kg", 0)
    
    trees_saved = combined_emissions / TREES_ABSORPTION_RATE if combined_emissions > 0 else 0
    
    completed_goals = len([g for g in goals if g.get("status") == "completed"])
    sustainability_score = calculate_sustainability_score(combined_emissions, 0, completed_goals)
    
    report = {
        "report_date": datetime.now(timezone.utc).isoformat(),
        "organization": org.get("name", "Unknown") if org else "Unknown",
        "period": {
            "start": activities[-1].get("date", "") if activities else "",
            "end": activities[0].get("date", "") if activities else ""
        },
        "executive_summary": {
            "total_carbon_footprint_kg": round(combined_emissions, 2),
            "total_activities_tracked": len(activities),
            "sustainability_score": round(sustainability_score, 0),
            "trees_equivalent": round(trees_saved, 1),
            "top_emission_source": max(by_category.items(), key=lambda x: x[1])[0] if by_category else "N/A"
        },
        "emissions_breakdown": {
            "by_category": {k: round(v, 2) for k, v in by_category.items()},
            "by_month": {k: round(v, 2) for k, v in sorted(monthly_data.items())},
            "activity_emissions": round(total_emissions, 2),
            "energy_emissions": round(total_energy_emissions, 2)
        },
        "goals_progress": {
            "active": len([g for g in goals if g.get("status") == "active"]),
            "completed": completed_goals,
            "goals": [{"title": g["title"], "progress": g.get("progress_percent", 0)} for g in goals[:5]]
        },
        "recommendations": [
            "Continue tracking all activities for comprehensive reporting",
            "Focus on reducing emissions in top categories",
            "Set achievable monthly reduction targets",
            "Consider carbon offset programs for remaining emissions"
        ]
    }
    
    return report

# ==================== DASHBOARD ENDPOINTS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    activities = await db.activities.find(
        {"organization_id": current_user["org_id"]}, {"_id": 0}
    ).to_list(1000)
    
    energy_data = await db.energy_data.find(
        {"organization_id": current_user["org_id"]}, {"_id": 0}
    ).to_list(365)
    
    goals = await db.goals.find(
        {"organization_id": current_user["org_id"]}, {"_id": 0}
    ).to_list(100)
    
    # Calculate totals
    activity_emissions = sum(a.get("carbon_emission_kg", 0) for a in activities)
    energy_emissions = sum(e.get("carbon_emission_kg", 0) for e in energy_data)
    total_emissions = activity_emissions + energy_emissions
    
    # By category
    by_category = {"energy": energy_emissions}
    for a in activities:
        cat = a.get("activity_category", "other")
        by_category[cat] = by_category.get(cat, 0) + a.get("carbon_emission_kg", 0)
    
    # Monthly trend
    monthly = {}
    for a in activities:
        month = a.get("date", "")[:7]
        if month:
            monthly[month] = monthly.get(month, 0) + a.get("carbon_emission_kg", 0)
    for e in energy_data:
        month = e.get("date", "")[:7]
        if month:
            monthly[month] = monthly.get(month, 0) + e.get("carbon_emission_kg", 0)
    
    monthly_trend = [{"month": k, "emissions": round(v, 2)} for k, v in sorted(monthly.items())[-12:]]
    
    # Goals
    active_goals = len([g for g in goals if g.get("status") == "active"])
    completed_goals = len([g for g in goals if g.get("status") == "completed"])
    
    # Sustainability score
    sustainability_score = calculate_sustainability_score(total_emissions, 0, completed_goals)
    
    return {
        "total_emissions_kg": round(total_emissions, 2),
        "total_activities": len(activities),
        "emissions_by_category": {k: round(v, 2) for k, v in by_category.items()},
        "monthly_trend": monthly_trend,
        "trees_saved_equivalent": round(total_emissions / TREES_ABSORPTION_RATE, 1) if total_emissions > 0 else 0,
        "sustainability_score": round(sustainability_score, 0),
        "active_goals": active_goals,
        "completed_goals": completed_goals
    }

@api_router.get("/dashboard/leaderboard")
async def get_leaderboard(current_user: dict = Depends(get_current_user)):
    # Get all organizations and their emissions
    orgs = await db.organizations.find({}, {"_id": 0}).to_list(100)
    
    leaderboard = []
    for org in orgs:
        activities = await db.activities.find(
            {"organization_id": org["id"]}, {"_id": 0}
        ).to_list(1000)
        
        total_emissions = sum(a.get("carbon_emission_kg", 0) for a in activities)
        
        # Calculate reduction (simplified - comparing recent vs older)
        reduction_percent = 0
        if len(activities) > 30:
            recent = sum(a.get("carbon_emission_kg", 0) for a in activities[:15])
            older = sum(a.get("carbon_emission_kg", 0) for a in activities[15:30])
            if older > 0:
                reduction_percent = max(((older - recent) / older) * 100, 0)
        
        leaderboard.append({
            "organization_id": org["id"],
            "organization_name": org["name"],
            "total_emissions_kg": round(total_emissions, 2),
            "reduction_percent": round(reduction_percent, 1)
        })
    
    # Sort by reduction percentage (higher is better) and then by lower emissions
    leaderboard.sort(key=lambda x: (-x["reduction_percent"], x["total_emissions_kg"]))
    
    # Add ranks
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1
    
    return leaderboard[:20]

# ==================== EMISSION FACTORS ENDPOINT ====================

@api_router.get("/emission-factors")
async def get_emission_factors():
    return EMISSION_FACTORS

# ==================== ROOT AND HEALTH ====================

@api_router.get("/")
async def root():
    return {"message": "EcoPulse NGO Sustainability Platform API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
