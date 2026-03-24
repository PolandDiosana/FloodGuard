from config import Config
import mysql.connector
from datetime import datetime

def add_verification_audit_columns():
    """Add audit trail columns to reports table for verification tracking"""
    try:
        conn = mysql.connector.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )
        cursor = conn.cursor()

        # Check if columns already exist
        cursor.execute("SHOW COLUMNS FROM reports LIKE 'verified_by'")
        result = cursor.fetchone()

        if not result:
            print("Adding verification audit columns to reports table...")
            cursor.execute("""
                ALTER TABLE reports 
                ADD COLUMN verified_by VARCHAR(255),
                ADD COLUMN verified_at DATETIME,
                ADD COLUMN rejection_reason VARCHAR(500),
                ADD COLUMN flood_level_reported VARCHAR(100),
                ADD COLUMN latitude DECIMAL(10,8),
                ADD COLUMN longitude DECIMAL(11,8),
                ADD COLUMN maps_url VARCHAR(500)
            """)
            conn.commit()
            print("Verification audit columns added successfully.")
        else:
            print("Verification audit columns already exist.")

        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Failed to add verification audit columns: {e}")

if __name__ == "__main__":
    add_verification_audit_columns()