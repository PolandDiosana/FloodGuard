from config import Config
import mysql.connector

def migrate():
    try:
        conn = mysql.connector.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("SHOW COLUMNS FROM reports LIKE 'image_url'")
        result = cursor.fetchone()
        
        if not result:
            print("Adding image_url column to reports table...")
            cursor.execute("ALTER TABLE reports ADD COLUMN image_url VARCHAR(255) DEFAULT NULL")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column image_url already exists.")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Migration Failed: {e}")

if __name__ == "__main__":
    migrate()
