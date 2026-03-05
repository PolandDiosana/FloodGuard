import pymysql
from config import Config

def migrate_db():
    try:
        connection = pymysql.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )
        cursor = connection.cursor()
        
        # Check if column exists
        cursor.execute("DESCRIBE users")
        columns = [column[0] for column in cursor.fetchall()]
        
        if 'must_change_password' not in columns:
            print("Adding must_change_password column to users table...")
            # Default to 1 (True) for new migration so existing users (if any w/ default pw) might be forced or 0 if we assume they are safe.
            # Best practice for this request: Default to 0 for existing custom users, but 1 for new ones.
            # However, prompt implies "default password ('floodguard123') will automatically be generated... After that... require them to change".
            # So for existing users, let's default to 0 to avoid locking them out unless we know they have default password.
            # But simpler to just add it as default 1 for new rows, and we can mass update existing if needed.
            # Let's just set DEFAULT 1.
            cursor.execute("ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT 1")
            connection.commit()
            print("Column added successfully.")
        else:
            print("must_change_password column already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    migrate_db()
