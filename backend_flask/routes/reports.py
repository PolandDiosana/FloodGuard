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
    print(f"DEBUG: Files: {request.files}")
    print(f"DEBUG: Form: {request.form}")

    # Check if this is a multipart request (with file) or JSON
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form

    reporter_name = data.get('reporter_name', 'Anonymous')
    report_type = data.get('type')
    location = data.get('location')
    description = data.get('description')
    image_url = None

    # Handle Image Upload
    if 'image' in request.files:
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Ensure upload directory exists
            os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
            file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
            # Construct URL (assuming server is accessible via same host)
            # For now, we store relative path or filename
            image_url = f"/api/reports/uploads/{filename}"

    if not report_type or not location:
        return jsonify({"error": "Type and location are required"}), 400
        
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute("""
        INSERT INTO reports (reporter_name, type, location, description, image_url, status, timestamp)
        VALUES (%s, %s, %s, %s, %s, 'pending', NOW())
    """, (reporter_name, report_type, location, description, image_url))
    
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
    
    return jsonify({"message": "Report status updated"}), 200
