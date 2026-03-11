import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database import SessionLocal
import models

db = SessionLocal()
users = db.query(models.User).all()
for u in users:
    print(f"ID: {u.id}, Username: '{u.username}', Display Name: '{u.display_name}', Role: {u.role}")

