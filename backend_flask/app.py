from flask import Flask
from flask_cors import CORS
from config import Config
from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.alerts import alerts_bp
from routes.reports import reports_bp
from routes.user import user_bp
from routes.evacuation import evacuation_bp
from routes.subscriptions import subscriptions_bp
from utils.db import close_db

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS for frontend integration
CORS(app)

from routes.admin import admin_bp

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(alerts_bp, url_prefix='/api/alerts')
app.register_blueprint(reports_bp, url_prefix='/api/reports')
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(evacuation_bp, url_prefix='/api/evacuation-centers')
app.register_blueprint(subscriptions_bp, url_prefix='/api/subscriptions')

# Teardown DB connection
app.teardown_appcontext(close_db)

@app.route('/')
def home():
    return {"message": "FloodGuard Flask Backend is Running!"}

if __name__ == '__main__':
    # Running on port 5000 by default. 
    # Use 'flask run' in production or gunicorn.
    app.run(debug=True, host='0.0.0.0', port=5000)
