import urllib.request
import json

def test_profile():
    base_url = "http://localhost:5000/api/users/1?type=admin"
    data = {
        "full_name": "Antigravity Admin",
        "email": "admin@system.com",
        "phone": "+63 912 345 6789"
    }
    
    print(f"Testing PUT request to: {base_url}")
    req = urllib.request.Request(
        base_url, 
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PUT'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode())
            print(f"PUT Response: {res_data}")
            
        print(f"\nTesting GET request to: {base_url}")
        with urllib.request.urlopen(base_url) as response:
            res_data = json.loads(response.read().decode())
            print(f"GET Response: {res_data}")
            
            if res_data.get('full_name') == data['full_name'] and res_data.get('phone') == data['phone']:
                print("\nSUCCESS: Profile persisted correctly!")
            else:
                print("\nFAILED: Profile did not match expected values.")
                
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    test_profile()
