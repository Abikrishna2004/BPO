from database import SessionLocal
from routes import calculate_efficiency
import models 

def test_eff():
    db = SessionLocal()
    try:
        # Get admin
        user = db.query(models.User).filter(models.User.username == "Admin@CJ").first()
        if user:
            eff = calculate_efficiency(db, user.id)
            print(f"User: {user.username}")
            print(f"Efficiency: {eff}")
            
            # Check components manually to verify
            # Attendance
            total_days = db.query(models.Attendance).filter(models.Attendance.user_id == user.id).count()
            present_days = db.query(models.Attendance).filter(models.Attendance.user_id == user.id, models.Attendance.status == 'present').count()
            print(f"Attendance: {present_days}/{total_days}")
            
            # Tasks
            c_tasks = db.query(models.Task).filter(models.Task.agent_id == user.id, models.Task.status == "completed").count()
            total_tasks = db.query(models.Task).filter(models.Task.agent_id == user.id).count()
            print(f"Tasks: {c_tasks}/{total_tasks}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_eff()
