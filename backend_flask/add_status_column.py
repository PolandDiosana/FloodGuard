import mysql.connector
from config import Config

DB_CONFIG = {
    'user': Config.DB_USER,
    'password': Config.DB_PASSWORD,
    'host': Config.DB_HOST,
    'database': Config.DB_NAME,
}

def add_status_column():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("Checking for 'status' column in 'users' table...")
        
        # Check if column exists
        cursor.execute("SHOW COLUMNS FROM users LIKE 'status'")
        result = cursor.fetchone()
        
        if not result:
            print("Adding 'status' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active'")
            conn.commit()
            print("Column 'status' added successfully.")
        else:
            print("Column 'status' already exists.")
            
    except mysql.connector.Error as err:
        print(f"Error: {err}")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    add_status_column()
