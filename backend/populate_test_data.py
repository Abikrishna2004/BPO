from database import SessionLocal
import models
from datetime import datetime, timedelta, date

def populate():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == "Admin@CJ").first()
        if not user:
            print("Admin not found")
            return

        # 1. Add Attendance (5 days total, 4 present) => 80% * 20 = 16 pts
        today = date.today()
        for i in range(5):
            d = today - timedelta(days=i)
            status = 'present' if i < 4 else 'absent'
            rec = models.Attendance(user_id=user.id, date=d, status=status, marked_by="system")
            db.merge(rec) # Updates if exists
        
        # 2. Add Tasks
        # Task 1: Completed Early (Deadline tomorrow, completed today). 24h * 0.5 = 12pts
        deadline = datetime.now() + timedelta(days=1)
        t1 = models.Task(
            title="Early Task",
            description="Finished early",
            agent_id=user.id,
            status="completed",
            created_at=datetime.now() - timedelta(hours=2),
            deadline=deadline,
            completed_at=datetime.now()
        )
        db.add(t1)

        # Task 2: Completed (No deadline) => Just completion rate.
        t2 = models.Task(
            title="Regular Task",
            description="Just done",
            agent_id=user.id,
            status="completed",
            created_at=datetime.now() - timedelta(hours=5),
            completed_at=datetime.now()
        )
        db.add(t2)
        
        # Task 3: Pending => 2/3 completed = 66% * 30 = 20 pts
        t3 = models.Task(
            title="Pending Task",
            description="Not done yet",
            agent_id=user.id,
            status="pending",
            created_at=datetime.now()
        )
        db.add(t3)

        # 3. Achievement => 1 * 2 = 2 pts
        ach = models.Achievement(
            user_id=user.id,
            title="Test Achievement",
            description="For testing efficiency",
            type="medal",
            date_awarded=datetime.now()
        )
        db.add(ach)

        db.commit()
        print("Test data populated.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate()





