from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User
from database import SQLALCHEMY_DATABASE_URL
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

user = db.query(User).filter(User.username == "admin").first()
if user:
    user.hashed_password = pwd_context.hash("password123")
    db.commit()
    print("Admin password reset to 'password123'")
else:
    print("Admin not found")

db.close()
