from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Client, User

clients_bp = Blueprint('clients', __name__)

@clients_bp.route('/api/clients', methods=['GET'])
@jwt_required()
def get_clients():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({"error": "No autorizado"}), 403
    
    clients = Client.query.all()
    return jsonify([{
        "id": c.id,
        "name": c.name,
        "location_id": c.location_id,
        "active": c.active
    } for c in clients]), 200

@clients_bp.route('/api/clients', methods=['POST'])
@jwt_required()
def create_client():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({"error": "No autorizado"}), 403
    
    data = request.get_json()
    new_client = Client(
        name=data['name'],
        location_id=data['location_id'],
        api_key=data['api_key']
    )
    db.session.add(new_client)
    db.session.commit()
    
    return jsonify({"message": "Cliente creado", "id": new_client.id}), 201

@clients_bp.route('/api/clients/<int:id>', methods=['PUT'])
@jwt_required()
def update_client(id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({"error": "No autorizado"}), 403
    
    client = Client.query.get_or_404(id)
    data = request.get_json()
    
    client.name = data.get('name', client.name)
    client.location_id = data.get('location_id', client.location_id)
    client.api_key = data.get('api_key', client.api_key)
    client.active = data.get('active', client.active)
    
    db.session.commit()
    return jsonify({"message": "Cliente actualizado"}), 200

@clients_bp.route('/api/clients/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_client(id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({"error": "No autorizado"}), 403
    
    client = Client.query.get_or_404(id)
    db.session.delete(client)
    db.session.commit()
    return jsonify({"message": "Cliente eliminado"}), 200