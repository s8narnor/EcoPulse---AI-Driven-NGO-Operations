# EcoPulse NGO Sustainability Platform - Product Requirements Document

## Original Problem Statement
Build an AI-driven sustainability intelligence system for NGOs to track, predict, and optimize their environmental footprint. The platform should help NGOs with decision intelligence, carbon emission forecasting, investment prioritization, and operational optimization.

## Architecture & Technology Stack
- **Backend**: FastAPI + MongoDB + Emergent LLM Integration (GPT-5.2)
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts
- **Authentication**: JWT-based custom auth
- **AI Integration**: GPT-5.2 for recommendations and energy forecasting

## User Personas
1. **NGO Administrator**: Manages organization sustainability reporting
2. **Sustainability Officer**: Tracks activities and monitors emissions
3. **Program Manager**: Logs activity data and reviews insights

## Core Requirements (Static)
1. Activity-based carbon emission tracking with auto-calculation
2. Energy tracking with AI-powered forecasting
3. Dashboard with sustainability metrics and leaderboard
4. Insights page with Trees Saved, Risk Monitor, Sustainability Score, ROI
5. Smart Planner for emission reduction goals
6. Downloadable sustainability reports

## What's Been Implemented (Feb 8, 2026)
- ✅ Complete backend API with all endpoints
- ✅ JWT authentication (register, login, logout)
- ✅ Activity tracking for 6 categories: Travel, Events, Infrastructure, Marketing, Office, Staff Welfare
- ✅ Staff Welfare sub-categories: Health & Wellness, Recreation, Uniforms & Safety
- ✅ Automatic carbon emission calculation using emission factors
- ✅ Energy data tracking with indoor/outdoor factors
- ✅ AI-powered energy forecasting (GPT-5.2)
- ✅ AI-powered sustainability recommendations
- ✅ Dashboard with stats, charts, and leaderboard
- ✅ Insights page with all metrics (Trees Saved, Sustainability Score, Risk Monitor, ROI)
- ✅ Report download functionality
- ✅ Smart Planner for goals with progress tracking
- ✅ Responsive UI with Organic & Earthy design theme

## Emission Factors Implemented
- Travel: Petrol/Diesel/Electric/Hybrid cars, Motorcycle, Bus, Train, Flights
- Events: Indoor/Outdoor conferences, Virtual meetings, Workshops, etc.
- Infrastructure: Electricity, Generator, Solar, AC, Heating, Lighting, Computers
- Marketing: Digital campaigns, Email, Social media, Print materials
- Office: Phone, Internet, Paper, Courier services
- Staff Welfare: Gym, Health checkups, Team outings, Parties, Uniforms, PPE

## Prioritized Backlog
### P0 (Critical)
- None remaining - MVP complete

### P1 (High)
- Multi-user organization management
- Data export to CSV/Excel
- Email notifications for goal progress

### P2 (Medium)
- Carbon offset program integration
- Historical data comparison views
- Activity import from CSV
- Custom emission factor configuration

## Next Tasks
1. Consider adding automated data collection integrations
2. Implement notification system for goal milestones
3. Add more detailed reporting with PDF export
4. Consider API integrations with common NGO tools
