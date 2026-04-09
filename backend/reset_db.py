from database import SessionLocal, engine, Base
import models
import auth
from sqlalchemy import text

# Force clean state if possible, but mainly rely on updating data
db = SessionLocal()

def reset_and_seed():
    print("Resetting database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    print("Seeding single admin...")
    # 1. Create ONE Admin
    admin_pw = auth.get_password_hash("admin123")
    admin = models.User(
        username="admin",
        email="admin@jourvix.com",
        hashed_password=admin_pw,
        role="admin",
        status="available"
    )
    db.add(admin)
    
    # 2. Create Employees (Standard Agents)
    employees = ["employee1", "employee2", "employee3"]
    for emp_name in employees:
        print(f"Creating {emp_name}...")
        emp_pw = auth.get_password_hash("password")
        agent = models.User(
            username=emp_name,
            email=f"{emp_name}@jourvix.com",
            hashed_password=emp_pw,
            role="agent",
            status="offline",
            is_created=False 
        )
        db.add(agent)
    
    db.commit()
    print("Database reset complete.")
    print("ADMIN CREDENTIALS: admin / admin123")
    print("EMPLOYEE CREDENTIALS: employee1 / password")

if __name__ == "__main__":
    reset_and_seed()

if __name__ == "__main__":
    reset_and_seed()
