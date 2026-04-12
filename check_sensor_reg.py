
import mysql.connector
import os
from dotenv import load_dotenv

# Try to find .env in backend_flask
env_path = r'c:\xampp\htdocs\FloodGuard\backend_flask\.env'
load_dotenv(dotenv_path=env_path)

def check_sensor():
    try:
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'floodguard')
        )
        cur = conn.cursor()
        cur.execute("SELECT * FROM sensors WHERE id = 'Sensor-0001'")
        sensor = cur.fetchone()
        if sensor:
            print(f"Found sensor: {sensor}")
        else:
            print("Sensor-0001 not found.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_sensor()
