import urllib.request
import urllib.parse
import os
import mimetypes
import uuid

def test_upload():
    url = "http://127.0.0.1:5000/api/reports/"
    
    # Create a dummy image
    filename = "test_image.jpg"
    with open(filename, "wb") as f:
        f.write(b"fake image data")

    boundary = uuid.uuid4().hex
    data = []
    
    # Add fields
    fields = {
        'reporter_name': 'Test Script',
        'type': 'Flooding',
        'location': 'Test Location',
        'description': 'Test Description from Script'
    }
    
    for name, value in fields.items():
        data.append(f'--{boundary}')
        data.append(f'Content-Disposition: form-data; name="{name}"')
        data.append('')
        data.append(value)
        
    # Add file
    data.append(f'--{boundary}')
    data.append(f'Content-Disposition: form-data; name="image"; filename="{filename}"')
    data.append('Content-Type: image/jpeg')
    data.append('')
    data.append(open(filename, 'rb').read().decode('latin-1'))
    
    data.append(f'--{boundary}--')
    data.append('')
    
    body = '\r\n'.join(data).encode('latin-1')
    
    req = urllib.request.Request(url, data=body)
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
    
    try:
        print(f"Sending POST to {url}...")
        with urllib.request.urlopen(req) as response:
            print(f"Status Code: {response.status}")
            print(f"Response: {response.read().decode()}")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} {e.reason}")
        print(e.read().decode())
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if os.path.exists(filename):
            os.remove(filename)

if __name__ == "__main__":
    test_upload()
