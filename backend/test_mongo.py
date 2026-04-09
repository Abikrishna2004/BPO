import certifi
from pymongo import MongoClient
import sys

URL = "mongodb+srv://BPOUser:BPOUser@bpo.jgaltdc.mongodb.net/?retryWrites=true&w=majority"

print("--- TESTING MONGO CONNECTION ---")

try:
    print(f"Connecting with certifi: {certifi.where()}")
    client = MongoClient(URL, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    # Trigger connection
    print("Selecting db BPO...")
    db = client["BPO"]
    print("Fetching server info...")
    info = client.server_info()
    print("SUCCESS: Connected!")
    print(f"Server Info: {info.get('version')}")
except Exception as e:
    print(f"FAILED with default: {e}")

try:
    print("\nConnecting WITH tlsAllowInvalidCertificates=True...")
    client = MongoClient(URL, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=5000)
    info = client.server_info()
    print("SUCCESS with tlsAllowInvalidCertificates!")
except Exception as e:
    print(f"FAILED even with tlsAllowInvalidCertificates: {e}")

try:
    print("\nConnecting with NO srv (using direct shard addresses from traceback)...")
    # ac-hnptdee-shard-00-01.jgaltdc.mongodb.net
    shard_url = "mongodb://BPOUser:BPOUser@ac-hnptdee-shard-00-01.jgaltdc.mongodb.net:27017,ac-hnptdee-shard-00-02.jgaltdc.mongodb.net:27017,ac-hnptdee-shard-00-00.jgaltdc.mongodb.net:27017/?replicaSet=atlas-hnptdee-shard-0"
    client = MongoClient(shard_url, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=5000)
    info = client.server_info()
    print("SUCCESS with direct connection!")
except Exception as e:
    print(f"FAILED direct connection: {e}")
