import pymysql

def migrate():
    print("Starting migration: Adding profile columns to admins table...")
    try:
        conn = pymysql.connect(
            host='127.0.0.1',
            user='root',
            password='',
            db='floodguard'
        )
        with conn.cursor() as cursor:
            # Add full_name and phone columns to admins table
            print("Adding full_name and phone columns...")
            try:
                cursor.execute("ALTER TABLE admins ADD COLUMN full_name VARCHAR(255) AFTER username")
                print("Column 'full_name' added.")
            except pymysql.err.InternalError as e:
                if e.args[0] == 1060: # Duplicate column name
                    print("Column 'full_name' already exists.")
                else:
                    raise e

            try:
                cursor.execute("ALTER TABLE admins ADD COLUMN phone VARCHAR(20) AFTER full_name")
                print("Column 'phone' added.")
            except pymysql.err.InternalError as e:
                if e.args[0] == 1060: # Duplicate column name
                    print("Column 'phone' already exists.")
                else:
                    raise e
            
            # Update existing admins to have a default full_name if it's null
            print("Updating default names for existing admins...")
            cursor.execute("UPDATE admins SET full_name = 'Super Admin' WHERE full_name IS NULL OR full_name = ''")
            
            conn.commit()
            print("Migration completed successfully!")
            
            # Verify
            cursor.execute("DESCRIBE admins")
            print("New table structure for 'admins':")
            for row in cursor.fetchall():
                print(row)
                
        conn.close()
    except Exception as e:
        print(f"Migration FAILED: {e}")

if __name__ == "__main__":
    migrate()
