from utils.db import get_db
import mysql.connector
import datetime

def debug_get_all_users():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        print("Testing Fetch Users...")
        cursor.execute("SELECT id, full_name, email, role, barangay, status, created_at, avatar_url FROM users")
        mobile_users = cursor.fetchall()
        print(f"Found {len(mobile_users)} users in 'users' table")
        
        for u in mobile_users:
            print(f"User ID: {u['id']}, type(created_at): {type(u['created_at'])}, value: {u['created_at']}")
            joined = 'N/A'
            if u['created_at']:
                if isinstance(u['created_at'], (datetime.datetime, datetime.date)):
                    joined = u['created_at'].strftime('%Y-%m-%d')
                else:
                    joined = str(u['created_at'])
            print(f"Mapped joined: {joined}")

        print("\nTesting Fetch Admins...")
        cursor.execute("SELECT id, username, full_name, role, created_at, avatar_url FROM admins")
        admins = cursor.fetchall()
        print(f"Found {len(admins)} admins in 'admins' table")
        
        for a in admins:
            print(f"Admin ID: {a['id']}, type(created_at): {type(a['created_at'])}, value: {a['created_at']}")
            joined = 'N/A'
            if a['created_at']:
                if isinstance(a['created_at'], (datetime.datetime, datetime.date)):
                    joined = a['created_at'].strftime('%Y-%m-%d')
                else:
                    joined = str(a['created_at'])
            print(f"Mapped joined: {joined}")

        cursor.close()
        print("\nExecution Finished Successfully")
    except Exception as e:
        print(f"\nERROR DETECTED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import os
    import sys
    # Add parent dir to path if needed to find utils.db
    sys.path.append(os.getcwd())
    debug_get_all_users()
