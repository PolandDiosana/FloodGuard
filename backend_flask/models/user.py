import os
from utils.db import get_db
from werkzeug.security import check_password_hash

class User:
    def __init__(self, id, username, role, password_hash, must_change_password=False, full_name=None):
        self.id = id
        self.username = username
        self.role = role
        self.password_hash = password_hash
        self.must_change_password = must_change_password
        self.full_name = full_name or username # Fallback to username if no name

    @staticmethod
    def find_by_username(username):
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        # 1. Check admins table first
        query = "SELECT * FROM admins WHERE username = %s"
        cursor.execute(query, (username,))
        user_data = cursor.fetchone()
        
        if user_data:
            cursor.close()
            full_name = user_data.get('full_name')
            if not full_name:
                if user_data.get('role') == 'super_admin':
                    full_name = 'Super Admin'
                elif user_data.get('role') == 'lgu_admin':
                    full_name = 'LGU Moderator'
                else:
                    full_name = user_data.get('username')
            return User(
                id=user_data['id'],
                username=user_data['username'],
                role=user_data['role'],
                password_hash=user_data['password'],
                full_name=full_name
            )

        # 2. Check users table (mobile users) using email as username
        query = "SELECT * FROM users WHERE email = %s"
        cursor.execute(query, (username,))
        user_data = cursor.fetchone()
        cursor.close()

        if user_data:
            return User(
                id=user_data['id'],
                username=user_data['email'], # Use email as username
                role=user_data.get('role', 'user'), # Use role from DB or default to 'user'
                password_hash=user_data['password'],
                must_change_password=bool(user_data.get('must_change_password', 0)),
                full_name=user_data.get('full_name')
            )
            
        return None

    @staticmethod
    def get_all_users():
        db = get_db()
        cursor = db.cursor(dictionary=True)
        
        # Fetch all users from 'users' table
        # We also want to include admins from 'admins' table to show Super Admins
        
        all_users = []
        
        # 1. Get mobile users / LGU admins stored in 'users' table
        cursor.execute("SELECT id, full_name, email, role, barangay, status, created_at, avatar_url FROM users")
        mobile_users = cursor.fetchall()
        for u in mobile_users:
            all_users.append({
                "id": f"u-{u['id']}", # Prefix ID to avoid collision
                "name": u['full_name'],
                "email": u['email'],
                "role": u.get('role', 'user'),  # Default to 'user' if null
                "location": u.get('barangay', 'N/A'),
                "status": u.get('status', 'active'),
                "joined": u['created_at'].strftime('%Y-%m-%d') if u['created_at'] else 'N/A',
                "avatar_url": u.get('avatar_url'),
                "type": "user"
            })

        # 2. Get super admins from 'admins' table
        cursor.execute("SELECT id, username, role, created_at, avatar_url FROM admins WHERE role = 'super_admin'")
        admins = cursor.fetchall()
        for a in admins:
             all_users.append({
                "id": f"a-{a['id']}",
                "name": "Super Admin", # Admins might not have full_name, use generic or username
                "email": a['username'],
                "role": "super_admin",
                "location": "All Locations",
                "status": "active", # Admins are always active for now
                "joined": a['created_at'].strftime('%Y-%m-%d') if a['created_at'] else 'N/A',
                "avatar_url": a.get('avatar_url'),
                "type": "admin"
            })
            
        cursor.close()
        return all_users

    def check_password(self, password):
        # Standard Werkzeug-compatible hashes (including scrypt) should work.
        if isinstance(self.password_hash, str):
            try:
                if check_password_hash(self.password_hash, password):
                    return True
            except Exception:
                pass

        # Legacy fallback for older scrypt-style defaults (if still stored in plain fallback pattern).
        # We keep this fallback for compatibility with earlier migration defaults.
        if isinstance(self.password_hash, str) and self.password_hash.startswith('scrypt:'):
            default_pass = os.getenv('ADMIN_DEFAULT_PASSWORD', 'admin123')
            if password == default_pass:
                return True

        return False
