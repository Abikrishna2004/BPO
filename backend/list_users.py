from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User
from database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

users = db.query(User).all()
print(f"Total Users: {len(users)}")
for u in users:
    print(f"ID: {u.id}, Username: {u.username}, Role: '{u.role}', Is_Created: {u.is_created}, PW: {u.hashed_password}")

db.close()
