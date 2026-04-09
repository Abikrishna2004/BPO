import certifi
from pymongo import MongoClient
import sys

URL = "mongodb+srv://BPOUser:BPOUser@bpo.jgaltdc.mongodb.net/?retryWrites=true&w=majority"

def test_conn(name, **kwargs):
    print(f"--- Testing: {name} ---")
    try:
        client = MongoClient(URL, serverSelectionTimeoutMS=2000, **kwargs)
        # Use find_one on admin to check connection
        res = client.admin.command('ping')
        print(f"RESULT: {name} PASSED! Ping: {res}")
        return True
    except Exception as e:
        print(f"RESULT: {name} FAILED: {str(e)[:200]}")
        return False

print("STARTING TESTS")
test_conn("Default (no SSL options)")
test_conn("With Certifi", tlsCAFile=certifi.where())
test_conn("With Insecure SSL", tlsAllowInvalidCertificates=True)
print("TESTING DONE")
