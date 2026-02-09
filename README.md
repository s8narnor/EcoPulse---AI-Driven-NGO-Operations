# EcoPulse - AI-Driven NGO Operations
<img width="1133" height="826" alt="banner" src="https://github.com/user-attachments/assets/0c780d78-ffee-4e91-b69e-984c1500bc44" />

## Clone and setup
- git clone https://github.com/s8narnor/EcoPulse---AI-Driven-NGO-Operations.git
- cd ecopulse-ngo

## Backend
- cd backend
- python -m venv venv && source venv/bin/activate
- pip install -r requirements.txt
- cp .env.example .env  # Edit with your values 

- uvicorn server:app --host 0.0.0.0 --port 8001 --reload

### Environment Variables Required for Deployment:
- MONGO_URL - MongoDB connection string
- DB_NAME - Database name
- JWT_SECRET - Strong secret key for JWT tokens
- EMERGENT_LLM_KEY - For GPT-5.2 AI features
- CORS_ORIGINS - Allowed origins (defaults to *)
- REACT_APP_BACKEND_URL - Backend API URL for frontend

## Frontend (new terminal)
- cd frontend
- yarn install
- cp .env.example .env  # Edit with your values
- yarn start

### Access at http://localhost:3000

