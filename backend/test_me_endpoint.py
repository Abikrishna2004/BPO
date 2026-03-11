
import requests

BASE_URL = "http://localhost:8000/api"

def test_me():
    # Login
    login_data = {"username": "Admin@CJ", "password": "Abikrish@CJ."}
    tokens = requests.post(f"{BASE_URL}/token", data=login_data)
    
    if tokens.status_code != 200:
        print(f"Login failed: {tokens.text}")
        return

    token = tokens.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get Me
    me = requests.get(f"{BASE_URL}/users/me", headers=headers)
    print(f"Status Code: {me.status_code}")
    print("Response JSON:")
    print(me.json())

if __name__ == "__main__":
    test_me()
