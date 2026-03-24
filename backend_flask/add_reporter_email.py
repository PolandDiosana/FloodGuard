import mysql.connector
from config import Config

def add_reporter_email_column():
    """Add reporter_email column to reports table for dismissal notifications"""

    try:
        # Connect to database
        conn = mysql.connector.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )
        cursor = conn.cursor()

        # Check if column already exists
        cursor.execute("SHOW COLUMNS FROM reports LIKE 'reporter_email'")
        if cursor.fetchone():
            print("reporter_email column already exists")
            cursor.close()
            conn.close()
            return

        # Add the column
        cursor.execute("""
            ALTER TABLE reports
            ADD COLUMN reporter_email VARCHAR(255) DEFAULT NULL
            AFTER reporter_name
        """)

        conn.commit()
        print("Successfully added reporter_email column to reports table")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error adding reporter_email column: {e}")

if __name__ == "__main__":
    add_reporter_email_column()</content>
<parameter name="filePath">c:\xampp\htdocs\FloodGuard\backend_flask\add_reporter_email.py