import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv(override=True)

try:
    db = mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'floodguard')
    )
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id, username, role FROM admins")
    for row in cursor.fetchall():
        print(f"ID: {row['id']}, Username: {row['username']}, Role: {row['role']}")
    cursor.close()
    db.close()
except Exception as e:
    print(e)
