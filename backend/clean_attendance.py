from database import SessionLocal
import models

def clean():
    db = SessionLocal()
    try:
        # Delete null user_id
        null_recs = db.query(models.Attendance).filter(models.Attendance.user_id == None).all()
        print(f"Found {len(null_recs)} records with null user_id.")
        for r in null_recs:
            db.delete(r)
        
        db.commit()
        print("Deleted null records.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clean()
