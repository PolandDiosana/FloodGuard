import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
PORT = int(os.getenv('MAIL_PORT', 587))
USERNAME = os.getenv('MAIL_USERNAME')
PASSWORD = os.getenv('MAIL_PASSWORD')
# Strip any spaces from the password (common in Google App Passwords)
if PASSWORD:
    PASSWORD = PASSWORD.replace(' ', '')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_credentials_email(to_email, full_name, password):
    """
    Sends an email to the user with their login credentials.
    """
    if not USERNAME or not PASSWORD:
        logging.error("Email credentials not configured.")
        return False, "Email server not configured"

    try:
        msg = MIMEMultipart()
        msg['From'] = USERNAME
        msg['To'] = to_email
        msg['Subject'] = "Your FloodGuard Account Credentials"

        body = f"""
        <html>
          <body>
            <h2>Welcome to FloodGuard, {full_name}!</h2>
            <p>Your account has been successfully created.</p>
            <p><strong>Username/Email:</strong> {to_email}</p>
            <p><strong>Temporary Password:</strong> {password}</p>
            <p>Please log in and change your password immediately.</p>
            <br>
            <p>Stay safe,</p>
            <p>The FloodGuard Team</p>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))

        logger.info(f"Attempting to connect to SMTP server: {SERVER}:{PORT}")
        logger.info(f"Using username: {USERNAME}")
        
        try:
            server = smtplib.SMTP(SERVER, PORT)
            server.set_debuglevel(1) # Enable SMTP debug output
            server.starttls()
            server.login(USERNAME, PASSWORD)
            server.send_message(msg)
            logger.info(f"Credentials sent to {to_email}")
        finally:
            try:
                server.quit()
            except Exception:
                pass # Ignore errors during quit
        
        logger.info(f"Credentials sent to {to_email}")
        return True, "Email sent successfully"
    
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error sending to {to_email}: {e}", exc_info=True)
        return False, f"SMTP Error: {str(e)}"
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}", exc_info=True)
        return False, f"Error: {str(e)}"
