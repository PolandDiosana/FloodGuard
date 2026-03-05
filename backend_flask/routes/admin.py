from flask import Blueprint, request, jsonify
from utils.db import get_db
from werkzeug.security import generate_password_hash
from utils.email_service import send_credentials_email

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/create-lgu', methods=['POST'])
def create_lgu():
    data = request.get_json()
    full_name = data.get('full_name')
    email = data.get('email')
    phone = data.get('phone')
    barangay = data.get('barangay')
    password = data.get('password')

    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Received create-lgu request for {email}")

    if not full_name or not email or not password:
        return jsonify({"error": "Full name, email, and password are required"}), 400

    # Default role to 'lgu_admin' or similar. 
    # Let's use 'lgu' as per frontend mock data ('LGU Moderator' mapped to 'lgu' probably).
    # LandingPage.js mapped 'lgu_admin' -> 'lgu'. let's use 'lgu_admin' for consistency with backend role names if established.
    # But wait, LandingPage.js logic:
    # if (data.user.role === "super_admin") appRole = "admin";
    # else if (data.user.role === "lgu_admin") appRole = "lgu";
    
    role = 'lgu_admin'
    
    password_hash = generate_password_hash(password)
    
    db = get_db()
    cursor = db.cursor(dictionary=True)
    
    # Check if email exists in users
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close()
        return jsonify({"error": "Email already registered"}), 409
        
    try:
        cursor.execute("""
            INSERT INTO users (full_name, email, phone, barangay, password, role, must_change_password)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (full_name, email, phone, barangay, password_hash, role, 1))
        # Default must_change_password to 1 so they change it on first login? 
        # Yes, good security practice.
        
        db.commit()
        user_id = cursor.lastrowid
        cursor.close()
        
        # Send email
        logger.info(f"Attempting to send email to {email}")
        success, message = send_credentials_email(email, full_name, password)
        logger.info(f"Email send result: {success}, {message}")
        
        return jsonify({
            "message": "LGU account created successfully",
            "user_id": user_id,
            "email_sent": success
        }), 201
    except Exception as e:
        cursor.close()
        return jsonify({"error": str(e)}), 500


@admin_bp.route('/users', methods=['GET'])
def get_users():
    try:
        from models.user import User
        users = User.get_all_users()
        
        # Calculate stats
        total_users = len(users)
        active_users = sum(1 for u in users if u['status'] == 'active')
        lgu_moderators = sum(1 for u in users if u['role'] == 'lgu_admin')
        super_admins = sum(1 for u in users if u['role'] == 'super_admin')
        
        # We can also count specific user roles if needed
        regular_users = sum(1 for u in users if u['role'] == 'user')
        
        return jsonify({
            "users": users,
            "stats": {
                "total_users": total_users,
                "active_users": active_users,
                "lgu_moderators": lgu_moderators,
                "super_admins": super_admins
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@admin_bp.route('/users/<string:user_id>', methods=['DELETE'])
def delete_user(user_id):
    db = get_db()
    cursor = db.cursor()
    try:
        if user_id.startswith('u-'):
            table = 'users'
            db_id = user_id[2:]
        elif user_id.startswith('a-'):
            table = 'admins'
            db_id = user_id[2:]
        else:
            return jsonify({"error": "Invalid user ID format"}), 400

        cursor.execute(f"DELETE FROM {table} WHERE id = %s", (db_id,))
        db.commit()
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

@admin_bp.route('/users/<string:user_id>/status', methods=['PUT'])
def update_user_status(user_id):
    data = request.get_json()
    new_status = data.get('status')
    
    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    db = get_db()
    cursor = db.cursor()
    try:
        if user_id.startswith('u-'):
            table = 'users'
            db_id = user_id[2:]
            cursor.execute(f"UPDATE {table} SET status = %s WHERE id = %s", (new_status, db_id))
            db.commit()
            return jsonify({"message": "Status updated successfully"}), 200
        else:
             return jsonify({"error": "Cannot update status for this user type"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()

@admin_bp.route('/users/<string:user_id>/role', methods=['PUT'])
def update_user_role(user_id):
    data = request.get_json()
    new_role = data.get('role')
    
    if not new_role:
        return jsonify({"error": "Role is required"}), 400

    db = get_db()
    cursor = db.cursor()
    try:
        if user_id.startswith('u-'):
            db_id = user_id[2:]
            # valid roles: 'user', 'lgu_admin', 'super_admin'
            if new_role in ['user', 'lgu_admin', 'super_admin']:
                cursor.execute("UPDATE users SET role = %s WHERE id = %s", (new_role, db_id))
                db.commit()
                return jsonify({"message": "Role updated successfully"}), 200
            else:
                return jsonify({"error": "Invalid role specified"}), 400
        else:
            return jsonify({"error": "Cannot update role for this user type"}), 400

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
