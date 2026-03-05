from werkzeug.security import generate_password_hash, check_password_hash

# Generate new hashes
admin_pass = "admin123"
lgu_pass = "password123"

admin_hash = generate_password_hash(admin_pass)
lgu_hash = generate_password_hash(lgu_pass)

# Write to file to avoid terminal truncation
with open("backend_flask/fix_passwords.sql", "w") as f:
    f.write("USE `floodguard`;\n\n")
    f.write(f"UPDATE `admins` SET `password` = '{admin_hash}' WHERE `username` = 'admin@system.com';\n")
    f.write(f"UPDATE `admins` SET `password` = '{lgu_hash}' WHERE `username` = 'moderator@lgu.gov';\n")

print("SQL file generated.")
