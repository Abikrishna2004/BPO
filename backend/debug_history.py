from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User, Task, Attendance
from datetime import datetime, timedelta

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./bpo_system.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

user_id = 5
today = datetime.now().date()
start_date = today - timedelta(days=30)

print(f"Checking history for User ID: {user_id}")
print(f"Today: {today}")
print(f"Start Date: {start_date}")

# Check aggregate
total_att = db.query(Attendance).filter(Attendance.user_id == user_id).count()
print(f"Total Attendance Count (Aggregate): {total_att}")

# Check history records
recs = db.query(Attendance).filter(Attendance.user_id == user_id).all()
print(f"Attendance Records found: {len(recs)}")
for r in recs:
    print(f" - Date: {r.date} (Type: {type(r.date)}), Status: {r.status}")

# Check Tasks
tasks = db.query(Task).filter(Task.agent_id == user_id).all()
print(f"Total Tasks: {len(tasks)}")
for t in tasks:
    print(f" - ID: {t.id}, Status: {t.status}, Completed At: {t.completed_at} (Type: {type(t.completed_at)})")

db.close()
