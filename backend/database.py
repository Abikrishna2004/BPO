import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pymongo import MongoClient
import certifi
import ssl

class Settings(BaseSettings):
    # This will read from .env if present
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8', extra="ignore")

    MONGODB_URL: str = ""
    DATABASE_NAME: str = "BPO"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGINS: str = "*"
settings = Settings()

client = None
db = None

if settings.MONGODB_URL:
    try:
        client = MongoClient(
            settings.MONGODB_URL,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000
        )
        db = client[settings.DATABASE_NAME]
        
        # Test connection
        client.admin.command('ping')
        print("MongoDB Atlas: Connection Successful")
    except Exception as e:
        print(f"MongoDB Atlas: Connection Failed on Startup: {e}")
        db = None
else:
    print("MongoDB Atlas: URL NOT CONFIGURED (Check .env for MONGODB_URL)")

def get_db():
    if db is None:
        raise Exception("Database not initialized. Please configure MONGODB_URL in .env")
    return db
