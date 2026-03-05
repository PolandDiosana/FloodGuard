
from werkzeug.security import check_password_hash, generate_password_hash
import sys

# Hashes from the DB debug output
db_hash = "scrypt:32768:8:1$12Jjtqo4$c62fa32f70f45d0029c304ba7eb5982d37748c"
password = "admin123"

print(f"Testing hash: {db_hash}", flush=True)
print(f"Password: {password}", flush=True)

try:
    if check_password_hash(db_hash, password):
        print("SUCCESS: Password matches!", flush=True)
    else:
        print("FAILURE: Password does NOT match.", flush=True)
except Exception as e:
    print(f"ERROR: {e}", flush=True)

new_hash = generate_password_hash("admin123")
print(f"New generated hash: {new_hash}", flush=True)
