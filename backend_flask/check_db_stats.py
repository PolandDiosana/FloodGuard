from utils.db import get_db
import mysql.connector

def check_db_integrity():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        # 1. Total counts in raw tables
        cursor.execute("SELECT COUNT(*) as count FROM users")
        u_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM admins")
        a_count = cursor.fetchone()['count']
        
        print(f"RAW DATABASE STATS:")
        print(f"- Users table: {u_count} records")
        print(f"- Admins table: {a_count} records")
        
        # 2. Check roles
        print("\nROLES IN USERS TABLE:")
        cursor.execute("SELECT role, COUNT(*) as count FROM users GROUP BY role")
        for row in cursor.fetchall():
            print(f"- {row['role']}: {row['count']}")
            
        print("\nROLES IN ADMINS TABLE:")
        cursor.execute("SELECT role, COUNT(*) as count FROM admins GROUP BY role")
        for row in cursor.fetchall():
            print(f"- {row['role']}: {row['count']}")

        cursor.close()
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    check_db_integrity()
