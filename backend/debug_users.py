from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

def list_users():
    db = SessionLocal()
    users = db.query(models.User).all()
    
    print(f"{'ID':<5} {'USERNAME':<20} {'ROLE':<10} {'STATUS':<10}")
    print("-" * 50)
    for user in users:
        print(f"{user.id:<5} {user.username:<20} {user.role:<10} {user.status:<10}")
    db.close()

if __name__ == "__main__":
    list_users()
