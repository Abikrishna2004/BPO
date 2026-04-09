from pymongo import MongoClient
import auth
from datetime import datetime

LOCAL_URL = "mongodb://localhost:27017"
DB_NAME = "BPO"

print("--- LOCAL BPO SYSTEM SEEDER ---")
client = MongoClient(LOCAL_URL)
db = client[DB_NAME]

# 1. Create Admin
admin_user = {
    "username": "abishek",
    "email": "abishek@jourvix.com",
    "hashed_password": auth.get_password_hash("admin123"),
    "role": "admin",
    "status": "available",
    "is_created": True,
    "salary": 1200000.0,
    "performance_score": 100,
    "display_name": "Abishek Admin",
    "created_at": datetime.now()
}

# Check if exists
if db.users.find_one({"username": "abishek"}):
    print("Admin 'abishek' already exists locally.")
else:
    db.users.insert_one(admin_user)
    print("SUCCESS: Local Admin 'abishek' created (Password: admin123).")

# 2. Add some dummy stats for the dashboard to look good
if not db.settings.find_one({"key": "performance_bonus_amount"}):
    db.settings.insert_one({"key": "performance_bonus_amount", "value": "5000"})

print("\n--- DONE ---")
print("Now change MONGODB_URL in backend/.env to: mongodb://localhost:27017/BPO")
