from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User, Task, Attendance, Project
from datetime import datetime, timedelta, date

SQLALCHEMY_DATABASE_URL = "sqlite:///./bpo_system.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

user_id = 5
today = datetime.now().date()
start_date = today - timedelta(days=29)

print(f"Start Debug for User {user_id}")

tasks = db.query(Task).filter(
    Task.agent_id == user_id,
    Task.status == "completed",
    Task.completed_at >= start_date # Broad filter
).all()

attendance_records = db.query(Attendance).filter(
    Attendance.user_id == user_id,
    Attendance.date >= start_date
).all()

att_map = {rec.date: rec.status for rec in attendance_records}
print(f"Attendance Map: {att_map}")

found_Match = False
for i in range(29, -1, -1):
    day = today - timedelta(days=i)
    att_status = att_map.get(day, "no_record")
    if att_status != "no_record":
        print(f"Day: {day} (Type: {type(day)}) MATCHED with status {att_status}")
        found_Match = True
    else:
        # Check map keys type
        if i == 0:
            print(f"Checking Today {day} against map keys...")
            for k in att_map.keys():
                print(f" Key: {k} (Type: {type(k)}) == Day? {k == day}")

if not found_Match:
    print("NO MATCHES FOUND IN LOOP!")

db.close()
