import pymysql
from config import Config

def migrate_role():
    try:
        connection = pymysql.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )
        cursor = connection.cursor()
        
        print("Adding role column to users table...")
        # Default to 'user'
        cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'")
        connection.commit()
        print("Column added successfully.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    migrate_role()
