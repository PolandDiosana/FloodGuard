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
            return User(
                id=user_data['id'],
                username=user_data['username'],
                role=user_data['role'],
                password_hash=user_data['password'],
                full_name="Super Admin" # Explicit name for super admins
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
        # In a real migration, make sure PHP used a compatible hash. 
        # For now, we assume standardized hashing or plain text for initial testing if legacy.
        # If legacy PHP used password_hash(), python's check_password_hash usually works if it's bcrypt/argon2.
        # If simple md5/sha, we might need custom logic. 
        return check_password_hash(self.password_hash, password)
