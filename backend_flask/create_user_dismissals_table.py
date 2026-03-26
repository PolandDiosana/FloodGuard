import mysql.connector
from config import Config

DB_CONFIG = {
    'user': Config.DB_USER,
    'password': Config.DB_PASSWORD,
    'host': Config.DB_HOST,
    'database': Config.DB_NAME,
}

def create_user_dismissals_table():
    """Create table to track user-specific alert dismissals (not system-wide)"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Create user_alert_dismissals table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS `user_alert_dismissals` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `alert_id` INT NOT NULL,
            `dismissed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY `unique_user_alert` (`user_id`, `alert_id`),
            FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
            FOREIGN KEY (`alert_id`) REFERENCES `alerts`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
        
        cursor.execute(create_table_sql)
        conn.commit()
        print("✓ user_alert_dismissals table created successfully")
        
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    create_user_dismissals_table()
