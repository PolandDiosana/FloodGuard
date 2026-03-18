import pymysql
from config import Config
from werkzeug.security import check_password_hash

conn = pymysql.connect(host=Config.DB_HOST, user=Config.DB_USER, password=Config.DB_PASSWORD, database=Config.DB_NAME)
cur = conn.cursor()
cur.execute("SELECT password FROM admins WHERE username=%s", ('moderator@lgu.gov',))
(h,) = cur.fetchone()
print('hash', h)
print('password123', check_password_hash(h, 'password123'))
print('admin123', check_password_hash(h, 'admin123'))
cur.close()
conn.close()
