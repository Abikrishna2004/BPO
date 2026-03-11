import sqlite3

def run_migration():
    conn = sqlite3.connect('bpo_system.db')
    cursor = conn.cursor()
    
    # Check if profile_image exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if 'profile_image' not in columns:
        print("Adding profile_image to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN profile_image VARCHAR")
        
    print("Creating profile_requests table if not exists...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profile_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        new_username VARCHAR,
        new_email VARCHAR,
        status VARCHAR DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)
    
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    run_migration()
