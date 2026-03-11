from database import SessionLocal, engine
from sqlalchemy import text
import datetime

def migrate():
    print("Migrating created_at...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
            print("Added created_at column.")
            # Set default for existing users to 1 year ago so they see all history
            one_year_ago = datetime.datetime.now() - datetime.timedelta(days=365)
            conn.execute(text(f"UPDATE users SET created_at = '{one_year_ago}' WHERE created_at IS NULL"))
            print("Updated existing users created_at default.")
        except Exception as e:
            print(f"Skipping alter table (likely exists): {e}")

if __name__ == "__main__":
    migrate()
