# JOURVIX - Anti-Gravity BPO Management System

## Project Identity
**Application Name:** Jourvix  
**Theme:** Futuristic Anti-Gravity UI (Dark Mode, Neon, Glassmorphism)  
**Stack:** Python (FastAPI), React.js (Vite + Tailwind), SQLite/PostgreSQL

- Python 3.8+
- Node.js 16+
- SQLite (default) or PostgreSQL

## Setup Instructions

### 1. Environment Configuration
Copy the `.env.example` files in both `backend/` and `frontend/` to `.env` and configure your credentials.

### 2. Backend Setup
1. Open a terminal.
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### 3. Frontend Setup
1. Open a new terminal.
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The UI will be available at `http://localhost:5173`.

## Architecture
- **Backend**: FastAPI with async Motor driver for MongoDB. WebSockets are enabled at `/ws`.
- **Frontend**: React with Tailwind CSS. configured with `tailwind.config.js` for custom neon colors.
- **Real-time**: WebSocket connection is established in `Dashboard.jsx`.

## Project Structure
- `/backend`: API, Models, Database logic.
- `/frontend`: React application.
  - `/src/components`: Reusable UI components.
  - `/src/pages`: Application pages (Dashboard, Login).
  - `/src/index.css`: Global styles and Tailwind imports.
