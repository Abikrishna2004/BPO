import certifi
import socket
from pymongo import MongoClient
import sys

URL = "mongodb+srv://BPOUser:BPOUser@bpo.jgaltdc.mongodb.net/?retryWrites=true&w=majority"

def test_conn(name, **kwargs):
    print(f"--- Testing: {name} ---")
    try:
        client = MongoClient(URL, serverSelectionTimeoutMS=5000, **kwargs)
        res = client.admin.command('ping')
        print(f"RESULT: {name} PASSED! Ping: {res}")
        return True
    except Exception as e:
        print(f"RESULT: {name} FAILED: {str(e)[:200]}")
        return False

print("STARTING TESTS")
test_conn("Force IPv4", directConnection=False)
test_conn("Force IPv4 + Certifi", tlsCAFile=certifi.where())
print("TESTING DONE")
