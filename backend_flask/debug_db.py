from config import Config
import mysql.connector

def check_reports():
    try:
        conn = mysql.connector.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id, reporter_name, type, location, image_url, status, timestamp FROM reports ORDER BY id DESC LIMIT 5")
        reports = cursor.fetchall()
        
        print(f"Found {len(reports)} recent reports:")
        for r in reports:
            print(f"REPORT_ROW|ID:{r['id']}|Status:{r['status']}|Img:{r['image_url']}|Timestamp:{r['timestamp']}")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_reports()
