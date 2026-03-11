from database import SessionLocal
import models
import auth

def update_admin():
    db = SessionLocal()
    try:
        # Find existing admin
        # We search by role "admin" to find the main admin account
        admin = db.query(models.User).filter(models.User.role == "admin").first()

        new_username = "Admin@CJ"
        new_password = "Abikrish@CJ."
        hashed_pw = auth.get_password_hash(new_password)

        if admin:
            print(f"Found admin account: {admin.username} (ID: {admin.id})")
            admin.username = new_username
            admin.hashed_password = hashed_pw
            db.commit()
            print(f"Successfully updated admin credentials.\nUsername: {new_username}\nPassword: {new_password}")
        else:
            print("No admin account found. Creating a new one...")
            new_admin = models.User(
                username=new_username,
                email="admin@cj.com", # Placeholder email
                hashed_password=hashed_pw,
                role="admin",
                status="offline",
                is_created=True
            )
            db.add(new_admin)
            db.commit()
            print(f"Successfully created new admin.\nUsername: {new_username}\nPassword: {new_password}")
            
    except Exception as e:
        print(f"Error updating admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_admin()
