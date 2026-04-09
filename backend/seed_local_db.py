from pymongo import MongoClient
from passlib.context import CryptContext

# Configuration
URL = "mongodb://localhost:27017"
DB_NAME = "BPO"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed():
    client = MongoClient(URL)
    db = client[DB_NAME]
    
    # Create Admin User
    admin_user = {
        "username": "Admin@CJ",
        "email": "admin@jourvix.com",
        "password": pwd_context.hash("admin"), # Default password 'admin' as seen in user screenshot
        "role": "admin",
        "display_name": "Admin Control",
        "status": "online",
        "performance_score": 0,
        "completed_tasks": 0,
        "attendance_rate": 0,
        "efficiency": 0.0
    }
    
    # Upsert to prevent duplicates
    db.users.update_one(
        {"username": "Admin@CJ"},
        {"$setOnInsert": admin_user},
        upsert=True
    )
    
    print("SUCCESS: Local 'Admin@CJ' user initialized in MongoDB.")
    
if __name__ == "__main__":
    seed()
