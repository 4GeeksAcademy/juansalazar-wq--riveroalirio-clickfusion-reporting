from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from models import db
from routes.auth import auth_bp
from routes.clients import clients_bp
from routes.reports import reports_bp
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuración base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///clickfusion.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key')

# Inicializar extensiones
db.init_app(app)
jwt = JWTManager(app)

# Registrar blueprints
app.register_blueprint(auth_bp)

app.register_blueprint(clients_bp)
app.register_blueprint(reports_bp)

# Crear tablas
with app.app_context():
    db.create_all()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "ClickFusion API funcionando!"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)