"""
migrate_all.py — FloodGuard Consolidated Database Migration
============================================================
Run this ONCE (or any time) before starting the Flask server.
It is fully idempotent: safe to run multiple times.

Usage:
    cd backend_flask
    python migrate_all.py

Exit codes:
    0 — all migrations completed (or already up-to-date)
    1 — a migration step failed (error printed to stderr)
"""

import sys
import os
import mysql.connector

# Allow 'from config import Config' even when run from a different CWD
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import Config


# ── Helpers ────────────────────────────────────────────────────────────────────

def connect():
    return mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
    )


def col_exists(cursor, db, table, col):
    cursor.execute(
        """SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = %s""",
        (db, table, col),
    )
    return cursor.fetchone()[0] > 0


def tbl_exists(cursor, db, table):
    cursor.execute(
        """SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
           WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s""",
        (db, table),
    )
    return cursor.fetchone()[0] > 0


def add_col(cursor, conn, db, table, col, definition):
    if not col_exists(cursor, db, table, col):
        cursor.execute(f"ALTER TABLE `{table}` ADD COLUMN `{col}` {definition}")
        conn.commit()
        print(f"  [+] {table}.{col} added.")
    else:
        print(f"  [=] {table}.{col} already exists.")


# ── Main migration ─────────────────────────────────────────────────────────────

def run():
    conn = connect()
    cursor = conn.cursor()
    db = Config.DB_NAME

    print(f"Connected to '{db}' on {Config.DB_HOST}\n")

    # ── Step 1: iot_readings ───────────────────────────────────────────────────
    print("Step 1 — Table: iot_readings")
    if not tbl_exists(cursor, db, "iot_readings"):
        cursor.execute("""
            CREATE TABLE `iot_readings` (
              `id`           INT NOT NULL AUTO_INCREMENT,
              `sensor_id`    VARCHAR(50) NOT NULL,
              `raw_distance` DECIMAL(10,2) DEFAULT NULL,
              `flood_level`  DECIMAL(10,2) DEFAULT NULL,
              `status`       VARCHAR(50) DEFAULT 'NORMAL',
              `latitude`     DECIMAL(10,8) DEFAULT NULL,
              `longitude`    DECIMAL(11,8) DEFAULT NULL,
              `maps_url`     VARCHAR(500) DEFAULT NULL,
              `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              INDEX `idx_sensor_id` (`sensor_id`),
              INDEX `idx_created_at` (`created_at`),
              FOREIGN KEY (`sensor_id`) REFERENCES `sensors`(`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        conn.commit()
        print("  [+] iot_readings created.")
    else:
        print("  [=] iot_readings already exists.")

    # ── Step 2: user_subscriptions ─────────────────────────────────────────────
    print("Step 2 — Table: user_subscriptions")
    if not tbl_exists(cursor, db, "user_subscriptions"):
        cursor.execute("""
            CREATE TABLE `user_subscriptions` (
              `id`         INT(11) NOT NULL AUTO_INCREMENT,
              `user_id`    INT(11) NOT NULL,
              `barangay`   VARCHAR(150) NOT NULL,
              `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              UNIQUE KEY `unique_subscription` (`user_id`, `barangay`),
              FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        conn.commit()
        print("  [+] user_subscriptions created.")
    else:
        print("  [=] user_subscriptions already exists.")

    # ── Step 3: alert_escalation_log ──────────────────────────────────────────
    print("Step 3 — Table: alert_escalation_log")
    if not tbl_exists(cursor, db, "alert_escalation_log"):
        cursor.execute("""
            CREATE TABLE `alert_escalation_log` (
              `id`           INT(11) NOT NULL AUTO_INCREMENT,
              `alert_id`     INT(11) NOT NULL,
              `from_level`   VARCHAR(20) DEFAULT NULL,
              `to_level`     VARCHAR(20) NOT NULL,
              `reason`       VARCHAR(255) DEFAULT 'Manual escalation',
              `escalated_by` VARCHAR(100) DEFAULT 'system',
              `escalated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        conn.commit()
        print("  [+] alert_escalation_log created.")
    else:
        print("  [=] alert_escalation_log already exists.")

    # ── Step 4: user_alert_dismissals ─────────────────────────────────────────
    print("Step 4 — Table: user_alert_dismissals")
    if not tbl_exists(cursor, db, "user_alert_dismissals"):
        cursor.execute("""
            CREATE TABLE `user_alert_dismissals` (
              `id`           INT NOT NULL AUTO_INCREMENT,
              `user_id`      INT NOT NULL,
              `alert_id`     INT NOT NULL,
              `dismissed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              UNIQUE KEY `unique_user_alert` (`user_id`, `alert_id`),
              FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
              FOREIGN KEY (`alert_id`) REFERENCES `alerts`(`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        conn.commit()
        print("  [+] user_alert_dismissals created.")
    else:
        print("  [=] user_alert_dismissals already exists.")

    # ── Step 5: admins — missing columns ──────────────────────────────────────
    print("Step 5 — Columns: admins")
    add_col(cursor, conn, db, "admins", "full_name", "VARCHAR(255) DEFAULT NULL AFTER username")
    add_col(cursor, conn, db, "admins", "phone",     "VARCHAR(20) DEFAULT NULL")
    add_col(cursor, conn, db, "admins", "status",    "VARCHAR(20) DEFAULT 'active'")
    add_col(cursor, conn, db, "admins", "avatar_url","VARCHAR(255) DEFAULT NULL")

    # Set default display name for existing admins that have none
    cursor.execute("UPDATE `admins` SET full_name = 'Super Admin' WHERE full_name IS NULL OR full_name = ''")
    conn.commit()

    # ── Step 6: alerts — missing columns ──────────────────────────────────────
    print("Step 6 — Columns: alerts")
    add_col(cursor, conn, db, "alerts", "recommended_action", "VARCHAR(500) DEFAULT NULL")
    add_col(cursor, conn, db, "alerts", "escalation_count",   "INT(11) NOT NULL DEFAULT 0")

    # ── Step 7: alerts.level ENUM — add 'watch' ───────────────────────────────
    print("Step 7 — ENUM: alerts.level")
    cursor.execute(
        """SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'alerts' AND COLUMN_NAME = 'level'""",
        (db,),
    )
    row = cursor.fetchone()
    col_type = str(row[0]) if row else ""
    if "watch" not in col_type:
        cursor.execute("""
            ALTER TABLE `alerts`
            MODIFY COLUMN `level`
            ENUM('advisory','watch','warning','critical') NOT NULL
        """)
        conn.commit()
        print("  [+] alerts.level ENUM updated (added 'watch').")
    else:
        print("  [=] alerts.level ENUM already includes 'watch'.")

    # ── Step 8: reports — missing columns ─────────────────────────────────────
    print("Step 8 — Columns: reports")
    add_col(cursor, conn, db, "reports", "reporter_email",       "VARCHAR(255) DEFAULT NULL")
    add_col(cursor, conn, db, "reports", "verified_by",          "VARCHAR(255) DEFAULT NULL")
    add_col(cursor, conn, db, "reports", "verified_at",          "DATETIME DEFAULT NULL")
    add_col(cursor, conn, db, "reports", "rejection_reason",     "VARCHAR(500) DEFAULT NULL")
    add_col(cursor, conn, db, "reports", "flood_level_reported", "VARCHAR(100) DEFAULT NULL")
    add_col(cursor, conn, db, "reports", "latitude",             "DECIMAL(10,8) DEFAULT NULL")
    add_col(cursor, conn, db, "reports", "longitude",            "DECIMAL(11,8) DEFAULT NULL")
    add_col(cursor, conn, db, "reports", "maps_url",             "VARCHAR(500) DEFAULT NULL")

    # ── Step 9: users — missing columns ───────────────────────────────────────
    print("Step 9 — Columns: users")
    add_col(cursor, conn, db, "users", "avatar_url", "VARCHAR(255) DEFAULT NULL")
    add_col(cursor, conn, db, "users", "status",     "ENUM('active','inactive') DEFAULT 'active'")

    cursor.close()
    conn.close()
    print("\n[OK] All migrations completed successfully.")


if __name__ == "__main__":
    try:
        run()
    except Exception as exc:
        print(f"\n[FAIL] Migration aborted: {exc}", file=sys.stderr)
        sys.exit(1)
