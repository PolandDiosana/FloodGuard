import mysql.connector
from werkzeug.security import check_password_hash, generate_password_hash
from backend_flask.config import Config

def debug_db():
    try:
        conn = mysql.connector.connect(
            host='127.0.0.1',
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM admins")
        users = cursor.fetchall()
        
        if not users:
            print("NO USERS FOUND IN 'admins' TABLE!")
        
        for user in users:
            print(f"Found User: {user['username']}")
            print(f"Role: {user['role']}")
            # print(f"Stored Hash: {user['password']}")
            
            # Test 'admin123' for super admin
            if user['username'] == 'admin@system.com':
                match = check_password_hash(user['password'], 'admin123')
                print(f"Password 'admin123' matches? {match}")
                if not match:
                     print(f"Correct Hash should be: {generate_password_hash('admin123')}")

            # Test 'password123' for lgu
            if user['username'] == 'moderator@lgu.gov':
                match = check_password_hash(user['password'], 'password123')
                print(f"Password 'password123' matches? {match}")
        
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    debug_db()
