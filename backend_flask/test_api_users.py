import requests

def test_api():
    base_url = "http://127.0.0.1:5000"
    try:
        print(f"Testing {base_url}/api/admin/users ...")
        response = requests.get(f"{base_url}/api/admin/users")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data.get('users', []))} users")
            print(f"Stats: {data.get('stats')}")
            for u in data.get('users', []):
                print(f"- {u['name']} ({u['role']})")
        else:
            print(f"Error Response: {response.text}")
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    test_api()
