import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def verify():
    try:
        conn = pymysql.connect(
            host=os.getenv('DB_HOST', '127.0.0.1'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'floodguard_db'),
            port=3306
        )
        with conn.cursor() as cursor:
            # Check user count
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            print(f"User count: {user_count}")
            
            # Check for moderator
            cursor.execute("SELECT name, email FROM users WHERE role='moderator' LIMIT 1")
            mod = cursor.fetchone()
            if mod:
                print(f"Moderator found: {mod[0]} ({mod[1]})")
            else:
                print("No moderator found in 'users' table.")
                
            # Check for superadmin in 'admins' table
            cursor.execute("SELECT name, email FROM admins LIMIT 1")
            admin = cursor.fetchone()
            if admin:
                print(f"SuperAdmin found: {admin[0]} ({admin[1]})")
            else:
                print("No admin found in 'admins' table.")
                
        conn.close()
        print("Verification successful!")
    except Exception as e:
        print(f"Verification failed: {e}")

if __name__ == "__main__":
    verify()
