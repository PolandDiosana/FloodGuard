from utils.db import get_db
import mysql.connector

def fix_missing_columns():
    try:
        db = get_db()
        cursor = db.cursor()
        
        # 1. Fix 'users' table
        print("Checking 'users' table...")
        cursor.execute("DESCRIBE users")
        u_cols = {row[0] for row in cursor.fetchall()}
        
        if 'status' not in u_cols:
            print("Adding 'status' to 'users'...")
            cursor.execute("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'")
        if 'avatar_url' not in u_cols:
            print("Adding 'avatar_url' to 'users'...")
            cursor.execute("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL")
            
        # 2. Fix 'admins' table
        print("\nChecking 'admins' table...")
        cursor.execute("DESCRIBE admins")
        a_cols = {row[0] for row in cursor.fetchall()}
        
        if 'status' not in a_cols:
            print("Adding 'status' to 'admins'...")
            cursor.execute("ALTER TABLE admins ADD COLUMN status VARCHAR(20) DEFAULT 'active'")
        if 'avatar_url' not in a_cols:
            print("Adding 'avatar_url' to 'admins'...")
            cursor.execute("ALTER TABLE admins ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL")
        if 'full_name' not in a_cols:
            print("Adding 'full_name' to 'admins'...")
            cursor.execute("ALTER TABLE admins ADD COLUMN full_name VARCHAR(100) DEFAULT NULL")
        if 'created_at' not in a_cols:
            print("Adding 'created_at' to 'admins'...")
            cursor.execute("ALTER TABLE admins ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

        db.commit()
        print("\nSUCCESS: All missing columns added.")
        cursor.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_missing_columns()
