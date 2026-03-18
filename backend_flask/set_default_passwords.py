import pymysql
from config import Config
from werkzeug.security import generate_password_hash

connection = pymysql.connect(
    host=Config.DB_HOST,
    user=Config.DB_USER,
    password=Config.DB_PASSWORD,
    database=Config.DB_NAME,
    cursorclass=pymysql.cursors.DictCursor
)

try:
    with connection.cursor() as cursor:
        cursor.execute("UPDATE admins SET password = %s WHERE username = %s", (generate_password_hash('admin123'), 'admin@system.com'))
        cursor.execute("UPDATE admins SET password = %s WHERE username = %s", (generate_password_hash('password123'), 'moderator@lgu.gov'))
        connection.commit()
        cursor.execute("SELECT username, role, password FROM admins")
        print(cursor.fetchall())
finally:
    connection.close()
