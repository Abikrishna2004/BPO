from database import SessionLocal
import models
from datetime import datetime, date as date_type
from routes import AttendanceResponse
from typing import Optional

def debug_att():
    db = SessionLocal()
    try:
        today = datetime.now().date()
        print(f"Querying for date: {today}")
        atts = db.query(models.Attendance).filter(models.Attendance.date == today).all()
        print(f"Found {len(atts)} records.")
        
        for a in atts:
            print(f"Record ID: {a.id}, UserID: {a.user_id}, Date: {a.date} (Type: {type(a.date)}), Status: {a.status}, MarkedBy: {a.marked_by}")
            try:
                resp = AttendanceResponse(
                    id=a.id,
                    user_id=a.user_id,
                    date=a.date,
                    status=a.status,
                    marked_by=a.marked_by
                )
                print(f"Record {a.id}: Serialization OK")
            except Exception as e:
                print(f"Record {a.id}: Serialization FAILED. Error: {e}")
                print(f"DEBUG: id={a.id} ({type(a.id)}), user_id={a.user_id} ({type(a.user_id)})")
                import sys; sys.exit(1)
                
    except Exception as e:
        print(f"DB Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_att()
