import pymysql
import time

def check():
    print("Testing connection to 127.0.0.1:3306...")
    try:
        start = time.time()
        conn = pymysql.connect(
            host='127.0.0.1',
            user='root',
            password='',
            connect_timeout=3
        )
        print(f"Connected in {time.time() - start:.2f}s")
        with conn.cursor() as cursor:
            cursor.execute("SHOW DATABASES")
            print("Databases:", cursor.fetchall())
            
            cursor.execute("USE floodguard")
            cursor.execute("SHOW TABLES")
            print("Tables in floodguard:", cursor.fetchall())
            
            cursor.execute("SELECT id, username, role FROM admins")
            print("Admins:", cursor.fetchall())
        conn.close()
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    check()
