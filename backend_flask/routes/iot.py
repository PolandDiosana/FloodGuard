from flask import Blueprint, request, jsonify
from utils.db import get_db
from datetime import datetime

iot_bp = Blueprint("iot", __name__)


@iot_bp.route("/sensor-readings", methods=["POST"])
def sensor_reading():
    data = request.get_json(silent=True) or {}
    sensor_id = data.get("sensor_id", "sensor-1")
    raw_distance = data.get("raw_distance")
    flood_level = data.get("flood_level")
    status = data.get("status")
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    maps_url = data.get("maps_url")
    timestamp = data.get("timestamp") or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    if isinstance(timestamp, (list, tuple)):
        try:
            timestamp = "{}-{:02d}-{:02d} {:02d}:{:02d}:{:02d}".format(*timestamp[:6])
        except Exception:
            timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    # ← Normalize ISO 8601 with T separator from ESP32
    if isinstance(timestamp, str) and "T" in timestamp:
        timestamp = timestamp.replace("T", " ")

    if raw_distance is None or flood_level is None or status is None:
        return jsonify({"error": "raw_distance, flood_level, status required"}), 400

    db = get_db()
    cur = db.cursor()
    try:
        cur.execute("""
            INSERT INTO water_levels (sensor_id, level, timestamp)
            VALUES (%s, %s, %s)
        """, (sensor_id, flood_level, timestamp))
    except Exception:
        pass

    try:
        cur.execute("""
            INSERT INTO iot_readings (sensor_id, raw_distance, flood_level, status, latitude, longitude, maps_url, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (sensor_id, raw_distance, flood_level, status, latitude, longitude, maps_url, timestamp))
    except Exception:
        pass

    db.commit()
    cur.close()
    return jsonify({"message": "ok"}), 201


@iot_bp.route("/latest", methods=["GET"])
def latest_sensor():
    db = get_db()
    cur = db.cursor(dictionary=True)
    cur.execute("""
        SELECT id, sensor_id, raw_distance, flood_level, status,
               latitude, longitude, maps_url, created_at
        FROM iot_readings
        ORDER BY created_at DESC LIMIT 1
    """)
    row = cur.fetchone()
    cur.close()

    if not row:
        return jsonify({"error": "No sensor data found"}), 404

    created_at = row.get("created_at")
    if isinstance(created_at, str):
        try:
            created_at_dt = datetime.strptime(created_at, "%Y-%m-%d %H:%M:%S")
        except Exception:
            created_at_dt = datetime.utcnow()
    elif isinstance(created_at, datetime):
        created_at_dt = created_at
    else:
        created_at_dt = datetime.utcnow()

    age_seconds = (datetime.utcnow() - created_at_dt).total_seconds()
    is_offline = age_seconds > 30

    row["is_offline"] = is_offline
    row["status"] = "OFFLINE" if is_offline else (row.get("status") or "UNKNOWN")

    try:
        row["flood_level"] = float(row.get("flood_level") or 0)
    except Exception:
        row["flood_level"] = 0.0
    try:
        row["raw_distance"] = float(row.get("raw_distance") or 0)
    except Exception:
        row["raw_distance"] = 0.0

    return jsonify(row), 200


@iot_bp.route("/latest-readings", methods=["GET"])
def latest_readings():
    db = get_db()
    cur = db.cursor(dictionary=True)
    cur.execute("""
        SELECT id, sensor_id, raw_distance, flood_level, status,
               latitude, longitude, maps_url, created_at
        FROM iot_readings
        ORDER BY created_at DESC LIMIT 50
    """)
    rows = cur.fetchall()
    cur.close()
    return jsonify(rows), 200


# ── NEW: Heartbeat endpoint polled every 1 second by frontend ─────────────────
@iot_bp.route("/status", methods=["GET"])
def sensor_status():
    db = get_db()
    cur = db.cursor(dictionary=True)
    cur.execute("""
        SELECT sensor_id, raw_distance, flood_level, status, created_at
        FROM iot_readings
        ORDER BY created_at DESC
        LIMIT 1
    """)
    row = cur.fetchone()
    cur.close()

    if not row:
        return jsonify({
            "status": "OFFLINE",
            "flood_level": 0,
            "raw_distance": 0,
            "sensor_id": None
        }), 200

    created_at = row.get("created_at")

    # Handle both datetime object (MySQL connector) and string
    if isinstance(created_at, datetime):
        created_at_dt = created_at
    elif isinstance(created_at, str):
        # Strip T separator just in case old rows have it
        created_at_clean = created_at.replace("T", " ").split(".")[0]
        try:
            created_at_dt = datetime.strptime(created_at_clean, "%Y-%m-%d %H:%M:%S")
        except Exception:
            created_at_dt = datetime.utcnow()
    else:
        created_at_dt = datetime.utcnow()

    age_seconds = (datetime.utcnow() - created_at_dt).total_seconds()

    # 10 seconds buffer: covers 1s ESP32 interval + network jitter
    if age_seconds > 10:
        return jsonify({
            "status": "OFFLINE",
            "flood_level": 0,
            "raw_distance": 0,
            "sensor_id": row.get("sensor_id")
        }), 200

    try:
        flood_level = float(row.get("flood_level") or 0)
    except Exception:
        flood_level = 0.0

    try:
        raw_distance = float(row.get("raw_distance") or 0)
    except Exception:
        raw_distance = 0.0

    return jsonify({
        "status": "ONLINE",
        "flood_level": flood_level,
        "raw_distance": raw_distance,
        "sensor_id": row.get("sensor_id"),
        "sensor_status": row.get("status")  # NORMAL / WARNING / ALARM
    }), 200