import pymysql
from config import Config

def update_schema():
    conn = pymysql.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME
    )
    cursor = conn.cursor()
    
    try:
        print("Checking if 'password' column exists in 'users' table...")
        cursor.execute("SHOW COLUMNS FROM users LIKE 'password'")
        result = cursor.fetchone()
        
        if not result:
            print("Adding 'password' column to 'users' table...")
            cursor.execute("ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL AFTER barangay")
            conn.commit()
            print("Column 'password' added successfully.")
        else:
            print("Column 'password' already exists.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    update_schema()
