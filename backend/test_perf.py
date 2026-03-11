import requests
import sys

try:
    # 1. Login to get token
    # Let's see what users exist. We can login as admin or just test the endpoints
    res_users = requests.get('http://localhost:8000/api/dashboard/agents') # This might fail if admin token is needed
    
    # Actually just login with hardcoded or create a test script
    # To get token, we need a valid user
    # Or just hit the FastAPI swagger file
    
    # We can query the db directly to trace the error
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from database import SessionLocal
    import models
    db = SessionLocal()
    users = db.query(models.User).filter(models.User.role == "agent").all()
    for u in users:
        print(f"Testing user {u.username}")
        # we can just use the requests with a spoofed token? No, we don't know the secret key.
        # But we can call the function directly!
        from routes import get_performance
        
        try:
            get_performance(user_id=u.id, db=db, current_user=u)
            print("get_performance OK")
        except Exception as e:
            print(f"Error in get_performance: {e}")
            import traceback
            traceback.print_exc()
            
except Exception as e:
    import traceback
    traceback.print_exc()
