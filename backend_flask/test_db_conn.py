import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def test_conn():
    print("Testing connection to 127.0.0.1...")
    try:
        conn = pymysql.connect(
            host='127.0.0.1',
            user='root',
            password='',
            database='floodguard',
            connect_timeout=5,
            cursorclass=pymysql.cursors.DictCursor
        )
        print("Connection successful!")
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, username, role FROM admins WHERE username = 'admin@system.com'")
            user = cursor.fetchone()
            if user:
                print(f"Found user: {user}")
            else:
                print("User admin@system.com NOT found in admins table.")
                
            cursor.execute("SELECT id, email, role FROM users WHERE email = 'admin@system.com'")
            user = cursor.fetchone()
            if user:
                print(f"Found user in users table: {user}")
        conn.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_conn()
