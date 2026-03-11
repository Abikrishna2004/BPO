
import requests

BASE_URL = "http://localhost:8000"

def login(username, password):
    response = requests.post(f"{BASE_URL}/token", data={"username": username, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print("Login failed:", response.text)
        return None

def check_agents(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/dashboard/agents", headers=headers)
    if response.status_code == 200:
        agents = response.json()
        print(f"Agents found: {len(agents)}")
        for a in agents:
            print(f"- {a['username']} ({a['role']})")
    else:
        print("Failed to fetch agents:", response.text)

if __name__ == "__main__":
    # Assuming Admin@CJ / admin (default creds or whatever)
    # Trying generic admin login
    token = login("Admin@CJ", "admin") 
    if not token:
        # Try creating admin if not exists? Or just list users directly via DB script if API fails
        print("Could not get token. Checking DB directly...")
        import sqlite3
        conn = sqlite3.connect('bpo_system.db')
        c = conn.cursor()
        c.execute("SELECT id, username, role FROM users")
        rows = c.fetchall()
        print("DB Users:")
        for r in rows:
            print(r)
        conn.close()
    else:
        check_agents(token)
