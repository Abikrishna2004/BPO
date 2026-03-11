import requests

BASE_URL = "http://localhost:8000/api"

def login():
    data = {"username": "admin", "password": "password123"} # Default admin
    try:
        r = requests.post(f"{BASE_URL}/token", data=data)
        if r.status_code == 200:
            return r.json()["access_token"]
    except:
        pass
    # Maybe password is 'admin123' if seeded differently, or 'password'.
    # Try 'admin'/'admin'
    data = {"username": "admin", "password": "password"} # Seed default
    r = requests.post(f"{BASE_URL}/token", data=data)
    if r.status_code == 200:
        return r.json()["access_token"]
    print("Login Failed")
    print(r.text)
    return None

token = login()
if token:
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/users/5/achievements", headers=headers)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        print("Data (Last 2 days):")
        data = r.json()
        print(data[-2:])
    else:
        print("Error:")
        print(r.text)
