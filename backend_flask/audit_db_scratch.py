import mysql.connector
import os
from dotenv import load_dotenv

# Replicate get_db() logic to check connectivity
load_dotenv(override=True)
db_config = {
    "host": os.getenv('DB_HOST', 'localhost'),
    "user": os.getenv('DB_USER', 'root'),
    "password": os.getenv('DB_PASSWORD', ''),
    "database": os.getenv('DB_NAME', 'floodguard')
}

def audit_db_from_scratch():
    try:
        print(f"Connecting to {db_config['database']} on {db_config['host']}...")
        db = mysql.connector.connect(**db_config)
        cursor = db.cursor(dictionary=True)
        
        # 1. Total records
        tables = ['users', 'admins']
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
            count = cursor.fetchone()['count']
            print(f"- Table '{table}': {count} records")
            
            if count > 0:
                cursor.execute(f"SELECT * FROM {table} LIMIT 1")
                row = cursor.fetchone()
                print(f"  Sample {table} columns: {list(row.keys())}")
        
        cursor.close()
        db.close()
    except Exception as e:
        print(f"CRITICAL DB ERROR: {e}")

if __name__ == "__main__":
    audit_db_from_scratch()
