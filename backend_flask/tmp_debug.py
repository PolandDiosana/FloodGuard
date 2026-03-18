from app import app
from utils.db import get_db

with app.app_context():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute('SELECT id, username, role, password FROM admins LIMIT 5')
    print('admins', c.fetchall())
    c.execute('SELECT id, email, role, password FROM users LIMIT 5')
    print('users', c.fetchall())
    c.close()
