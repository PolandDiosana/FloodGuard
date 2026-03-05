
import pymysql
from config import Config
from werkzeug.security import generate_password_hash

def fix_lgu_account():
    print("Checking LGU Moderator account...")
    try:
        connection = pymysql.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME,
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        
        with connection.cursor() as cursor:
            # 1. Check if user exists
            cursor.execute("SELECT * FROM admins WHERE username = 'moderator@lgu.gov'")
            user = cursor.fetchone()
            
            if user:
                print(f"✅ Account found: {user['username']} (Role: {user['role']})")
                
                # 2. Reset password to ensure hash compatibility
                print("Resetting password to 'password123'...")
                new_hash = generate_password_hash("password123")
                
                cursor.execute("UPDATE admins SET password = %s WHERE id = %s", (new_hash, user['id']))
                print("✅ Password updated successfully.")
                
            else:
                print("❌ Account 'moderator@lgu.gov' NOT found in database.")
                print("Creating account now...")
                
                new_hash = generate_password_hash("password123")
                cursor.execute(
                    "INSERT INTO admins (username, password, role) VALUES (%s, %s, 'lgu_admin')",
                    ('moderator@lgu.gov', new_hash)
                )
                print("✅ Account created successfully.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    fix_lgu_account()
