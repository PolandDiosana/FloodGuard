from app import app
from utils.db import get_db

with app.app_context():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute("SELECT id, username, role, password FROM admins")
    rows = c.fetchall()
    print('admins:')
    for r in rows:
        print(r)
    c.close()
