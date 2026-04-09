from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User, Task, Attendance
from datetime import datetime, timedelta, date

SQLALCHEMY_DATABASE_URL = "sqlite:///./bpo_system.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

user_id = 5
today = datetime.now().date()

print(f"Today (Local): {today} (Type: {type(today)})")

# Check Attendance
att = db.query(Attendance).filter(Attendance.user_id == user_id).first()
if att:
    print(f"Attendance Date: {att.date} (Type: {type(att.date)})")
    print(f"Match Today? {att.date == today}")
    if isinstance(att.date, str):
        print(f"Attendance Date is STRING! '{att.date}'")
else:
    print("No Attendance Found")

# Check Task
task = db.query(Task).filter(Task.agent_id == user_id).first()
if task:
    if task.completed_at:
        t_date = task.completed_at.date()
        print(f"Task Completed Date: {t_date} (Type: {type(t_date)})")
        print(f"Match Today? {t_date == today}")
    else:
        print("Task not completed")
else:
    print("No Task Found")

db.close()
