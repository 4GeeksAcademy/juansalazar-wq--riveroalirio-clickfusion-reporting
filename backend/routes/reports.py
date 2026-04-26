from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Client, Contact, User
from services.ghl_service import get_all_contacts
from datetime import datetime
import json

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/api/clients/<int:client_id>/sync', methods=['POST'])
@jwt_required()
def sync_contacts(client_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role != 'admin':
        return jsonify({"error": "No autorizado"}), 403
    
    client = Client.query.get_or_404(client_id)
    
    # Jalar todos los contactos de GHL
    contacts = get_all_contacts(client.api_key, client.location_id)
    
    # Guardar en BD
    saved = 0
    for c in contacts:
        existing = Contact.query.get(c['id'])
        if existing:
            # Actualizar si ya existe
            existing.contact_name = c.get('contactName')
            existing.date_updated = datetime.fromisoformat(c['dateUpdated'].replace('Z', '+00:00')) if c.get('dateUpdated') else None
            existing.tags = json.dumps(c.get('tags', []))
            existing.custom_fields = json.dumps(c.get('customFields', []))
            existing.synced_at = datetime.utcnow()
        else:
            # Crear nuevo
            new_contact = Contact(
                id=c['id'],
                location_id=c['locationId'],
                contact_name=c.get('contactName'),
                first_name=c.get('firstName'),
                last_name=c.get('lastName'),
                email=c.get('email'),
                phone=c.get('phone'),
                source=c.get('source'),
                type=c.get('type'),
                tags=json.dumps(c.get('tags', [])),
                date_added=datetime.fromisoformat(c['dateAdded'].replace('Z', '+00:00')) if c.get('dateAdded') else None,
                date_updated=datetime.fromisoformat(c['dateUpdated'].replace('Z', '+00:00')) if c.get('dateUpdated') else None,
                custom_fields=json.dumps(c.get('customFields', [])),
                attributions=json.dumps(c.get('attributions', []))
            )
            db.session.add(new_contact)
            saved += 1
    
    db.session.commit()
    
    return jsonify({
        "message": "Sincronización completada",
        "total_from_ghl": len(contacts),
        "new_contacts_saved": saved
    }), 200

@reports_bp.route('/api/clients/<int:client_id>/contacts', methods=['GET'])
@jwt_required()
def get_client_contacts(client_id):
    client = Client.query.get_or_404(client_id)
    
    # Filtros opcionales por fecha
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Contact.query.filter_by(location_id=client.location_id)
    
    if start_date:
        query = query.filter(Contact.date_added >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Contact.date_added <= datetime.fromisoformat(end_date))
    
    contacts = query.order_by(Contact.date_added.desc()).all()
    
    return jsonify({
        "total": len(contacts),
        "contacts": [{
            "id": c.id,
            "name": c.contact_name,
            "email": c.email,
            "phone": c.phone,
            "source": c.source,
            "tags": json.loads(c.tags) if c.tags else [],
            "date_added": c.date_added.isoformat() if c.date_added else None,
            "custom_fields": json.loads(c.custom_fields) if c.custom_fields else []
        } for c in contacts]
    }), 200