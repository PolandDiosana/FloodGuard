import mysql.connector
import os
import sys

# Add the current directory to the path so we can import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config import Config

def create_table():
    try:
        conn = mysql.connector.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )
        cursor = conn.cursor()
        
        print(f"Connected to database: {Config.DB_NAME}")
        
        # SQL to create the evacuation_centers table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS `evacuation_centers` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `name` varchar(255) NOT NULL,
          `location` varchar(255) NOT NULL,
          `lat` decimal(10, 8) NOT NULL,
          `lng` decimal(11, 8) NOT NULL,
          `capacity` int(11) DEFAULT 0,
          `slots_filled` int(11) DEFAULT 0,
          `status` enum('open', 'full', 'closed') DEFAULT 'open',
          `phone` varchar(20),
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
        
        cursor.execute(create_table_sql)
        conn.commit()
        print("Table 'evacuation_centers' created or already exists.")
        
        cursor.close()
        conn.close()
        print("Database connection closed.")
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")

if __name__ == "__main__":
    create_table()
