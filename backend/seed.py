from database import SessionLocal, engine, Base
import models
import auth

db = SessionLocal()
Base.metadata.create_all(bind=engine)


def seed():
    # Check if admin exists
    user = db.query(models.User).filter(models.User.username == "admin").first()
    if not user:
        print("Creating admin user...")
        hashed_pw = auth.get_password_hash("admin123")
        admin = models.User(
            username="admin",
            email="admin@jourvix.com",
            hashed_password=hashed_pw,
            role="admin",
            status="available"
        )
        db.add(admin)
        db.commit()
        print("Admin user created (admin / admin123)")
    else:
        print("Admin user already exists")

    # Create dummy agents
    agents = ["agent1", "agent2", "agent3"]
    for agent_name in agents:
        user = db.query(models.User).filter(models.User.username == agent_name).first()
        if not user:
            print(f"Creating {agent_name}...")
            hashed_pw = auth.get_password_hash("password")
            agent = models.User(
                username=agent_name,
                email=f"{agent_name}@jourvix.com",
                hashed_password=hashed_pw,
                role="agent",
                status="offline"
            )
            db.add(agent)
    db.commit()

if __name__ == "__main__":
    seed()
