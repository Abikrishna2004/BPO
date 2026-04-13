from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum, Date
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime, date

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    AGENT = "agent"

class AgentStatus(str, enum.Enum):
    AVAILABLE = "available"
    ON_CALL = "on_call"
    ON_BREAK = "on_break"
    OFFLINE = "offline"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default=UserRole.AGENT)
    status = Column(String, default=AgentStatus.OFFLINE) # For agents mainly
    is_created = Column(Boolean, default=False) # True for manually created agents
    salary = Column(Integer, default=50000) # Base salary
    performance_score = Column(Integer, default=0) # 0-100
    display_name = Column(String, default=None)
    created_at = Column(DateTime, default=datetime.now)
    
    calls = relationship("Call", back_populates="agent")
    attendance = relationship("Attendance", back_populates="user")
    tasks = relationship("Task", back_populates="agent")
    achievements = relationship("Achievement", back_populates="user")




class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    status = Column(String, default="pending") # pending, completed
    agent_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    phase_num = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.now)
    deadline = Column(DateTime, nullable=True) # New: Individual task deadline
    completed_at = Column(DateTime, nullable=True)
    completion_notes = Column(String, nullable=True)
    attachments = Column(String, nullable=True) # JSON string of file paths

    agent = relationship("User", back_populates="tasks")
    project_relation = relationship("Project", back_populates="tasks")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    status = Column(String, default="active") # active, completed
    created_at = Column(DateTime, default=datetime.now)
    deadline = Column(DateTime, nullable=True)

    tasks = relationship("Task", back_populates="project_relation")

class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String)
    customer_number = Column(String)
    agent_id = Column(Integer, ForeignKey("users.id"))
    start_time = Column(DateTime, default=datetime.now)
    end_time = Column(DateTime, nullable=True)
    status = Column(String, default="active") # active, completed, dropped
    notes = Column(String, nullable=True)

    agent = relationship("User", back_populates="calls")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date, default=date.today)
    status = Column(String) # present, absent
    marked_by = Column(String) # admin username

    user = relationship("User", back_populates="attendance")

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # If related to a specific user
    created_at = Column(DateTime, default=datetime.now)

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String) # e.g. "Performance Bonus"
    description = Column(String) # e.g. "Reached 100% Performance Score"
    type = Column(String) # "bonus", "increment", "promotion"
    amount = Column(Integer, nullable=True) # Cash value or %
    date_awarded = Column(DateTime, default=datetime.now)

    user = relationship("User", back_populates="achievements")

class Setting(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String) # Store as string, parse as needed
