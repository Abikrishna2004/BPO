from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from datetime import datetime, date as date_type, timedelta
from database import get_db
import models
import auth
from pydantic import BaseModel
from typing import List, Optional
from fastapi.security import OAuth2PasswordRequestForm
import json
import shutil
import os
import uuid
from bson import ObjectId

router = APIRouter()

@router.get("/status")
def router_status():
    return {"status": "submodule_operational"}

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

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "agent"

class UserResponse(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    role: str
    status: str
    performance_score: int = 0
    completed_tasks: int = 0
    pending_tasks: int = 0
    present_days: int = 0
    attendance_rate: float = 0.0
    efficiency: float = 0.0
    salary: float = 0.0
    profile_photo: Optional[str] = None
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
    id: str
    user_id: str
    date: str
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
async def get_agents_status(db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    if current_user["role"] == "agent":
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

@router.put("/users/profile", response_model=UserResponse)
async def update_profile(data: dict, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    u_id = current_user["id"]
    update_data = {}
    if "display_name" in data: update_data["display_name"] = data["display_name"]
    if "email" in data: update_data["email"] = data["email"]
    if "profile_photo" in data: update_data["profile_photo"] = data["profile_photo"]
    
    if update_data:
        db.users.update_one({"_id": ObjectId(u_id)}, {"$set": update_data})
    
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
        id=u_id, username=current_user["username"], email=current_user.get("email"), display_name=current_user.get("display_name"),
        role=current_user["role"], status=current_user["status"], 
        performance_score=current_user.get("performance_score", 0),
        completed_tasks=c_tasks, pending_tasks=p_tasks, attendance_rate=rate,
        efficiency=eff, salary=current_user.get("salary", 0.0),
        profile_photo=current_user.get("profile_photo")
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
    return {"message": "User deleted"}

@router.put("/users/{user_id}/promote")
async def promote_user(user_id: str, promo: dict, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    if current_user["role"] != "admin": raise HTTPException(status_code=403)
    db.users.update_one({"_id": ObjectId(user_id)}, {"$set": promo})
    u = db.users.find_one({"_id": ObjectId(user_id)})
    await create_log(db, f"SYSTEM_PROMO: {u['username']} rewarded - Salary: {u['salary']}, Role: {u['role']}", user_id=user_id)
    return {"message": "Success"}

@router.post("/tasks", response_model=TaskResponse)
async def assign_task(task: dict, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    if current_user["role"] != "admin": raise HTTPException(status_code=403)
    new_task = task
    new_task["status"] = "pending"
    new_task["created_at"] = datetime.now()
    # Ensure agent_id is stored as string for consistency across lookups
    new_task["agent_id"] = str(task.get("agent_id", ""))
    
    res = db.tasks.insert_one(new_task)
    new_task["_id"] = res.inserted_id
    
    try:
        agent = db.users.find_one({"_id": ObjectId(new_task["agent_id"])})
        if agent:
            await create_log(db, f"New Task for {agent['username']}: {task['title']}", user_id=str(agent["_id"]))
    except: pass
    
    return fix_id(new_task)

@router.get("/tasks/my", response_model=List[TaskResponse])
async def my_tasks(db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    u_id = current_user["id"]
    u_name = current_user["username"]
    
    # SYSTEM DIAGNOSTIC: Search for both ID and Username to catch mismatch
    query = {
        "$or": [
            {"agent_id": u_id}, 
            {"agent_id": u_name},
            {"agent_id": str(u_id)}
        ],
        "status": {"$ne": "deleted"}
    }
    
    try:
        tasks = list(db.tasks.find(query).sort("created_at", -1))
        return fix_ids(tasks)
    except Exception as e:
        print(f"TASK FETCH ERROR: {e}")
        return []

@router.get("/tasks/user/{user_id}", response_model=List[TaskResponse])
async def user_tasks(user_id: str, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    query = {"$or": [{"agent_id": user_id}, {"agent_id": ObjectId(user_id)}]}
    return fix_ids(list(db.tasks.find(query).sort("created_at", -1)))

@router.put("/tasks/{task_id}/complete")
async def finish_task(task_id: str, completion: dict, db = Depends(get_db), current_user = Depends(auth.get_current_user)):
    task = db.tasks.find_one({"_id": ObjectId(task_id)})
    if not task: raise HTTPException(status_code=404)
    
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
    
    db.users.update_one({"_id": ObjectId(current_user["id"])}, {"$inc": {"performance_score": xp_gain}})
    
    # Re-fetch user explicitly to check for auto-promotion
    updated_user = db.users.find_one({"_id": ObjectId(current_user["id"])})
    await check_and_apply_automatic_promotion(db, updated_user)
    
    status_msg = "LATE SUBMISSION" if is_late else "SUCCESSFUL UPLOAD"
    await create_log(db, f"Task {status_msg}: {current_user['username']} finished '{task['title']}' ({xp_gain} XP)", user_id=current_user["id"])
    return {"message": "Task completed", "xp_gain": xp_gain}

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