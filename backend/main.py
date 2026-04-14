from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn
from mangum import Mangum
from contextlib import asynccontextmanager
from database import get_db, client, settings
from fastapi.staticfiles import StaticFiles
import os
import sys

# Path adjustment for Vercel monorepo deployments
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Startup: BPO System MongoDB Atlas Connection Initiated (PyMongo)")
    print("--- REGISTERED ROUTES ---")
    for route in app.routes:
        print(f"ROUTE: {route.path} {getattr(route, 'methods', '')}")
    print("-------------------------")
    yield
    if client:
        client.close()
    print("Shutdown: BPO System Backend Stopped")

app = FastAPI(title="Jourvix BPO System", version="1.0.0", lifespan=lifespan)

# Create uploads dir if not exists (handling potentially read-only serverless filesystems)
try:
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
except Exception as e:
    print(f"Warning: Could not create uploads directory: {e}")

# CORS
default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://jourvix-prime.web.app",
    "https://jourvix-3b55d.web.app",
    "https://jourvix-3b55d.firebaseapp.com"
]

if settings.CORS_ORIGINS and settings.CORS_ORIGINS != "*":
    origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
    # Add defaults if not present
    for d in default_origins:
        if d not in origins:
            origins.append(d)
elif settings.CORS_ORIGINS == "*":
    origins = ["*"]
else:
    origins = default_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

from routes import router as api_router
app.include_router(api_router, prefix="/api")

# WebSocket Manager
from websocket_manager import manager

@app.get("/api/status")
def api_status():
    return {"status": "operational", "version": "1.0.1"}

@app.get("/")
def read_root():
    return {"message": "Welcome to Jourvix BPO Realtime System"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Realtime Update: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast("A client disconnected")

# 👇 THIS is required for Vercel
handler = Mangum(app)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
