from database import SessionLocal
import models
from sqlalchemy import text

def check_users():
    db = SessionLocal()
    # Direct SQL to see raw values
    users = db.query(models.User).all()
    print(f"{'ID':<4} {'USERNAME':<15} {'ROLE':<10} {'IS_CREATED':<10}")
    print("-" * 45)
    for u in users:
        print(f"{u.id:<4} {u.username:<15} {u.role:<10} {u.is_created!s:<10}")
    
    db.close()

if __name__ == "__main__":
    check_users()
