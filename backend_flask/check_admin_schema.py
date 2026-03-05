import pymysql
from config import Config

def check_schema():
    try:
        connection = pymysql.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )
        cursor = connection.cursor()
        
        print("\n--- Users Table Columns ---")
        cursor.execute("SHOW COLUMNS FROM users")
        columns = [col[0] for col in cursor.fetchall()]
        print(columns)
        if 'role' in columns:
            print("Role column EXISTS")
        else:
            print("Role column MISSING")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

if __name__ == "__main__":
    check_schema()
