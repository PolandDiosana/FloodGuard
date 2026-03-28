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
        
        for table in ['sensors', 'iot_readings', 'water_levels']:
            print(f"--- {table.upper()} SCHEMA ---")
            cursor.execute(f"DESCRIBE {table}")
            for row in cursor.fetchall():
                print(row)
            print("\n")
            
        cursor.close()
        db.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
