from werkzeug.security import generate_password_hash

print("Admin Hash:", generate_password_hash("admin123"))
print("LGU Hash:", generate_password_hash("password123"))
