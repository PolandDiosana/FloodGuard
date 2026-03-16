import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def dump_creds():
    try:
        conn = pymysql.connect(
            host='127.0.0.1',
            user='root',
            password='',
            database='floodguard',
            cursorclass=pymysql.cursors.DictCursor
        )
        with conn.cursor() as cursor:
            print("--- ALL ADMINS ---")
            cursor.execute("SELECT * FROM admins")
            admins = cursor.fetchall()
            for row in admins:
                print(row)
                
            print("\n--- ALL USERS ---")
            cursor.execute("SELECT * FROM users")
            users = cursor.fetchall()
            for row in users:
                # Remove sensitive info if needed, but for debugging we need to see what's there
                # We'll just print everything carefully
                print(row)
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    dump_creds()
