import pymysql
import os
import json
from dotenv import load_dotenv

load_dotenv()

def dump_to_file():
    try:
        conn = pymysql.connect(
            host='127.0.0.1',
            user='root',
            password='',
            database='floodguard',
            cursorclass=pymysql.cursors.DictCursor
        )
        data = {}
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, username, role FROM admins")
            data['admins'] = cursor.fetchall()
            
            cursor.execute("SELECT id, full_name, email, role FROM users")
            data['users'] = cursor.fetchall()
            
        with open('debug_creds.json', 'w') as f:
            json.dump(data, f, indent=4)
            
        print("Success: debug_creds.json created")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    dump_to_file()
