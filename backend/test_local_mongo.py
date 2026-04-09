from pymongo import MongoClient
import sys

URL = "mongodb://localhost:27017"
print(f"--- TESTING LOCAL MONGO ---")
try:
    client = MongoClient(URL, serverSelectionTimeoutMS=2000)
    names = client.list_database_names()
    print(f"SUCCESS! Local databases: {names}")
except Exception as e:
    print(f"FAILED to connect to local: {e}")
