from utils.db import get_db
import mysql.connector

def check_admins_schema():
    try:
        db = get_db()
        cursor = db.cursor()
        print("Admins Table Structure:")
        cursor.execute("DESCRIBE admins")
        for col in cursor.fetchall():
            print(col)
            
        print("\nUsers Table Structure:")
        cursor.execute("DESCRIBE users")
        for col in cursor.fetchall():
            print(col)
        cursor.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_admins_schema()
