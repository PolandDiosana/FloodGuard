
import pymysql
from config import Config

def check_admins():
    print("Checking database users...")
    try:
        connection = pymysql.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME,
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, username, password, role FROM admins")
            users = cursor.fetchall()
            
            if not users:
                print("No users found in 'admins' table!")
            
            for user in users:
                print(f"User: {user['username']}, Role: {user['role']}, Password Hash: {user['password'][:20]}...")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    check_admins()
