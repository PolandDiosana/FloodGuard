import requests
import json

BASE_URL = "http://10.236.107.238:5000"

def test_registration():
    print("Testing sensor registration...")
    sensor_id = "DYNAMIC-TEST-01"
    payload = {
        "id": sensor_id,
        "name": "Dynamic Test Sensor",
        "barangay": "Test Barangay",
        "description": "A sensor registered during verification",
        "lat": 14.5,
        "lng": 121.0,
        "status": "active"
    }
    
    try:
        # First check if it exists, if so delete or use another ID
        res = requests.get(f"{BASE_URL}/api/iot/sensors")
        sensors = res.json().get('sensors', [])
        if any(s['id'] == sensor_id for s in sensors):
            print(f"Sensor {sensor_id} already exists. Skipping registration.")
        else:
            res = requests.post(f"{BASE_URL}/api/iot/registers-sensor", json=payload)
            print(f"Registration status: {res.status_code}")
            print(res.json())

        # Now send a reading
        print("\nSending a reading for the new sensor...")
        reading_payload = {
            "sensor_id": sensor_id,
            "flood_level": 15.5,
            "status": "WARNING",
            "latitude": 14.5,
            "longitude": 121.0
        }
        res = requests.post(f"{BASE_URL}/api/iot/sensor-readings", json=reading_payload)
        print(f"Reading status: {res.status_code}")
        print(res.json())

        # Check status-all
        print("\nChecking status-all...")
        res = requests.get(f"{BASE_URL}/api/iot/sensors/status-all")
        print(f"Status-all status: {res.status_code}")
        data = res.json()
        target = next((s for s in data if s['id'] == sensor_id), None)
        if target:
            print(f"Found sensor {sensor_id} in status-all!")
            print(f"Flood level: {target.get('flood_level')}, Status: {target.get('reading_status')}")
        else:
            print(f"Error: Sensor {sensor_id} NOT found in status-all.")

    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == "__main__":
    test_registration()
