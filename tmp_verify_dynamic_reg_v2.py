import requests
import json

BASE_URL = "http://10.236.107.238:5000"

def test_registration():
    print("Testing sensor registration...")
    sensor_id = "V-TEST-99"
    payload = {
        "id": sensor_id,
        "name": "Verification Sensor",
        "barangay": "Bgy. Verification",
        "description": "Verification sensor",
        "lat": 14.6,
        "lng": 121.1,
        "status": "active"
    }
    
    try:
        # Register
        res = requests.post(f"{BASE_URL}/api/iot/registers-sensor", json=payload)
        print(f"Registration response ({res.status_code}): {res.text}")

        # Send reading
        reading_payload = {
            "sensor_id": sensor_id,
            "flood_level": 25.0,
            "status": "NORMAL",
            "latitude": 14.6,
            "longitude": 121.1
        }
        res = requests.post(f"{BASE_URL}/api/iot/sensor-readings", json=reading_payload)
        print(f"Reading response ({res.status_code}): {res.text}")

        # Check sensors list
        res = requests.get(f"{BASE_URL}/api/iot/sensors")
        print(f"Sensors list: {res.json().get('sensors', [])[:5]}")

        # Check status-all
        res = requests.get(f"{BASE_URL}/api/iot/sensors/status-all")
        data = res.json()
        target = next((s for s in data if s['id'] == sensor_id), None)
        if target:
            print(f"FOUND SENSOR: {json.dumps(target, indent=2)}")
        else:
            print("SENSOR NOT FOUND IN STATUS-ALL")

    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    test_registration()
