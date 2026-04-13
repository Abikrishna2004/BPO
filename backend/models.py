from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    AGENT = "agent"

class AgentStatus(str, enum.Enum):
    AVAILABLE = "available"
    ON_CALL = "on_call"
    ON_BREAK = "on_break"
    OFFLINE = "offline"

class User(BaseModel):
    username: str
    email: EmailStr
    hashed_password: str
    role: UserRole = UserRole.AGENT
    status: AgentStatus = AgentStatus.OFFLINE
    is_created: bool = False
    salary: float = 50000.0
    performance_score: int = 0
    display_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

class Task(BaseModel):
    title: str
    description: str
    status: str = "pending" # pending, completed
    agent_id: str # Mongo ObjectId as string
    project_id: Optional[str] = None
    phase_num: int = 1
    created_at: datetime = Field(default_factory=datetime.now)
    deadline: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completion_notes: Optional[str] = None
    attachments: Optional[str] = None # JSON string

class Project(BaseModel):
    title: str
    description: str
    status: str = "active" # active, completed
    created_at: datetime = Field(default_factory=datetime.now)
    deadline: Optional[datetime] = None

class Call(BaseModel):
    customer_name: str
    customer_number: str
    agent_id: str
    start_time: datetime = Field(default_factory=datetime.now)
    end_time: Optional[datetime] = None
    status: str = "active" # active, completed, dropped
    notes: Optional[str] = None

class Attendance(BaseModel):
    user_id: str
    date: str # Store as YYYY-MM-DD
    status: str # present, absent
    marked_by: Optional[str] = None

class SystemLog(BaseModel):
    message: str
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

class Achievement(BaseModel):
    user_id: str
    title: str
    description: str
    type: str # "bonus", "increment", "promotion"
    amount: Optional[int] = None
    date_awarded: datetime = Field(default_factory=datetime.now)

class Setting(BaseModel):
    key: str
    value: str
