from utils.db import get_db
import mysql.connector

try:
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    print("--- Roles in 'admins' table ---")
    cursor.execute("SELECT DISTINCT role FROM admins")
    roles_admins = cursor.fetchall()
    for row in roles_admins:
        print(row['role'])
        
    print("\n--- Roles in 'users' table ---")
    cursor.execute("SELECT DISTINCT role FROM users")
    roles_users = cursor.fetchall()
    for row in roles_users:
        print(row['role'])
        
    print("\n--- Sample records from 'admins' ---")
    cursor.execute("SELECT id, username, role FROM admins LIMIT 5")
    for row in cursor.fetchall():
        print(row)
        
    print("\n--- Sample records from 'users' ---")
    cursor.execute("SELECT id, email, role FROM users LIMIT 5")
    for row in cursor.fetchall():
        print(row)
        
    cursor.close()
except Exception as e:
    print(f"Error: {e}")
