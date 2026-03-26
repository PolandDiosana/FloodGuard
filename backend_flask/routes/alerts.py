from flask import Blueprint, request, jsonify
from utils.db import get_db

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('/user/<int:user_id>/dismiss/<int:alert_id>', methods=['POST'])
def dismiss_alert_for_user(user_id, alert_id):
    """Dismiss an alert for a specific user (user-specific deletion - mobile only)"""
    db = get_db()
    cursor = db.cursor()
    try:
        print(f"[DEBUG] Dismissing alert {alert_id} for user {user_id}")
        # Insert into user_alert_dismissals table
        cursor.execute("""
            INSERT INTO user_alert_dismissals (user_id, alert_id)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE dismissed_at = NOW()
        """, (user_id, alert_id))
        db.commit()
        
        print(f"[DEBUG] Alert {alert_id} dismissed for user {user_id}")
        return jsonify({"message": "Alert dismissed for user"}), 200
    except Exception as e:
        print(f"[ERROR] Failed to dismiss alert {alert_id} for user {user_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

@alerts_bp.route('/<int:alert_id>', methods=['DELETE'])
def delete_alert(alert_id):
    """Delete an alert by ID (system-wide - for LGU/ADMIN only)"""
    db = get_db()
    cursor = db.cursor()
    try:
        print(f"[DEBUG] Attempting to delete alert ID: {alert_id}")
        cursor.execute("DELETE FROM alerts WHERE id = %s", (alert_id,))
        db.commit()
        
        if cursor.rowcount > 0:
            print(f"[DEBUG] Alert {alert_id} deleted successfully")
            return jsonify({"message": "Alert deleted successfully"}), 200
        else:
            print(f"[DEBUG] Alert {alert_id} not found")
            return jsonify({"error": "Alert not found"}), 404
    except Exception as e:
        print(f"[ERROR] Failed to delete alert {alert_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

@alerts_bp.route('/', methods=['GET'])
def get_alerts():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    status = request.args.get('status') # active, resolved
    user_id = request.args.get('user_id')  # Optional: filter out dismissed alerts for this user
    
    # Start with base query
    query = "SELECT a.* FROM alerts a"
    params = []
    
    # If user_id provided, use LEFT JOIN to exclude dismissed alerts
    if user_id:
        query += " LEFT JOIN user_alert_dismissals d ON a.id = d.alert_id AND d.user_id = %s"
        params.append(user_id)
        query += " WHERE d.alert_id IS NULL"  # Only get alerts NOT in dismissals
    else:
        query += " WHERE 1=1"
    
    if status:
        query += " AND a.status = %s"
        params.append(status)
        
    query += " ORDER BY a.timestamp DESC"
    
    try:
        cursor.execute(query, params)
        alerts = cursor.fetchall()
        cursor.close()
        return jsonify(alerts)
    except Exception as e:
        cursor.close()
        # If user_alert_dismissals table doesn't exist yet, just return all alerts
        if "doesn't exist" in str(e) or "no such table" in str(e).lower():
            cursor = db.cursor(dictionary=True)
            fallback_query = "SELECT * FROM alerts WHERE 1=1"
            fallback_params = []
            
            if status:
                fallback_query += " AND status = %s"
                fallback_params.append(status)
                
            fallback_query += " ORDER BY timestamp DESC"
            
            cursor.execute(fallback_query, fallback_params)
            alerts = cursor.fetchall()
            cursor.close()
            return jsonify(alerts)
        else:
            return jsonify({"error": str(e)}), 500

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
