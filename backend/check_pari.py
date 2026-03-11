from database import SessionLocal
import models

def check_pari():
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.username == "pari").first()
    if user:
        print(f"User: {user.username}, CreatedAt: {user.created_at}")
    else:
        print("User 'pari' not found")
        
    db.close()

if __name__ == "__main__":
    check_pari()
