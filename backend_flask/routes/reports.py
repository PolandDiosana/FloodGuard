import os
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from werkzeug.utils import secure_filename
from utils.db import get_db

reports_bp = Blueprint('reports', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@reports_bp.route('/uploads/<name>')
def download_file(name):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], name)

@reports_bp.route('/', methods=['POST'])
def create_report():
    print(f"DEBUG: Content-Type: {request.content_type}")
    print(f"DEBUG: Method: {request.method}")
    print(f"DEBUG: Files: {list(request.files.keys()) if request.files else 'No files'}")
    print(f"DEBUG: Form: {dict(request.form) if request.form else 'No form data'}")

    # Check if this is a multipart request (with file) or JSON
    if request.is_json:
        data = request.get_json()
        print(f"DEBUG: JSON data: {data}")
    else:
        data = request.form
        print(f"DEBUG: Form data: {dict(data)}")

    reporter_name = data.get('reporter_name', 'Anonymous')
    reporter_email = data.get('reporter_email')  # Optional email for notifications
    report_type = data.get('type')
    location = data.get('location')
    description = data.get('description')
    image_url = None

    print(f"DEBUG: Extracted - name: {reporter_name}, email: {reporter_email}, type: {report_type}, location: {location}")

    # Handle Image Upload
    if 'image' in request.files:
        file = request.files['image']
        print(f"DEBUG: Image file: {file.filename if file else 'None'}")
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Ensure upload directory exists
            os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            print(f"DEBUG: Saved image to: {file_path}")
            # Construct URL (assuming server is accessible via same host)
            image_url = f"/api/reports/uploads/{filename}"
        else:
            print(f"DEBUG: Image file not allowed or missing: {file.filename if file else 'None'}")

    if not report_type or not location:
        print(f"DEBUG: Validation failed - type: {report_type}, location: {location}")
        return jsonify({"error": "Type and location are required"}), 400
        
    db = get_db()
    cursor = db.cursor()
    
    # Check if reporter_email column exists
    cursor.execute("SHOW COLUMNS FROM reports LIKE 'reporter_email'")
    has_email_column = cursor.fetchone() is not None
    
    # Build INSERT query dynamically
    columns = ["reporter_name", "type", "location", "description", "image_url", "status", "timestamp"]
    values = [reporter_name, report_type, location, description, image_url, "pending"]
    placeholders = ["%s"] * len(values)
    
    if has_email_column and reporter_email:
        columns.insert(1, "reporter_email")
        values.insert(1, reporter_email)
        placeholders.insert(1, "%s")
    
    query = f"""
        INSERT INTO reports ({', '.join(columns)})
        VALUES ({', '.join(placeholders)}, NOW())
    """
    
    cursor.execute(query, values)
    
    db.commit()
    report_id = cursor.lastrowid
    cursor.close()
    
    return jsonify({"message": "Report submitted successfully", "id": report_id, "image_url": image_url}), 201

@reports_bp.route('/', methods=['GET'])
def get_reports():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    status = request.args.get('status')
    reporter_name = request.args.get('reporter_name')
    
    query = "SELECT * FROM reports WHERE 1=1"
    params = []
    
    if status:
        query += " AND status = %s"
        params.append(status)

    if reporter_name:
        query += " AND reporter_name = %s"
        params.append(reporter_name)
        
    query += " ORDER BY timestamp DESC"
    
    cursor.execute(query, params)
    reports = cursor.fetchall()
    cursor.close()
    
    return jsonify(reports)

@reports_bp.route('/<int:report_id>/status', methods=['PUT'])
def update_report_status(report_id):
    data = request.get_json()
    status = data.get('status') # verified, dismissed
    
    if status not in ['verified', 'dismissed']:
        return jsonify({"error": "Invalid status"}), 400
        
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute("UPDATE reports SET status = %s WHERE id = %s", (status, report_id))
    db.commit()
    cursor.close()

    # Trigger auto-escalation logic when a report is verified
    if status == 'verified':
        try:
            from routes.subscriptions import auto_escalate
            with current_app.test_request_context('/api/subscriptions/auto-escalate', method='POST'):
                auto_escalate()
        except Exception as e:
            # Non-critical — log but don't fail the report status update
            current_app.logger.warning(f"Auto-escalation check failed: {e}")
    
    return jsonify({"message": "Report status updated"}), 200


# ═══════════════════════════════════════════════════════════════════════════════
# ─ VERIFICATION ENDPOINTS: LGU/Admin verification with audit trail ──────────────
# ═══════════════════════════════════════════════════════════════════════════════

@reports_bp.route('/pending', methods=['GET'])
def get_pending_reports():
    """Get all pending reports awaiting verification by LGU/Admin"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT id, reporter_name, type, location, description, image_url, 
               timestamp, flood_level_reported, latitude, longitude, maps_url
        FROM reports 
        WHERE status = 'pending' 
        ORDER BY timestamp DESC
    """)
    reports = cursor.fetchall()
    cursor.close()
    
    return jsonify(reports), 200


@reports_bp.route('/<int:report_id>/verify', methods=['POST'])
def verify_report(report_id):
    """Verify and broadcast a user report - triggers alert to all subscribers"""
    data = request.get_json() or {}
    verified_by = data.get('verified_by')  # LGU admin username/email
    flood_level = data.get('flood_level')  # Official flood level classification
    
    if not verified_by:
        return jsonify({"error": "verified_by (LGU official) is required"}), 400
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    # Get the report details first
    cursor.execute("""
        SELECT * FROM reports WHERE id = %s
    """, (report_id,))
    report = cursor.fetchone()
    
    if not report:
        return jsonify({"error": "Report not found"}), 404
    
    if report['status'] != 'pending':
        return jsonify({"error": "Only pending reports can be verified"}), 400
    
    # Update with verification info
    from datetime import datetime
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute("""
        UPDATE reports 
        SET status = 'verified', 
            verified_by = %s, 
            verified_at = %s,
            flood_level_reported = %s
        WHERE id = %s
    """, (verified_by, now, flood_level, report_id))
    
    db.commit()
    cursor.close()
    
    # ── Auto-escalate to create official alert ──────────────────────────────────
    try:
        # Create an official alert from this verified report
        cursor = db.cursor()
        alert_level = 'advisory' if flood_level in ['low', 'ankle-high'] else \
                     'warning' if flood_level in ['medium', 'waist-high'] else 'critical'
        
        cursor.execute("""
            INSERT INTO alerts (title, description, level, barangay, status, timestamp)
            VALUES (%s, %s, %s, %s, 'active', NOW())
        """, (
            f"Verified: {report['type']} at {report['location']}",
            f"Verified by LGU Official ({verified_by})\nUser Report: {report['description']}\nFlood Level: {flood_level}",
            alert_level,
            report['location']
        ))
        
        db.commit()
        cursor.close()
        
        # Trigger subscriptions notification
        try:
            from routes.subscriptions import auto_escalate
            with current_app.test_request_context('/api/subscriptions/auto-escalate', method='POST'):
                auto_escalate()
        except Exception as e:
            current_app.logger.warning(f"Auto-escalation failed: {e}")
    
    except Exception as e:
        print(f"Error creating alert: {e}")
    
    return jsonify({
        "message": "Report verified and broadcast as official alert",
        "report_id": report_id,
        "verified_by": verified_by,
        "verified_at": now
    }), 200


@reports_bp.route('/<int:report_id>/reject', methods=['POST'])
def reject_report(report_id):
    """Reject/dismiss a user report as false alarm or duplicate"""
    data = request.get_json() or {}
    rejected_by = data.get('rejected_by')  # LGU admin username/email
    rejection_reason = data.get('rejection_reason')  # Why was it rejected?
    
    if not rejected_by:
        return jsonify({"error": "rejected_by (LGU official) is required"}), 400
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    # Get report details including reporter email (if column exists)
    cursor.execute("""
        SELECT reporter_name, type, location, description
        FROM reports WHERE id = %s
    """, (report_id,))
    report = cursor.fetchone()
    
    if not report:
        cursor.close()
        return jsonify({"error": "Report not found"}), 404
    
    # Try to get reporter_email if column exists
    reporter_email = None
    try:
        cursor.execute("SELECT reporter_email FROM reports WHERE id = %s", (report_id,))
        email_result = cursor.fetchone()
        if email_result:
            reporter_email = email_result['reporter_email']
    except:
        # Column doesn't exist yet, continue without email
        pass
    
    from datetime import datetime
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    # Update with rejection info
    cursor.execute("""
        UPDATE reports 
        SET status = 'dismissed', 
            verified_by = %s, 
            verified_at = %s,
            rejection_reason = %s
        WHERE id = %s
    """, (rejected_by, now, rejection_reason or "False alarm/Duplicate", report_id))
    
    db.commit()
    cursor.close()
    
    # Send notification email to reporter if email is available
    if reporter_email:
        try:
            from utils.email_service import send_dismissal_notification
            send_dismissal_notification(
                reporter_email=reporter_email,
                reporter_name=report['reporter_name'],
                report_type=report['type'],
                location=report['location'],
                rejection_reason=rejection_reason or "False alarm/Duplicate"
            )
        except Exception as e:
            print(f"Failed to send dismissal notification: {e}")
    
    return jsonify({
        "message": "Report rejected and dismissed",
        "report_id": report_id,
        "rejected_by": rejected_by,
        "rejection_reason": rejection_reason or "False alarm/Duplicate",
        "dismissed_at": now
    }), 200


@reports_bp.route('/<int:report_id>/audit', methods=['GET'])
def get_report_audit_trail(report_id):
    """Get verification audit trail for a specific report"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT 
            id, reporter_name, type, location, description, image_url,
            timestamp, status,
            verified_by, verified_at, rejection_reason, flood_level_reported,
            latitude, longitude, maps_url
        FROM reports 
        WHERE id = %s
    """, (report_id,))
    
    report = cursor.fetchone()
    cursor.close()
    
    if not report:
        return jsonify({"error": "Report not found"}), 404
    
    # Format audit trail
    audit_trail = [
        {
            "action": "submitted",
            "by": report['reporter_name'],
            "timestamp": str(report['timestamp']),
            "details": f"{report['type']} at {report['location']}"
        }
    ]
    
    if report['status'] in ['verified', 'dismissed']:
        audit_trail.append({
            "action": report['status'],
            "by": report['verified_by'],
            "timestamp": str(report['verified_at']),
            "details": report['flood_level_reported'] or report['rejection_reason']
        })
    
    return jsonify({
        "report": report,
        "audit_trail": audit_trail
    }), 200


@reports_bp.route('/pending/with-sensor-data', methods=['GET'])
def get_pending_reports_with_sensor_data():
    """Get pending reports with latest sensor data for cross-reference"""
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    # Get pending reports
    cursor.execute("""
        SELECT id, reporter_name, type, location, description, image_url, 
               timestamp, flood_level_reported, latitude, longitude, maps_url
        FROM reports 
        WHERE status = 'pending' 
        ORDER BY timestamp DESC
    """)
    reports = cursor.fetchall()
    
    # Get latest sensor readings
    cursor.execute("""
        SELECT sensor_id, raw_distance, flood_level, status, latitude, longitude, 
               maps_url, created_at
        FROM iot_readings
        ORDER BY created_at DESC
        LIMIT 1
    """)
    sensor_latest = cursor.fetchone()
    
    cursor.close()
    
    return jsonify({
        "pending_reports": reports,
        "latest_sensor_data": sensor_latest,
        "comparison_ready": len(reports) > 0 and sensor_latest is not None
    }), 200
