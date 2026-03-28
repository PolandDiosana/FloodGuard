import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv(override=True)

def update_schema():
    try:
        db = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'floodguard')
        )
        cursor = db.cursor()
        
        # Add barangay and description
        print("Adding columns to sensors table...")
        try:
            cursor.execute("ALTER TABLE sensors ADD COLUMN barangay VARCHAR(100) AFTER name")
            print("Added barangay column.")
        except mysql.connector.Error as err:
            if err.errno == 1060: # Duplicate column name
                print("Barangay column already exists.")
            else:
                print(f"Error adding barangay: {err}")

        try:
            cursor.execute("ALTER TABLE sensors ADD COLUMN description TEXT AFTER barangay")
            print("Added description column.")
        except mysql.connector.Error as err:
            if err.errno == 1060: # Duplicate column name
                print("Description column already exists.")
            else:
                print(f"Error adding description: {err}")
            
        db.commit()
        cursor.close()
        db.close()
        print("Database update complete.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_schema()
