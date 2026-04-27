from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

auth_bp = Blueprint('auth', __name__)

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
        role=data.get('role', 'viewer')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "Usuario creado exitosamente"}), 201

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
        "client_id": user.client_id   # 👈 ESTA ES LA CLAVE
    }
}), 200


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
        client_id=data['client_id']
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Usuario viewer creado", "id": new_user.id}), 201


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
