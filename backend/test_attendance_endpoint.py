import requests

BASE_URL = "http://localhost:8000/api"

def test_att_end():
    # Login
    login_data = {"username": "Admin@CJ", "password": "Abikrish@CJ."}
    tokens = requests.post(f"{BASE_URL}/token", data=login_data)
    
    if tokens.status_code != 200:
        print(f"Login failed: {tokens.text}")
        return

    token = tokens.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    att = requests.get(f"{BASE_URL}/attendance", headers=headers)
    print(f"Status Code: {att.status_code}")
    if att.status_code == 200:
        print("Attendance List:")
        print(att.json())
    else:
        print("Error Response:")
        print(att.text)

if __name__ == "__main__":
    test_att_end()
