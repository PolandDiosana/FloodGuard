from flask import Blueprint, request, jsonify
from utils.db import get_db

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('/', methods=['GET'])
def get_alerts():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    status = request.args.get('status') # active, resolved
    
    query = "SELECT * FROM alerts"
    params = []
    
    if status:
        query += " WHERE status = %s"
        params.append(status)
        
    query += " ORDER BY timestamp DESC"
    
    cursor.execute(query, params)
    alerts = cursor.fetchall()
    cursor.close()
    
    return jsonify(alerts)

@alerts_bp.route('/', methods=['POST'])
def create_alert():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    level = data.get('level') # advisory, warning, critical
    barangay = data.get('barangay', 'All')
    
    if not title or not level:
        return jsonify({"error": "Title and level are required"}), 400
        
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute("""
        INSERT INTO alerts (title, description, level, barangay, status, timestamp)
        VALUES (%s, %s, %s, %s, 'active', NOW())
    """, (title, description, level, barangay))
    
    db.commit()
    alert_id = cursor.lastrowid
    cursor.close()
    
    return jsonify({"message": "Alert created successfully", "id": alert_id}), 201
