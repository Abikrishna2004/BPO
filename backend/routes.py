<<<<<<< HEAD
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from sqlalchemy.orm import Session
=======
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from datetime import datetime, date as date_type, timedelta
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f
from database import get_db
import models
import auth
from pydantic import BaseModel
from typing import List, Optional
from fastapi.security import OAuth2PasswordRequestForm
import json
<<<<<<< HEAD
=======
import shutil
import os
import uuid
from bson import ObjectId
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f

router = APIRouter()

@router.get("/status")
def router_status():
    return {"status": "submodule_operational"}

<<<<<<< HEAD
def calculate_efficiency(db: Session, user_id: int) -> float:
    # Base Score
    base_score = 50.0

    # 1. Attendance (Pos: +20 max, Neg: -5 per absent day)
    total_days = db.query(models.Attendance).filter(models.Attendance.user_id == user_id).count()
    present_days = db.query(models.Attendance).filter(models.Attendance.user_id == user_id, models.Attendance.status == 'present').count()
    absent_days = db.query(models.Attendance).filter(models.Attendance.user_id == user_id, models.Attendance.status == 'absent').count()
    
    att_score = 0
    if total_days > 0:
        att_score = (present_days / total_days) * 20
    
    # Penalty: Heavy reduction for absence
    att_penalty = absent_days * 5

    # 2. Task Completion (Pos: +30 max, Neg: Late/Overdue)
    c_tasks = db.query(models.Task).filter(models.Task.agent_id == user_id, models.Task.status == "completed").all()
    p_tasks = db.query(models.Task).filter(models.Task.agent_id == user_id, models.Task.status == "pending").all()
    
    c_count = len(c_tasks)
    p_count = len(p_tasks)
    total_tasks = c_count + p_count
    
    task_score = 0
    if total_tasks > 0:
        task_score = (c_count / total_tasks) * 30

    # Speed Bonus & Late Penalties
    speed_bonus = 0
    late_penalty = 0
    
    # Completed Tasks: Bonus for early, Penalty for late
    for t in c_tasks:
        if t.deadline and t.completed_at:
            if t.completed_at < t.deadline:
                # Early: +0.5 per hour
                delta = t.deadline - t.completed_at
                hours_saved = delta.total_seconds() / 3600
                speed_bonus += hours_saved * 0.5
            else:
                # Late: -5 flat per late task
                late_penalty += 5

    # Pending Tasks: Penalty if overdue
    now = datetime.now()
    for t in p_tasks:
        if t.deadline and t.deadline < now:
            # Overdue: -10 flat (High negative impact)
            late_penalty += 10

    # 3. Achievements (Positive boost)
    ach_count = db.query(models.Achievement).filter(models.Achievement.user_id == user_id).count()
    ach_score = ach_count * 5 # Increased value

    # 4. Call Effort (Active Time) (Max 20)
    # Assumes 8hr shift per present day
    calls = db.query(models.Call).filter(models.Call.agent_id == user_id, models.Call.status == "completed").all()
    total_call_seconds = sum([(c.end_time - c.start_time).total_seconds() for c in calls if c.end_time and c.start_time])
    expected_seconds = present_days * 8 * 3600
    call_score = 0
    if expected_seconds > 0:
        call_score = (total_call_seconds / expected_seconds) * 20
    
    # Final Calculation
    # Cap between 0 and 100 (or allow >100 for super performance?)
    # User said "negative is high", implies it drops score.
    
    total_eff = base_score + att_score + task_score + speed_bonus + ach_score + call_score - att_penalty - late_penalty
    
    if total_eff < 0: total_eff = 0
    # if total_eff > 100: total_eff = 100 # Allow > 100 to show 'super' efficiency? Let's cap at 100 for UI bars.
    if total_eff > 100: total_eff = 100

    return round(total_eff, 2)
=======
# Helper to serialize Mongo docs
def fix_id(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

def fix_ids(docs):
    return [fix_id(doc) for doc in docs]

# Pymongo is synchronous, removal of 'await' for database operations
def calculate_efficiency(db, user_id: str) -> float:
    """
    Efficiency Logic:
    - Base Efficiency: 25.0
    - Level Up: +1.0 Efficiency for every 100 XP
    - XP Source: performance_score
    """
    u_id = str(user_id)
    user = db.users.find_one({"_id": ObjectId(u_id)})
    if not user: return 25.0
    
    total_xp = user.get("performance_score", 0)
    
    # Efficiency starts at 25 and increases by 1 per 100 XP
    efficiency = 25.0 + (total_xp // 100)
    
    return float(efficiency)

def get_next_role(current_role: str):
    hierarchy = ["agent", "senior_agent", "lead_agent", "supervisor", "manager"]
    try:
        idx = hierarchy.index(current_role.lower())
        if idx < len(hierarchy) - 1:
            return hierarchy[idx + 1]
    except ValueError:
        return "agent"
    return None

async def check_and_apply_automatic_promotion(db, user):
    efficiency = calculate_efficiency(db, str(user["_id"]))
    level_milestone = int(efficiency)
    
    # 1. Performance Bonus (Every 100 XP / Every Level)
    last_bonus_level = user.get("last_bonus_level", 25)
    if level_milestone > last_bonus_level:
        # Fetch bonus amount from settings
        setting = db.settings.find_one({"key": "performance_bonus_amount"})
        bonus_val = float(setting["value"]) if setting and setting.get("value") else 1000.0
        
        db.users.update_one(
            {"_id": user["_id"]},
            {"$inc": {"salary": bonus_val}, "$set": {"last_bonus_level": level_milestone}}
        )
        await create_log(db, f"PERFORMANCE BONUS: {user['username']} reached Level {level_milestone}. Bonus of ₹{bonus_val} added to salary.", user_id=str(user["_id"]))

    # 2. Automatic Role Promotion (Every 5 Levels starting from 30)
    if efficiency >= 30 and user.get("role") != "admin":
        current_role = user.get("role", "agent")
        next_role = get_next_role(current_role)
        last_promo_level = user.get("last_promotion_level", 25)
        
        if level_milestone >= last_promo_level + 5 and next_role:
            db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"role": next_role, "last_promotion_level": level_milestone}, "$inc": {"salary": 5000}}
            )
            await create_log(db, f"SYSTEM_AUTO_PROMO: {user['username']} promoted to {next_role.upper()} for reaching Efficiency {level_milestone}", user_id=str(user["_id"]))
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "agent"

class UserResponse(BaseModel):
    id: str
    username: str
    display_name: Optional[str] = None
    role: str
    status: str
<<<<<<< HEAD
    performance_score: Optional[int] = 0
    completed_tasks: Optional[int] = 0
    pending_tasks: Optional[int] = 0
    present_days: Optional[int] = 0
    attendance_rate: Optional[float] = 0.0
    efficiency: Optional[float] = 0.0
    salary: Optional[float] = 0.0
=======
    performance_score: int = 0
    completed_tasks: int = 0
    pending_tasks: int = 0
    present_days: int = 0
    attendance_rate: float = 0.0
    efficiency: float = 0.0
    salary: float = 0.0
    profile_photo: Optional[str] = None
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f
    last_active: Optional[datetime] = None

class UserPerformanceResponse(BaseModel):
    username: str
    salary: float
    performance_score: int
    completed_tasks: int
    pending_tasks: int
    attendance_rate: float
    efficiency: float

class AttendanceResponse(BaseModel):
<<<<<<< HEAD
    id: int
    user_id: int
    date: date_type
=======
    id: str
    user_id: str
    date: str
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f
    status: str
    marked_by: Optional[str] = None

class LogResponse(BaseModel):
    id: str
    message: str
    created_at: datetime

from websocket_manager import manager

async def create_log(db, message: str, user_id: Optional[str] = None):
    # Synchronous insert_one
    log_doc = {"message": message, "user_id": user_id, "created_at": datetime.now()}
    db.system_logs.insert_one(log_doc)
    # Manager broadcast is still async (websocket based)
    await manager.broadcast(message)

<<<<<<< HEAD
# GET Logs Endpoint
@router.get("/logs", response_model=List[LogResponse])
def get_logs(user_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.SystemLog)
    
    if current_user.role == "admin":
        if user_id:
            # Filter by specific user if requested
            query = query.filter(models.SystemLog.user_id == user_id)
        # Admin sees everything (limit 50)
        return query.order_by(models.SystemLog.created_at.desc()).limit(50).all()
    else:
        # Employee sees global messages (user_id=None) OR their own messages
        return query.filter(
            (models.SystemLog.user_id == current_user.id) | (models.SystemLog.user_id == None)
        ).order_by(models.SystemLog.created_at.desc()).limit(20).all()
=======
# Task response models
class TaskResponse(BaseModel):
    id: str
    title: str
    description: str
    status: str
    created_at: Optional[datetime] = None
    deadline: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completion_notes: Optional[str] = None
    attachments: Optional[str] = None
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f

@router.get("/logs", response_model=List[LogResponse])
async def get_logs(user_id: Optional[str] = None, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    query = {}
    if current_user["role"] == "admin":
        if user_id: query["user_id"] = user_id
        cursor = db.system_logs.find(query).sort("created_at", -1).limit(50)
    else:
        query = {"$or": [{"user_id": current_user["id"]}, {"user_id": None}]}
        cursor = db.system_logs.find(query).sort("created_at", -1).limit(20)
    
    logs = list(cursor)
    return fix_ids(logs)

@router.post("/report/daily")
async def submit_daily_report(report: dict, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    msg = f"DAILY REPORT from {current_user['username']}: {report.get('summary', '')}"
    await create_log(db, msg, user_id=current_user["id"])
    return {"message": "Daily report submitted"}

@router.get("/dashboard/agents", response_model=List[UserResponse])
<<<<<<< HEAD
def get_agents_status(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == "agent":
=======
async def get_agents_status(db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    if current_user["role"] == "agent":
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f
         raise HTTPException(status_code=403, detail="Forbidden")
    
    users = list(db.users.find({"_id": {"$ne": ObjectId(current_user["id"])}}))

    results = []
    for user in users:
        u_id = str(user["_id"])
        task_query = {"$or": [{"agent_id": u_id}, {"agent_id": ObjectId(u_id)}]}
        c_tasks = db.tasks.count_documents({**task_query, "status": "completed"})
        p_tasks = db.tasks.count_documents({**task_query, "status": "pending"})
        total_days = db.attendance.count_documents({"user_id": u_id})
        present_count = db.attendance.count_documents({"user_id": u_id, "status": "present"})
        rate = round((present_count / total_days * 100), 1) if total_days > 0 else 0.0
        eff = calculate_efficiency(db, u_id)
        
        latest_log = db.system_logs.find_one({"user_id": u_id}, sort=[("created_at", -1)])
        last_active = latest_log["created_at"] if latest_log else user.get("created_at")

        results.append(UserResponse(
            id=u_id,
            username=user["username"],
            role=user["role"],
            status=user["status"],
            performance_score=user.get("performance_score", 0),
            completed_tasks=c_tasks,
            pending_tasks=p_tasks,
            present_days=present_count,
            attendance_rate=rate,
            efficiency=eff,
            salary=user.get("salary", 0.0),
            last_active=last_active
        ))
    return results

@router.post("/register", response_model=UserResponse)
<<<<<<< HEAD
async def register(user: UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Only Admin can create new users
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create users"
        )
=======
async def register(user: UserCreate, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    if current_user["role"] != "admin": raise HTTPException(status_code=403)
    if db.users.find_one({"username": user.username}): raise HTTPException(status_code=400)
    
    new_user = {
        "username": user.username, "email": user.email, "hashed_password": auth.get_password_hash(user.password),
        "role": user.role, "status": "offline", "is_created": True, "salary": 50000.0,
        "performance_score": 0, "created_at": datetime.now()
    }
    res = db.users.insert_one(new_user)
    new_user["_id"] = res.inserted_id
    await create_log(db, f"New Agent Registered: {user.username}", user_id=str(res.inserted_id))
    return fix_id(new_user)
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f

@router.put("/users/profile", response_model=UserResponse)
async def update_profile(data: dict, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    u_id = current_user["id"]
    update_data = {}
    if "display_name" in data: update_data["display_name"] = data["display_name"]
    if "email" in data: update_data["email"] = data["email"]
    if "profile_photo" in data: update_data["profile_photo"] = data["profile_photo"]
    
    if update_data:
        db.users.update_one({"_id": ObjectId(u_id)}, {"$set": update_data})
    
<<<<<<< HEAD
    await create_log(db, f"New Agent Registered: {new_user.username}", user_id=new_user.id)
    
    return new_user

@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Broadcast Login Event
    if user.is_created:
         await create_log(db, f"Agent Logged In: {user.username}", user_id=user.id)

    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/attendance", response_model=AttendanceResponse)
async def mark_attendance(att: AttendanceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can mark attendance")
    
    today = datetime.now().date()
    target_user = db.query(models.User).filter(models.User.id == att.user_id).first()
    target_username = target_user.username if target_user else "Unknown"

    existing = db.query(models.Attendance).filter(
        models.Attendance.user_id == att.user_id,
        models.Attendance.date == today
    ).first()
=======
    user = db.users.find_one({"_id": ObjectId(u_id)})
    user["id"] = str(user["_id"])
    return user

@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    user = db.users.find_one({"username": form_data.username})
    if not user or not auth.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = auth.create_access_token(data={"sub": user["username"], "role": user["role"]}, expires_delta=expires)
    return {"access_token": token, "token_type": "bearer"}

@router.post("/attendance", response_model=AttendanceResponse)
async def mark_attendance(att: dict, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    if current_user["role"] != "admin": raise HTTPException(status_code=403)
    today = datetime.now().strftime("%Y-%m-%d")
    target_user = db.users.find_one({"_id": ObjectId(att["user_id"])})
    if not target_user: raise HTTPException(status_code=404)
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f
    
    existing = db.attendance.find_one({"user_id": att["user_id"], "date": today})
    if existing:
        db.attendance.update_one({"_id": existing["_id"]}, {"$set": {"status": att["status"], "marked_by": current_user["username"]}})
    else:
        db.attendance.insert_one({"user_id": att["user_id"], "status": att["status"], "date": today, "marked_by": current_user["username"]})
        # Check for streak on new mark
        if att["status"] == "present":
            # Get last 10 records
            history = list(db.attendance.find({"user_id": att["user_id"]}).sort("date", -1).limit(10))
            present_streak = 0
            for h in history:
                if h["status"] == "present": present_streak += 1
                else: break
            
            if present_streak > 0 and present_streak % 10 == 0:
                db.users.update_one({"_id": target_user["_id"]}, {"$inc": {"performance_score": 5}})
                await create_log(db, f"Attendance Streak! {target_user['username']} reached {present_streak} days (+5 XP)", user_id=att["user_id"])
    
    await create_log(db, f"Attendance: {target_user['username']} is now {att['status'].upper()}", user_id=att["user_id"])
    
    # Re-fetch user to check for auto-promotion after XP gain
    updated_user = db.users.find_one({"_id": target_user["_id"]})
    await check_and_apply_automatic_promotion(db, updated_user)
    
    ret = db.attendance.find_one({"user_id": att["user_id"], "date": today})
    return fix_id(ret)

@router.get("/users/me", response_model=UserResponse)
async def get_me(db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    u_id = current_user["id"]
    
    # SYSTEM: AUTOMATIC ATTENDANCE MARK ON LOGIN
    if current_user["role"] != "admin":
        today = datetime.now().strftime("%Y-%m-%d")
        existing = db.attendance.find_one({"user_id": u_id, "date": today})
        if not existing:
            db.attendance.insert_one({
                "user_id": u_id, "status": "present", "date": today, "marked_by": "SYSTEM_AUTO"
            })
            await create_log(db, f"Node Synchronized: {current_user['username']} marked PRESENT", user_id=u_id)

    c_tasks = db.tasks.count_documents({"agent_id": u_id, "status": "completed"})
    p_tasks = db.tasks.count_documents({"agent_id": u_id, "status": "pending"})
    total_days = db.attendance.count_documents({"user_id": u_id})
    present_days = db.attendance.count_documents({"user_id": u_id, "status": "present"})
    rate = round((present_days / total_days * 100), 1) if total_days > 0 else 0.0
    eff = calculate_efficiency(db, u_id)
    
    return UserResponse(
<<<<<<< HEAD
        id=current_user.id,
        username=current_user.username,
        display_name=current_user.display_name,
        role=current_user.role,
        status=current_user.status,
        performance_score=current_user.performance_score if current_user.performance_score else 0,
        completed_tasks=c_tasks,
        pending_tasks=p_tasks,
        attendance_rate=rate,
        efficiency=0.0,
        salary=current_user.salary if current_user.salary is not None else 0.0,
        last_active=None # Or implement last active logic
=======
        id=u_id, username=current_user["username"], email=current_user.get("email"), display_name=current_user.get("display_name"),
        role=current_user["role"], status=current_user["status"], 
        performance_score=current_user.get("performance_score", 0),
        completed_tasks=c_tasks, pending_tasks=p_tasks, attendance_rate=rate,
        efficiency=eff, salary=current_user.get("salary", 0.0),
        profile_photo=current_user.get("profile_photo")
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f
    )

@router.post("/calls/start")
async def start_call(call: dict, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    db.users.update_one({"_id": ObjectId(current_user["id"])}, {"$set": {"status": "on_call"}})
    res = db.calls.insert_one({
        "customer_name": call["customer_name"], "customer_number": call["customer_number"],
        "agent_id": current_user["id"], "status": "active", "start_time": datetime.now()
    })
    return {"message": "Call started", "call_id": str(res.inserted_id)}

@router.post("/calls/{call_id}/end")
async def end_call(call_id: str, notes: str, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    db.calls.update_one({"_id": ObjectId(call_id)}, {"$set": {"end_time": datetime.now(), "status": "completed", "notes": notes}})
    db.users.update_one({"_id": ObjectId(current_user["id"])}, {"$set": {"status": "available"}})
    return {"message": "Call ended"}

<<<<<<< HEAD
@router.get("/attendance", response_model=List[AttendanceResponse])
def get_attendance(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    today = datetime.now().date()
    if current_user.role == "admin":
        return db.query(models.Attendance).filter(models.Attendance.date == today).all()
    else:
        return db.query(models.Attendance).filter(
            models.Attendance.user_id == current_user.id,
            models.Attendance.date == today
        ).all()

@router.get("/attendance/history/{user_id}", response_model=List[AttendanceResponse])
def get_attendance_history(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    today = datetime.now().date()
    if current_user.role == "agent" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return db.query(models.Attendance).filter(models.Attendance.user_id == user_id).order_by(models.Attendance.date.desc()).limit(30).all()

# User Management (Delete & Password)
@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
    
    # Optional: Prevent deleting self or default admins if needed
    if user.id == current_user.id:
         raise HTTPException(status_code=400, detail="Cannot delete yourself")

    db.delete(user)
    db.commit()
=======
@router.get("/attendance")
async def get_att(db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    today = datetime.now().strftime("%Y-%m-%d")
    q = {"date": today}
    if current_user["role"] != "admin": q["user_id"] = current_user["id"]
    return fix_ids(list(db.attendance.find(q)))

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    if current_user["role"] != "admin": raise HTTPException(status_code=403)
    db.users.delete_one({"_id": ObjectId(user_id)})
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f
    return {"message": "User deleted"}

@router.put("/users/{user_id}/promote")
async def promote_user(user_id: str, promo: dict, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    if current_user["role"] != "admin": raise HTTPException(status_code=403)
    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": promo})
    u = db.users.find_one({"_id": ObjectId(user_id)})
    await create_log(db, f"SYSTEM_PROMO: {u['username']} rewarded - Salary: {u['salary']}, Role: {u['role']}", user_id=user_id)
    return {"message": "Success"}

<<<<<<< HEAD
class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    created_at: datetime
    deadline: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completion_notes: Optional[str] = None
    attachments: Optional[str] = None # Added for response

    class Config:
        from_attributes = True

# Task Routes
@router.post("/tasks", response_model=TaskResponse)
async def assign_task(task: TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only Admins can assign tasks")
=======
@router.post("/tasks", response_model=TaskResponse)
async def assign_task(task: dict, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    if current_user["role"] != "admin": raise HTTPException(status_code=403)
    new_task = task
    new_task["status"] = "pending"
    new_task["created_at"] = datetime.now()
    # Ensure agent_id is stored as string for consistency across lookups
    new_task["agent_id"] = str(task.get("agent_id", ""))
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f
    
    res = db.tasks.insert_one(new_task)
    new_task["_id"] = res.inserted_id
    
    try:
        agent = db.users.find_one({"_id": ObjectId(new_task["agent_id"])})
        if agent:
            await create_log(db, f"New Task for {agent['username']}: {task['title']}", user_id=str(agent["_id"]))
    except: pass
    
    return fix_id(new_task)

@router.get("/tasks/my", response_model=List[TaskResponse])
<<<<<<< HEAD
def get_my_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    tasks = db.query(models.Task).filter(models.Task.agent_id == current_user.id).all()
    print(f"DEBUG: get_my_tasks for {current_user.username} (ID: {current_user.id}) - Found {len(tasks)} tasks")
    return tasks

@router.get("/tasks/user/{user_id}", response_model=List[TaskResponse])
def get_user_tasks(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == "agent" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    tasks = db.query(models.Task).filter(models.Task.agent_id == user_id).order_by(models.Task.phase_num.asc(), models.Task.created_at.desc()).all()
    print(f"DEBUG: get_user_tasks for user_id={user_id} requested by {current_user.username} - Found {len(tasks)} tasks")
    try:
        with open("admin_task_debug.txt", "a") as f:
            f.write(f"Fetch by {current_user.username} for target {user_id} - Found {len(tasks)} tasks\n")
    except Exception:
        pass
    return tasks

class TaskCompletion(BaseModel):
    notes: str
    attachments: List[str] = []

@router.put("/tasks/{task_id}/complete")
async def complete_task(task_id: int, completion: TaskCompletion, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.agent_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
=======
async def my_tasks(db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    u_id = current_user["id"]
    u_name = current_user["username"]
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f
    
    # SYSTEM DIAGNOSTIC: Search for both ID and Username to catch mismatch
    query = {
        "$or": [
            {"agent_id": u_id}, 
            {"agent_id": u_name},
            {"agent_id": str(u_id)}
        ],
        "status": {"$ne": "deleted"}
    }
    
<<<<<<< HEAD
    # Calculate score update
    score_change = 5
    is_late = False
    days_late = 0

    # Determine applicable deadline (Task specific > Project specific)
    deadline = task.deadline
    if not deadline and task.project_id:
        project = db.query(models.Project).filter(models.Project.id == task.project_id).first()
        if project: deadline = project.deadline
    
    # Check deadline
    if deadline and task.completed_at > deadline:
        is_late = True
        delta = task.completed_at - deadline
        days_late = delta.days + 1 # At least 1 day late if passed
        
        # Penalty: -5 points per day late
        penalty = days_late * 5 
        score_change = -penalty 

    # Update User Score
    if current_user.performance_score is None:
        current_user.performance_score = 0
    
    current_user.performance_score += score_change
    
    # Cap score at 100, floor at 0
    if current_user.performance_score > 100: current_user.performance_score = 100
    if current_user.performance_score < 0: current_user.performance_score = 0
    
    # Check for Bonus Eligibility (100%)
    bonus_awarded = False
    bonus_msg = ""
    if current_user.performance_score == 100:
        # Check if bonus already awarded this month
        today = datetime.now()
        start_of_month = datetime(today.year, today.month, 1)
        
        existing_bonus = db.query(models.Achievement).filter(
            models.Achievement.user_id == current_user.id,
            models.Achievement.type == "bonus", # or "increment"
            models.Achievement.date_awarded >= start_of_month
        ).first()
        
        if not existing_bonus:
            # Award Bonus!
            # Get settings
            bonus_amount_setting = db.query(models.Setting).filter(models.Setting.key == "performance_bonus_amount").first()
            bonus_amount = int(bonus_amount_setting.value) if bonus_amount_setting else 1000 # Default 1000
            
            new_achievement = models.Achievement(
                user_id=current_user.id,
                title="100% Performance Bonus",
                description=f"Reached 100% Performance Score in {today.strftime('%B')}",
                type="bonus",
                amount=bonus_amount,
                date_awarded=datetime.now()
            )
            db.add(new_achievement)
            bonus_awarded = True
            bonus_msg = f" (BONUS AWARDED: ${bonus_amount})"
            
            # Log Promotion Eligibility?
            # User mentioned "promotion everything". Maybe trigger an alert?
            await create_log(db, f"ACHIEVEMENT: {current_user.username} reached 100% Performance! Bonus Awarded.", user_id=None) # Broadcast to all/admin

    db.commit()

    log_msg = f"Task Complete: {current_user.username} finished '{task.title}'"
    if is_late:
        log_msg += f" (LATE {days_late} DAYS! {score_change} XP)"
    else:
        log_msg += f" (+5 XP){bonus_msg}"

    await create_log(db, log_msg, user_id=current_user.id)
    return {"message": "Task completed" + bonus_msg}

@router.get("/performance/{user_id}", response_model=UserPerformanceResponse)
def get_performance(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Security: Only Admin or Self can view
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
        
    tasks_done = db.query(models.Task).filter(models.Task.agent_id == user_id, models.Task.status == "completed").count()
    tasks_pending = db.query(models.Task).filter(models.Task.agent_id == user_id, models.Task.status == "pending").count()
    
    today = datetime.now().date()
    
    # Correct attendance rate calculation
    total_days_marked = db.query(models.Attendance).filter(models.Attendance.user_id == user_id).count()
    days_present = db.query(models.Attendance).filter(models.Attendance.user_id == user_id, models.Attendance.status == 'present').count()
    
    rate = 0.0
    if total_days_marked > 0:
        rate = round((days_present / total_days_marked) * 100, 1)

    eff = calculate_efficiency(db, user_id)
    
    return UserPerformanceResponse(
        username=target.username,
        salary=target.salary,
        performance_score=target.performance_score,
        completed_tasks=tasks_done,
        pending_tasks=tasks_pending,
        attendance_rate=rate,
        efficiency=eff
    )

class HistoryTask(BaseModel):
    title: str
    project_title: Optional[str] = None
    status: str

class HistoryPoint(BaseModel):
    date: str
    tasks: int
    task_titles: List[str] # Keep for backward compat if needed, or remove
    task_details: List[HistoryTask]
    attendance: str # "present", "absent", "no_record"

@router.get("/performance/{user_id}/history", response_model=List[HistoryPoint])
def get_performance_history(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Last 30 days logic optimized
    history = []
    today = datetime.now().date()
    start_date = today - timedelta(days=29)
    
    # Fetch all tasks in range (completed)
    # Note: completed_at is datetime, we filter broadly then process
    tasks = db.query(models.Task).filter(
        models.Task.agent_id == user_id,
        models.Task.status == "completed",
        models.Task.completed_at >= start_date # Simple filter, fine if mixed tz, we refine below
    ).all()
    
    # Fetch all attendance in range
    attendance_records = db.query(models.Attendance).filter(
        models.Attendance.user_id == user_id,
        models.Attendance.date >= start_date
    ).all()
    
    att_map = {rec.date: rec.status for rec in attendance_records}
    
    # Get User Creation Date safely
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    creation_date = start_date
    try:
        if target_user and target_user.created_at:
            if isinstance(target_user.created_at, str):
                from dateutil import parser
                creation_date = parser.parse(target_user.created_at).date()
            else:
                creation_date = getattr(target_user.created_at, 'date', lambda: target_user.created_at)()
    except Exception as e:
        print(f"Error parsing creation date: {e}")

    # Iterate backwards 30 days
    try:
        for i in range(29, -1, -1):
            day = today - timedelta(days=i)
            
            # Skip if day is before creation date
            if day < creation_date:
                continue
            
            # Filter tasks for this day (local date match)
            day_tasks = []
            for t in tasks:
                # Add safety for completed_at
                try:
                    c_date = None
                    if t.completed_at:
                        if isinstance(t.completed_at, str):
                            from dateutil import parser
                            c_date = parser.parse(t.completed_at).date()
                        else:
                            c_date = getattr(t.completed_at, 'date', lambda: t.completed_at)()
                    
                    if c_date == day:
                        p_title = None
                        if t.project_id:
                            if t.project_relation:
                                p_title = t.project_relation.title
                        
                        # Safe handling for title/status
                        safe_title = t.title if t.title else "Untitled Task"
                        safe_status = t.status if t.status else "completed"

                        day_tasks.append(HistoryTask(
                            title=safe_title,
                            project_title=p_title,
                            status=safe_status
                        ))
                except Exception as e:
                    print(f"Error filtering tasks for day {day}: {e}")
            
            att_status = att_map.get(day, "no_record")
            
            # Debug match
            if att_status != "no_record":
               print(f"DEBUG: Found attendance for {day}: {att_status}")
            
            history.append(HistoryPoint(
                date=day.strftime("%b %d (%a)"), 
                tasks=len(day_tasks),
                task_titles=[t.title for t in day_tasks],
                task_details=day_tasks,
                attendance=att_status
            ))
            
        return history
=======
    try:
        tasks = list(db.tasks.find(query).sort("created_at", -1))
        return fix_ids(tasks)
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f
    except Exception as e:
        print(f"TASK FETCH ERROR: {e}")
        return []

<<<<<<< HEAD
@router.put("/users/{user_id}/password")
def update_password(user_id: int, pw: PasswordUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
=======
@router.get("/tasks/user/{user_id}", response_model=List[TaskResponse])
async def user_tasks(user_id: str, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    query = {"$or": [{"agent_id": user_id}, {"agent_id": ObjectId(user_id)}]}
    return fix_ids(list(db.tasks.find(query).sort("created_at", -1)))

@router.put("/tasks/{task_id}/complete")
async def finish_task(task_id: str, completion: dict, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    task = db.tasks.find_one({"_id": ObjectId(task_id)})
    if not task: raise HTTPException(status_code=404)
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f
    
    now = datetime.now()
    xp_gain = 3 # New requirement: +3 XP per task
    is_late = False
    
    # Strict Deadline Analysis
    if task.get("deadline"):
        deadline = task["deadline"]
        if isinstance(deadline, str):
            try: deadline = datetime.fromisoformat(deadline.replace('Z', '+00:00'))
            except: deadline = None
        
        if deadline and now.timestamp() > deadline.timestamp():
            xp_gain = -10 # Adjusted Penalty
            is_late = True
            
    db.tasks.update_one({"_id": ObjectId(task_id)}, {
        "$set": {"status": "completed", "completed_at": now, 
                 "completion_notes": completion.get("notes"), 
                 "attachments": json.dumps(completion.get("attachments", []))}
    })
    
<<<<<<< HEAD
    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    title: str
    description: str
    deadline: Optional[datetime] = None

@router.post("/projects", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
=======
    db.users.update_one({"_id": ObjectId(current_user["id"])}, {"$inc": {"performance_score": xp_gain}})
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f
    
    # Re-fetch user explicitly to check for auto-promotion
    updated_user = db.users.find_one({"_id": ObjectId(current_user["id"])})
    await check_and_apply_automatic_promotion(db, updated_user)
    
    status_msg = "LATE SUBMISSION" if is_late else "SUCCESSFUL UPLOAD"
    await create_log(db, f"Task {status_msg}: {current_user['username']} finished '{task['title']}' ({xp_gain} XP)", user_id=current_user["id"])
    return {"message": "Task completed", "xp_gain": xp_gain}

<<<<<<< HEAD
    db.commit()
    
    return {"message": f"Assigned {len(created_tasks)} tasks across {len(assignment.agent_ids)} agents for project {project.title}"}


# Achievements & Settings Endpoints
# ---------------------------------

class AchievementResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    type: str # "bonus", "increment", "promotion"
    amount: Optional[int]
    date_awarded: datetime

    class Config:
        from_attributes = True

@router.get("/users/{user_id}/achievements", response_model=List[AchievementResponse])
def get_user_achievements(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Achievement).filter(models.Achievement.user_id == user_id).order_by(models.Achievement.date_awarded.desc()).all()

@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, role_data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Simple admin check
    if current_user.role != "admin" and current_user.username != "Admin@CJ":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    new_role = role_data.get("role")
    if new_role:
        user.role = new_role
        db.commit()
    
    return {"message": "Role updated", "role": user.role}

@router.put("/users/{user_id}/salary")
def update_user_salary(user_id: int, data: SalaryUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.salary = data.salary
    db.commit()
    
    return {"message": "Salary updated", "salary": user.salary}

class SettingResponse(BaseModel):
    key: str
    value: str
    class Config: 
        from_attributes = True

class SettingUpdate(BaseModel):
    key: str
    value: str

@router.get("/settings", response_model=List[SettingResponse])
def get_settings(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Setting).all()

@router.post("/settings", response_model=SettingResponse)
def update_setting(setting: SettingUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing = db.query(models.Setting).filter(models.Setting.key == setting.key).first()
    if existing:
        existing.value = setting.value
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_setting = models.Setting(key=setting.key, value=setting.value)
        db.add(new_setting)
        db.commit()
        db.refresh(new_setting)
        return new_setting
=======
@router.get("/performance/{user_id}", response_model=UserPerformanceResponse)
async def get_perf(user_id: str, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    t_done = db.tasks.count_documents({"agent_id": user_id, "status": "completed"})
    t_pend = db.tasks.count_documents({"agent_id": user_id, "status": "pending"})
    t_att = db.attendance.count_documents({"user_id": user_id})
    p_att = db.attendance.count_documents({"user_id": user_id, "status": "present"})
    rate = round(p_att/t_att*100, 1) if t_att > 0 else 0.0
    eff = calculate_efficiency(db, user_id)
    return UserPerformanceResponse(
        username=user["username"], salary=user.get("salary", 0.0),
        performance_score=user.get("performance_score", 0),
        completed_tasks=t_done, pending_tasks=t_pend, attendance_rate=rate, efficiency=eff
    )

@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    fname = f"{uuid.uuid4()}.{file.filename.split('.')[-1]}"
    path = f"uploads/{fname}"
    with open(path, "wb") as b: shutil.copyfileobj(file.file, b)
    return {"path": path}

@router.get("/settings")
def get_set(db = Depends(get_db)):
    return fix_ids(list(db.settings.find({})))

@router.post("/settings")
async def set_set(data: dict, db = Depends(get_db)):
    db.settings.update_one({"key": data["key"]}, {"$set": {"value": data["value"]}}, upsert=True)
    return {"message": "Updated"}
>>>>>>> 6771d20fd1f9cc7b28e3f7d59b9c42e81905e20f
