from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from datetime import datetime
from sqlalchemy.orm import Session
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

router = APIRouter()

# Schemas
from datetime import date as date_type, timedelta

def calculate_efficiency(db: Session, user_id: int) -> float:
    # 1. Base Efficiency is set to 25 for all new employees
    base_score = 25.0

    # 2. Get User data
    total_days = db.query(models.Attendance).filter(models.Attendance.user_id == user_id).count()
    present_days = db.query(models.Attendance).filter(models.Attendance.user_id == user_id, models.Attendance.status == 'present').count()
    
    # 3. Attendance Streak Bonus
    streak = 0
    recent_att = db.query(models.Attendance).filter(models.Attendance.user_id == user_id).order_by(models.Attendance.date.desc()).all()
    for record in recent_att:
        if record.status == 'present':
            streak += 1
        else:
            break
            
    # Streak 25-50+ increases efficiency score by 0.5 to 1. 
    # 0.02 points per day (25 days = +0.5 points)
    streak_bonus = streak * 0.02

    # 4. Task Completion Bonuses & Penalties
    c_tasks = db.query(models.Task).filter(models.Task.agent_id == user_id, models.Task.status == "completed").all()
    p_tasks = db.query(models.Task).filter(models.Task.agent_id == user_id, models.Task.status == "pending").all()
    
    task_bonus = 0.0
    late_penalty = 0.0
    
    for t in c_tasks:
        if t.deadline and t.completed_at:
            if t.completed_at <= t.deadline:
                # 10 quicker tasks = +0.5 to +1
                delta = t.deadline - t.completed_at
                hours_early = delta.total_seconds() / 3600
                if hours_early > 24:
                    task_bonus += 0.1  # Very early (+1.0 per 10 tasks)
                else:
                    task_bonus += 0.05 # On time (+0.5 per 10 tasks)
            else:
                # Late submission: -0.5 to -2 based on how late
                delta = t.completed_at - t.deadline
                days_late = delta.total_seconds() / (3600 * 24)
                if days_late > 3:
                    late_penalty += 2.0
                elif days_late > 1:
                    late_penalty += 1.0
                else:
                    late_penalty += 0.5

    # Check for pending tasks that are overdue
    now = datetime.now()
    for t in p_tasks:
        if t.deadline and t.deadline < now:
            delta = now - t.deadline
            days_late = delta.total_seconds() / (3600 * 24)
            if days_late > 3:
                late_penalty += 2.0
            elif days_late > 1:
                late_penalty += 1.0
            else:
                late_penalty += 0.5
    
    # 5. Penalties (Reduce efficiency for negative marks)
    # Absent days cost 1.0 - 2.0 points depending on pattern
    absent_days = total_days - present_days
    # The more you are absent, the harder it hits. Basic absence is -1.0.
    att_penalty = absent_days * 1.0

    # 6. Final Calculation
    total_eff = base_score + streak_bonus + task_bonus - att_penalty - late_penalty
    
    # Bound the efficiency between 0 and 100
    if total_eff < 0: total_eff = 0
    if total_eff > 100: total_eff = 100

    return round(total_eff, 2)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Ensure uploads directory exists
    os.makedirs("uploads", exist_ok=True)
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = f"uploads/{unique_filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Return path relative to server root (for static mounting)
    return {"path": file_path}

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "agent"

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    role: str
    status: str
    performance_score: Optional[int] = 0
    completed_tasks: Optional[int] = 0
    pending_tasks: Optional[int] = 0
    present_days: Optional[int] = 0
    attendance_rate: Optional[float] = 0.0
    efficiency: Optional[float] = 0.0
    salary: Optional[float] = 0.0
    profile_image: Optional[str] = None
    last_active: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserPerformanceResponse(BaseModel):
    username: str
    salary: float
    performance_score: int
    completed_tasks: int
    pending_tasks: int
    attendance_rate: float
    efficiency: float

class CallCreate(BaseModel):
    customer_name: str
    customer_number: str

class AttendanceCreate(BaseModel):
    user_id: int
    status: str # present, absent

class AttendanceResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    date: date_type
    status: str
    marked_by: Optional[str] = None
    
    class Config:
        from_attributes = True

class PasswordUpdate(BaseModel):
    new_password: str

class SalaryUpdate(BaseModel):
    salary: float

class LogResponse(BaseModel):
    id: int
    message: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth Routes
from websocket_manager import manager

async def create_log(db: Session, message: str, user_id: Optional[int] = None):
    # Save to DB
    log = models.SystemLog(message=message, user_id=user_id)
    db.add(log)
    db.commit()
    # Broadcast
    await manager.broadcast(message)

# GET Logs Endpoint
@router.get("/logs", response_model=List[LogResponse])
def get_logs(user_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.SystemLog)
    
    if current_user.role in ["admin", "manager"]:
        if user_id:
            # Filter by specific user if requested
            query = query.filter(models.SystemLog.user_id == user_id)
        # Admin/Manager sees everything (limit 50)
        return query.order_by(models.SystemLog.created_at.desc()).limit(50).all()
    else:
        # Employee sees global messages (user_id=None) OR their own messages
        return query.filter(
            (models.SystemLog.user_id == current_user.id) | (models.SystemLog.user_id == None)
        ).order_by(models.SystemLog.created_at.desc()).limit(20).all()

class DailyReport(BaseModel):
    summary: str

@router.post("/report/daily")
async def submit_daily_report(report: DailyReport, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    msg = f"DAILY REPORT from {current_user.username}: {report.summary}"
    await create_log(db, msg, user_id=current_user.id)
    return {"message": "Daily report submitted"}

@router.get("/dashboard/agents", response_model=List[UserResponse])
def get_agents_status(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["admin", "manager"]:
         raise HTTPException(status_code=403, detail="Forbidden")
    
    # Exclude the current admin user from the list
    users = db.query(models.User).filter(models.User.id != current_user.id).all()

    # Enrich with counts and correct attendance rate
    results = []
    for user in users:
        c_tasks = db.query(models.Task).filter(models.Task.agent_id == user.id, models.Task.status == "completed").count()
        p_tasks = db.query(models.Task).filter(models.Task.agent_id == user.id, models.Task.status == "pending").count()
        
        # Attendance Rate: (Present Days / Total Marked Days) * 100
        total_days = db.query(models.Attendance).filter(models.Attendance.user_id == user.id).count()
        present_count = db.query(models.Attendance).filter(models.Attendance.user_id == user.id, models.Attendance.status == 'present').count()
        rate = 0.0
        if total_days > 0:
            rate = round((present_count / total_days) * 100, 1)

        efficiency_val = calculate_efficiency(db, user.id)

        # Get Last Active
        latest_log = db.query(models.SystemLog).filter(models.SystemLog.user_id == user.id).order_by(models.SystemLog.created_at.desc()).first()
        last_active_time = latest_log.created_at if latest_log else user.created_at

        # Safe defaults
        # Explicitly construct response to ensure fields are populated
        user_response = UserResponse(
            id=user.id,
            username=user.username,
            role=user.role,
            status=user.status,
            performance_score=user.performance_score if user.performance_score else 0,
            completed_tasks=c_tasks,
            pending_tasks=p_tasks,
            present_days=present_count,
            attendance_rate=rate,
            efficiency=efficiency_val,
            salary=user.salary if user.salary else 0.0,
            last_active=last_active_time 
        )
        results.append(user_response)
    
    return results


@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Only Admins and Managers can create new users
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create users"
        )

    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role if user.role else "agent",
        status="offline",
        is_created=True,
        created_at=datetime.now()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Dual-write to MongoDB for visibility in Compass
    try:
        from pymongo import MongoClient
        mongo_client = MongoClient("mongodb://localhost:27018/")
        mongo_db = mongo_client["bpo_management_system"]
        mongo_db["users"].insert_one({
            "username": new_user.username,
            "email": new_user.email,
            "password": user.password, # Save plain text as requested in previous steps
            "role": new_user.role,
            "status": new_user.status,
            "is_created": new_user.is_created,
            "salary": 50000,
            "performance_score": 0,
            "created_at": new_user.created_at
        })
        mongo_client.close()
    except Exception as e:
        print(f"Failed to dual-write to MongoDB: {e}")

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

    # Auto mark attendance
    if user.role not in ["admin", "manager"]:
        today = datetime.now().date()
        existing_att = db.query(models.Attendance).filter(
            models.Attendance.user_id == user.id,
            models.Attendance.date == today
        ).first()
        
        if not existing_att:
            new_att = models.Attendance(
                user_id=user.id,
                status="present",
                date=today,
                marked_by="System"
            )
            db.add(new_att)
            db.commit()
            await create_log(db, f"Attendance Auto-Marked: {user.username} is PRESENT", user_id=user.id)

    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    await create_log(db, f"Agent Logged Out: {current_user.username}", user_id=current_user.id)
    return {"message": "Logged out successfully"}

@router.post("/attendance", response_model=AttendanceResponse)
async def mark_attendance(att: AttendanceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Only Admins and Managers can mark attendance")
    
    today = datetime.now().date()
    target_user = db.query(models.User).filter(models.User.id == att.user_id).first()
    target_username = target_user.username if target_user else "Unknown"

    existing = db.query(models.Attendance).filter(
        models.Attendance.user_id == att.user_id,
        models.Attendance.date == today
    ).first()
    
    if existing:
        existing.status = att.status
        existing.marked_by = current_user.username
        db.commit()
        db.refresh(existing)
        await create_log(db, f"Attendance Update: {target_username} is now {att.status.upper()}", user_id=target_user.id if target_user else None)
        return existing

    new_att = models.Attendance(
        user_id=att.user_id,
        status=att.status,
        date=today,
        marked_by=current_user.username
    )
    db.add(new_att)
    db.commit()
    db.refresh(new_att)
    await create_log(db, f"Attendance Marked: {target_username} is {att.status.upper()}", user_id=target_user.id if target_user else None)
    return new_att

@router.get("/users/me", response_model=UserResponse)
async def read_users_me(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Calculate stats for the current user
    c_tasks = db.query(models.Task).filter(models.Task.agent_id == current_user.id, models.Task.status == "completed").count()
    p_tasks = db.query(models.Task).filter(models.Task.agent_id == current_user.id, models.Task.status == "pending").count()
    
    total_days = db.query(models.Attendance).filter(models.Attendance.user_id == current_user.id).count()
    present_days = db.query(models.Attendance).filter(models.Attendance.user_id == current_user.id, models.Attendance.status == 'present').count()
    rate = 0.0
    if total_days > 0:
        rate = round((present_days / total_days) * 100, 1)

    # We can't modify the ORM object in place safely without detaching or committing, 
    # but since we are just returning Pydantic model, we can construct a dict or set attributes if it wasn't attached.
    # Cleaner way: return a dict that matches UserResponse
    
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=getattr(current_user, 'email', None),
        display_name=current_user.display_name,
        role=current_user.role,
        status=current_user.status,
        performance_score=current_user.performance_score if current_user.performance_score else 0,
        completed_tasks=c_tasks,
        pending_tasks=p_tasks,
        attendance_rate=rate,
        efficiency=0.0,
        salary=current_user.salary if current_user.salary is not None else 0.0,
        profile_image=getattr(current_user, 'profile_image', None),
        last_active=None # Or implement last active logic
    )

# BPO Routes

@router.post("/calls/start")
def start_call(call: CallCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Simulate assigning a call to the current agent
    current_user.status = models.AgentStatus.ON_CALL
    new_call = models.Call(
        customer_name=call.customer_name,
        customer_number=call.customer_number,
        agent_id=current_user.id,
        status="active"
    )
    db.add(new_call)
    db.add(current_user) # Update status
    db.commit()
    return {"message": "Call started", "call_id": new_call.id}

@router.post("/calls/{call_id}/end")
def end_call(call_id: int, notes: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    call = db.query(models.Call).filter(models.Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    call.end_time = datetime.now()
    call.status = "completed"
    call.notes = notes
    
    current_user.status = models.AgentStatus.AVAILABLE
    db.add(current_user)
    db.commit()
    return {"message": "Call ended"}

@router.get("/attendance", response_model=List[AttendanceResponse])
def get_attendance(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    today = datetime.now().date()
    if current_user.role in ["admin", "manager"]:
        return db.query(models.Attendance).filter(models.Attendance.date == today).all()
    else:
        return db.query(models.Attendance).filter(
            models.Attendance.user_id == current_user.id,
            models.Attendance.date == today
        ).all()

@router.get("/attendance/history/{user_id}", response_model=List[AttendanceResponse])
def get_attendance_history(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    today = datetime.now().date()
    if current_user.role not in ["admin", "manager"] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return db.query(models.Attendance).filter(models.Attendance.user_id == user_id).order_by(models.Attendance.date.desc()).limit(30).all()

# User Management (Delete & Password)
@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
    
    # Optional: Prevent deleting self or default admins if needed
    if user.id == current_user.id:
         raise HTTPException(status_code=400, detail="Cannot delete yourself")

    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

class TaskCreate(BaseModel):
    title: str
    description: str
    agent_id: int
    deadline: Optional[datetime] = None

class TaskResponse(BaseModel):
    id: int
    title: Optional[str] = "Untitled"
    description: Optional[str] = "No description"
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
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Only Admins and Managers can assign tasks")
    
    new_task = models.Task(
        title=task.title,
        description=task.description,
        agent_id=task.agent_id,
        deadline=task.deadline,
        status="pending"
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    agent = db.query(models.User).filter(models.User.id == task.agent_id).first()
    if agent:
        await create_log(db, f"New Task for {agent.username}: {task.title}", user_id=agent.id)
    
    return new_task

@router.get("/tasks/my", response_model=List[TaskResponse])
def get_my_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Task).filter(models.Task.agent_id == current_user.id).all()

@router.get("/tasks/user/{user_id}", response_model=List[TaskResponse])
def get_user_tasks(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["admin", "manager"] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Task).filter(models.Task.agent_id == user_id).order_by(models.Task.phase_num.asc(), models.Task.created_at.desc()).all()

class TaskCompletion(BaseModel):
    notes: str
    attachments: List[str] = []

@router.put("/tasks/{task_id}/complete")
async def complete_task(task_id: int, completion: TaskCompletion, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id, models.Task.agent_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = "completed"
    task.completed_at = datetime.now()
    task.completion_notes = completion.notes
    task.attachments = json.dumps(completion.attachments)
    
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
    # Security: Only Admin/Manager or Self can view
    if current_user.role not in ["admin", "manager"] and current_user.id != user_id:
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
        salary=target.salary if target.salary is not None else 0.0,
        performance_score=target.performance_score if target.performance_score is not None else 0,
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
    
    # Get User Creation Date
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    creation_date = target_user.created_at.date() if target_user and target_user.created_at else start_date

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
                if t.completed_at and t.completed_at.date() == day:
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
    except Exception as e:
        print(f"ERROR in get_performance_history: {e}")
        import traceback
        traceback.print_exc()
        return []

@router.put("/users/{user_id}/password")
def update_password(user_id: int, pw: PasswordUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
            
    user.hashed_password = auth.get_password_hash(pw.new_password)
    db.commit()
    return {"message": "Password updated"}

# Project Management Routes

class ProjectResponse(BaseModel):
    id: int
    title: str
    description: str
    deadline: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    title: str
    description: str
    deadline: Optional[datetime] = None

@router.post("/projects", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    new_project = models.Project(
        title=project.title,
        description=project.description,
        deadline=project.deadline
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@router.get("/projects", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Project).all()

class ProjectAssign(BaseModel):
    project_id: int
    agent_ids: List[int]
    phases: List[str] # ["Research", "Development"] or generated if empty

@router.post("/projects/assign")
async def assign_project(assignment: ProjectAssign, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    project = db.query(models.Project).filter(models.Project.id == assignment.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    created_tasks = []
    
    for agent_id in assignment.agent_ids:
        agent = db.query(models.User).filter(models.User.id == agent_id).first()
        if not agent: continue
        
        for idx, phase_title in enumerate(assignment.phases):
            new_task = models.Task(
                title=f"{project.title} - {phase_title}",
                description=f"Phase {idx+1} of Project: {project.title}",
                status="pending",
                agent_id=agent_id,
                project_id=project.id,
                phase_num=idx+1,
                deadline=project.deadline # Inherit project deadline
            )
            db.add(new_task)
            created_tasks.append(new_task)
            
        await create_log(db, f"Project Assigned: {agent.username} assigned to '{project.title}' with {len(assignment.phases)} phases.", user_id=agent.id)

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

class AchievementCreate(BaseModel):
    title: str
    description: str
    type: str # "bonus", "increment", "promotion", "award"
    amount: Optional[int] = None

@router.post("/users/{user_id}/achievements", response_model=AchievementResponse)
async def create_user_achievement(user_id: int, ach: AchievementCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    new_ach = models.Achievement(
        user_id=user_id,
        title=ach.title,
        description=ach.description,
        type=ach.type,
        amount=ach.amount,
        date_awarded=datetime.now()
    )
    db.add(new_ach)
    db.commit()
    db.refresh(new_ach)
    
    await create_log(db, f"Award Given: {target.username} received '{ach.title}'", user_id=target.id)
    
    return new_ach

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
    if current_user.role not in ["admin", "manager"]:
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

# --- Profile Management ---

class ProfileImageUpdate(BaseModel):
    profile_image: str

@router.put("/users/me/profile_image")
def update_profile_image(data: ProfileImageUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    current_user.profile_image = data.profile_image
    db.commit()
    return {"message": "Profile image updated"}

class ProfileRequestCreate(BaseModel):
    new_username: Optional[str] = None
    new_email: Optional[str] = None

class ProfileRequestResponse(BaseModel):
    id: int
    user_id: int
    new_username: Optional[str]
    new_email: Optional[str]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.post("/profile-requests", response_model=ProfileRequestResponse)
def create_profile_request(req: ProfileRequestCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_req = models.ProfileRequest(
        user_id=current_user.id,
        new_username=req.new_username,
        new_email=req.new_email
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)
    return new_req

@router.get("/profile-requests", response_model=List[ProfileRequestResponse])
def get_profile_requests(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.ProfileRequest).filter(models.ProfileRequest.status == "pending").all()

@router.put("/profile-requests/{request_id}/approve")
def approve_profile_request(request_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    req = db.query(models.ProfileRequest).filter(models.ProfileRequest.id == request_id).first()
    if not req or req.status != "pending":
        raise HTTPException(status_code=404, detail="Request not found or not pending")
        
    user = db.query(models.User).filter(models.User.id == req.user_id).first()
    if req.new_username:
        user.username = req.new_username
    if req.new_email:
        user.email = req.new_email
        
    req.status = "approved"
    db.commit()
    return {"message": "Request approved"}

@router.put("/profile-requests/{request_id}/reject")
def reject_profile_request(request_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    req = db.query(models.ProfileRequest).filter(models.ProfileRequest.id == request_id).first()
    if not req or req.status != "pending":
        raise HTTPException(status_code=404, detail="Request not found or not pending")
        
    req.status = "rejected"
    db.commit()
    return {"message": "Request rejected"}