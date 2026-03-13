"""
Migration: Create user_subscriptions and alert_escalation_log tables.
Run this ONCE to add the two new tables needed for Emergency Escalation
and User Subscriptions modules.

Usage: python migrate_escalation_subscriptions.py
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'floodguard_db')

conn = mysql.connector.connect(
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME
)
cursor = conn.cursor()

print(f"Connected to database: {DB_NAME} on {DB_HOST}")

# ──────────────────────────────────────────────
# 1. user_subscriptions
# ──────────────────────────────────────────────
cursor.execute("""
CREATE TABLE IF NOT EXISTS `user_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `barangay` varchar(150) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_subscription` (`user_id`, `barangay`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""")
print("✔ Table `user_subscriptions` ready.")

# ──────────────────────────────────────────────
# 2. alert_escalation_log
# Tracks every manual/auto escalation event for auditing
# ──────────────────────────────────────────────
cursor.execute("""
CREATE TABLE IF NOT EXISTS `alert_escalation_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alert_id` int(11) NOT NULL,
  `from_level` varchar(20),
  `to_level` varchar(20) NOT NULL,
  `reason` varchar(255) DEFAULT 'Manual escalation',
  `escalated_by` varchar(100) DEFAULT 'system',
  `escalated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""")
print("✔ Table `alert_escalation_log` ready.")

# ──────────────────────────────────────────────
# 3. Add `escalation_count` column to alerts if missing
# (tracks how many times an alert has been escalated)
# ──────────────────────────────────────────────
cursor.execute("""
SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = %s
  AND TABLE_NAME = 'alerts'
  AND COLUMN_NAME = 'escalation_count'
""", (DB_NAME,))
(exists,) = cursor.fetchone()
if not exists:
    cursor.execute("""
        ALTER TABLE `alerts`
        ADD COLUMN `escalation_count` int(11) NOT NULL DEFAULT 0
    """)
    print("✔ Column `alerts.escalation_count` added.")
else:
    print("✔ Column `alerts.escalation_count` already exists.")

# ──────────────────────────────────────────────
# 4. Add `watch` level to alerts.level ENUM if missing
# Original enum: advisory, warning, critical
# We need: advisory, watch, warning, critical
# ──────────────────────────────────────────────
cursor.execute("""
SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = %s
  AND TABLE_NAME = 'alerts'
  AND COLUMN_NAME = 'level'
""", (DB_NAME,))
row = cursor.fetchone()
if row and 'watch' not in row[0]:
    cursor.execute("""
        ALTER TABLE `alerts`
        MODIFY COLUMN `level`
        ENUM('advisory','watch','warning','critical') NOT NULL
    """)
    print("✔ ENUM `alerts.level` updated to include 'watch'.")
else:
    print("✔ ENUM `alerts.level` already includes 'watch'.")

conn.commit()
cursor.close()
conn.close()
print("\n✅ Migration complete.")
