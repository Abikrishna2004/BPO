from database import SessionLocal
import models
from datetime import datetime

def fix_pari():
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == "pari").first()
        if user:
            # Set to Feb 7th 2026
            new_date = datetime(2026, 2, 7)
            user.created_at = new_date
            db.commit()
            print(f"Updated pari created_at to {new_date}")
        else:
            print("User 'pari' not found")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_pari()
