from database import SessionLocal
import models
from sqlalchemy import text

def check():
    db = SessionLocal()
    try:
        # Check specific user
        admin = db.query(models.User).filter(models.User.username == "Admin@CJ").first()
        if admin:
            print(f"User: {admin.username}")
            print(f"Display Name: {admin.display_name}")
            print(f"ID: {admin.id}")
        else:
            print("User 'Admin@CJ' not found.")
            
            # List all admins to see what's there
            admins = db.query(models.User).filter(models.User.role == "admin").all()
            print("\nAll Admins:")
            for a in admins:
                print(f"- {a.username} (ID: {a.id}, Display: {a.display_name})")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check()
