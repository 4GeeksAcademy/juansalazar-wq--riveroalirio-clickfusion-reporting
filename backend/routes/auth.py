from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, PasswordResetToken
from datetime import datetime
import resend
import os

auth_bp = Blueprint('auth', __name__)

# -------------------------
# REGISTER (opcional)
# -------------------------
@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "El email ya existe"}), 400

    hashed_password = generate_password_hash(data['password'])

    new_user = User(
        name=data['name'],
        email=data['email'],
        password=hashed_password,
        role=data.get('role', 'viewer'),
        client_id=data.get('client_id')  # 👈 importante
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Usuario creado exitosamente"}), 201


# -------------------------
# LOGIN
# -------------------------
@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()

    user = User.query.filter_by(email=data['email']).first()

    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({"error": "Credenciales inválidas"}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "client_id": user.client_id  # 🔥 CLAVE
        }
    }), 200


# -------------------------
# CREAR USUARIO VIEWER (solo admin)
# -------------------------
@auth_bp.route('/api/users', methods=['POST'])
@jwt_required()
def create_viewer():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)

    if admin.role != 'admin':
        return jsonify({"error": "No autorizado"}), 403

    data = request.get_json()

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "El email ya existe"}), 400

    new_user = User(
        name=data['name'],
        email=data['email'],
        password=generate_password_hash(data['password']),
        role='viewer',
        client_id=data.get('client_id')  # 🔥 CLAVE
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "Usuario viewer creado",
        "id": new_user.id
    }), 201

# -------------------------
# FORGOT PASSWORD
# -------------------------
@auth_bp.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email', '').strip().lower()

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "Si el email existe, recibirás un enlace en breve."}), 200

    reset_token = PasswordResetToken.create_for_user(user.id)

    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    reset_link = f"{frontend_url}?token={reset_token.token}"

    resend.api_key = os.getenv('RESEND_API_KEY')
    resend.Emails.send({
        "from": os.getenv('RESEND_FROM_EMAIL', 'onboarding@resend.dev'),
        "to": user.email,
        "subject": "Restablecer contraseña - ClickFusion",
        "html": f"""
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#1e293b;border-radius:12px;color:#f8fafc">
          <h2 style="color:#3b82f6;margin-bottom:8px">ClickFusion Reporting</h2>
          <p>Hola <strong>{user.name}</strong>,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. El enlace expira en <strong>30 minutos</strong>.</p>
          <a href="{reset_link}"
             style="display:inline-block;margin:24px 0;padding:12px 24px;background:#3b82f6;color:white;border-radius:8px;text-decoration:none;font-weight:bold">
            Restablecer contraseña
          </a>
          <p style="color:#94a3b8;font-size:13px">Si no solicitaste esto, ignora este mensaje.</p>
        </div>
        """
    })

    return jsonify({"message": "Si el email existe, recibirás un enlace en breve."}), 200


# -------------------------
# RESET PASSWORD
# -------------------------
@auth_bp.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token_value = data.get('token', '')
    new_password = data.get('password', '')

    if not token_value or not new_password:
        return jsonify({"error": "Token y contraseña son requeridos"}), 400

    if len(new_password) < 6:
        return jsonify({"error": "La contraseña debe tener al menos 6 caracteres"}), 400

    reset_token = PasswordResetToken.query.filter_by(token=token_value, used=False).first()

    if not reset_token:
        return jsonify({"error": "Token inválido o ya utilizado"}), 400

    if datetime.utcnow() > reset_token.expires_at:
        return jsonify({"error": "El enlace ha expirado. Solicita uno nuevo."}), 400

    user = User.query.get(reset_token.user_id)
    user.password = generate_password_hash(new_password)
    reset_token.used = True
    db.session.commit()

    return jsonify({"message": "Contraseña actualizada correctamente"}), 200

# -------------------------
# LISTAR USERS (solo admin)
# -------------------------
@auth_bp.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)

    if admin.role != 'admin':
        return jsonify({"error": "No autorizado"}), 403

    users = User.query.filter_by(role='viewer').all()

    return jsonify([{
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "client_id": u.client_id
    } for u in users]), 200