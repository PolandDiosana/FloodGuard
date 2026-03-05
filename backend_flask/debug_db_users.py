import mysql.connector
from config import Config

DB_CONFIG = {
    'user': Config.DB_USER,
    'password': Config.DB_PASSWORD,
    'host': Config.DB_HOST,
    'database': Config.DB_NAME,
}

def debug_users():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        print("--- ADMINS TABLE ---")
        cursor.execute("SELECT * FROM admins")
        admins = cursor.fetchall()
        for a in admins:
            print(a)
            
        print("\n--- USERS TABLE ---")
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()
        for u in users:
            print(u)
            
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    debug_users()
