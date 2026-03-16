import requests
import json

def test_login():
    url = "http://127.0.0.1:5000/api/auth/login"
    creds = [
        ("admin@system.com", "admin123"),
        ("moderator@lgu.gov", "password123")
    ]
    
    for user, pwd in creds:
        print(f"\nTesting login for: {user}")
        try:
            resp = requests.post(url, json={"username": user, "password": pwd}, timeout=5)
            print(f"Status: {resp.status_code}")
            print(f"Body: {resp.text}")
        except Exception as e:
            print(f"Error connecting to {url}: {e}")

if __name__ == "__main__":
    test_login()
