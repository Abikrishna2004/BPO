from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import json
import uvicorn
from contextlib import asynccontextmanager
from database import engine, Base, get_db
from sqlalchemy.orm import Session
import models

# Create Tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Startup: BPO System Backend Initiated")
    yield
    print("Shutdown: BPO System Backend Stopped")

app = FastAPI(title="Jourvix BPO System", version="1.0.0", lifespan=lifespan)

from fastapi.staticfiles import StaticFiles
import os

# Create uploads dir if not exists
if not os.path.exists("uploads"):
    os.makedirs("uploads")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

@app.get("/")
def read_root():
    return {"message": "Welcome to Jourvix BPO Realtime System"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast received message to all connected clients (Simulating real-time updates)
            await manager.broadcast(f"Realtime Update: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast("A client disconnected")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
