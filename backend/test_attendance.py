from database import SessionLocal
import models
from datetime import date
import requests

def test_att():
    db = SessionLocal()
    try:
        # 1. Create a test agent "pari" if not exists
        pari = db.query(models.User).filter(models.User.username == "pari").first()
        if not pari:
            pari = models.User(username="pari", hashed_password="pw", role="agent", created_at=date.today())
            db.add(pari)
            db.commit()
            print("Created agent 'pari'")
        
        # 2. Check if attendance exists for today
        today = date.today()
        att = db.query(models.Attendance).filter(models.Attendance.user_id == pari.id, models.Attendance.date == today).first()
        if att:
             print(f"Existing attendance: {att.status}")
             # Delete it to test marking
             db.delete(att)
             db.commit()
             print("Deleted existing attendance to reset test.")

        # 3. Simulate API Call (using internal logic or requests if running)
        # Use requests against running server
        # Login as Admin first
        login_res = requests.post("http://localhost:8000/api/token", data={"username": "Admin@CJ", "password": "Abikrish@CJ."})
        if login_res.status_code != 200:
            print("Login failed:", login_res.text)
            return
            
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Mark Present
        print(f"Marking attendance for user_id={pari.id}...")
        res = requests.post("http://localhost:8000/api/attendance", json={"user_id": pari.id, "status": "present"}, headers=headers)
        
        if res.status_code == 200:
            print("Mark Success:", res.json())
        else:
            print("Mark Failed:", res.status_code, res.text)
            
        # Verify DB
        att_check = db.query(models.Attendance).filter(models.Attendance.user_id == pari.id, models.Attendance.date == today).first()
        if att_check:
             print(f"DB Verification: Status is {att_check.status}")
        else:
             print("DB Verification: FAILED (Not found)")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_att()
