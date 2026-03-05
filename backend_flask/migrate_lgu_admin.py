import mysql.connector
from config import Config

DB_CONFIG = {
    'user': Config.DB_USER,
    'password': Config.DB_PASSWORD,
    'host': Config.DB_HOST,
    'database': Config.DB_NAME,
}

def migrate_lgu_admin():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        print("Checking for 'moderator@lgu.gov' in 'admins' table...")
        cursor.execute("SELECT * FROM admins WHERE username = 'moderator@lgu.gov'")
        admin = cursor.fetchone()
        
        if admin:
            print(f"Found LGU Admin in admins table: {admin}")
            
            # Check if email already exists in users
            cursor.execute("SELECT * FROM users WHERE email = 'moderator@lgu.gov'")
            existing_user = cursor.fetchone()
            
            if existing_user:
                print("User with this email already exists in users table. Skipping migration.")
            else:
                print("Migrating to users table...")
                # Insert into users
                # We need to provide full_name, phone, etc.
                # using placeholders for now
                cursor.execute("""
                    INSERT INTO users (full_name, email, phone, barangay, password, role, status, must_change_password)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    "LGU Moderator", 
                    admin['username'], 
                    "N/A", 
                    "Barangay Mabolo", # Default location
                    admin['password'], 
                    "lgu_admin", 
                    "active",
                    0
                ))
                
                print("Deleting from admins table...")
                cursor.execute("DELETE FROM admins WHERE id = %s", (admin['id'],))
                
                conn.commit()
                print("Migration successful.")
        else:
            print("LGU Admin not found in admins table (already migrated?).")
            
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        conn.rollback()
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    migrate_lgu_admin()
