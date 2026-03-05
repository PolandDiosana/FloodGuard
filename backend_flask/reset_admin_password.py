
import pymysql
from config import Config
from werkzeug.security import generate_password_hash

def reset_password():
    print("Resetting admin password...")
    try:
        connection = pymysql.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME,
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        
        new_password = "admin123"
        new_hash = generate_password_hash(new_password)
        
        print(f"New Hash generated: {new_hash}")
        
        with connection.cursor() as cursor:
            sql = "UPDATE admins SET password = %s WHERE username = %s"
            cursor.execute(sql, (new_hash, "admin@system.com"))
            print(f"Updated {cursor.rowcount} row(s).")
            
            # Verify
            cursor.execute("SELECT * FROM admins WHERE username = 'admin@system.com'")
            user = cursor.fetchone()
            print(f"Verified User: {user['username']}")
            print(f"Verified Hash: {user['password']}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    reset_password()
