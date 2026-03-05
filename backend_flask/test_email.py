import sys
from utils.email_service import send_credentials_email
import logging

logging.basicConfig(level=logging.INFO)

success, msg = send_credentials_email("test@example.com", "Test User", "TestPassword123")
print("Success:", success)
print("Message:", msg)
