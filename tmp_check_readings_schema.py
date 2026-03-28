import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv(override=True)

def check_schema():
    try:
        db = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'floodguard')
        )
        cursor = db.cursor()
        
        print("Checking iot_readings schema...")
        cursor.execute("DESCRIBE iot_readings")
        for col in cursor.fetchall():
            print(col)
            
        print("\nChecking latest reading from DYNAMIC-TEST-01...")
        cursor.execute("SELECT * FROM iot_readings WHERE sensor_id = 'DYNAMIC-TEST-01' ORDER BY created_at DESC LIMIT 1")
        row = cursor.fetchone()
        print(row)
        
        cursor.close()
        db.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
