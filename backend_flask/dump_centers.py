import mysql.connector
from config import Config

def dump_centers():
    try:
        db = mysql.connector.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT id, name, status FROM evacuation_centers")
        centers = cursor.fetchall()
        print(f"Total centers in DB: {len(centers)}")
        for i, c in enumerate(centers):
            print(f"{i+1}. {c['name']} (ID: {c['id']}, Status: {c['status']})")
        cursor.close()
        db.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    dump_centers()
