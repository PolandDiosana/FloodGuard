import mysql.connector
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(override=True)

def debug_time():
    try:
        db = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'floodguard')
        )
        cursor = db.cursor(dictionary=True)
        
        print(f"Backend UTC now: {datetime.utcnow()}")
        print(f"Backend Local now: {datetime.now()}")
        
        cursor.execute("SELECT NOW() as db_now")
        print(f"Database NOW(): {cursor.fetchone()['db_now']}")
        
        cursor.execute("SELECT created_at FROM iot_readings ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        if row:
            print(f"Latest reading created_at: {row['created_at']}")
            age = datetime.utcnow() - row['created_at']
            print(f"Age (utcnow - created_at): {age.total_seconds()} seconds")
            
            age_local = datetime.now() - row['created_at']
            print(f"Age (now - created_at): {age_local.total_seconds()} seconds")
            
        cursor.close()
        db.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_time()
