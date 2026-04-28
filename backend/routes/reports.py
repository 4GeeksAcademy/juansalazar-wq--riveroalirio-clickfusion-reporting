from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Client, Contact, User
from services.ghl_service import get_contacts_page
from services.reportei_service import get_integration_id, get_facebook_metrics, get_ga4_users_over_time
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

    year = request.args.get('year', datetime.utcnow().year, type=int)
    date_start = f"{year}-01-01"
    date_end = f"{year}-12-31"

    saved = 0
    updated = 0
    start_after = None
    start_after_id = None

    while True:
        contacts, start_after, start_after_id = get_contacts_page(
            client.api_key,
            client.location_id,
            start_after,
            start_after_id,
            date_start,
            date_end
        )

        if not contacts:
            break

        for c in contacts:
            existing = Contact.query.get(c['id'])

            if existing:
                existing.contact_name = c.get('contactName')
                existing.date_updated = datetime.fromisoformat(c['dateUpdated'].replace('Z', '+00:00')) if c.get('dateUpdated') else None
                existing.tags = json.dumps(c.get('tags', []))
                existing.custom_fields = json.dumps(c.get('customFields', []))
                existing.synced_at = datetime.utcnow()
                updated += 1
            else:
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
        db.session.expire_all()

        if not start_after:
            break

    client.last_sync = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "message": "Sincronización completada",
        "new_contacts_saved": saved,
        "contacts_updated": updated,
        "total": saved + updated
    }), 200


@reports_bp.route('/api/clients/<int:client_id>/metrics', methods=['GET'])
@jwt_required()
def get_metrics(client_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    client = Client.query.get_or_404(client_id)

    if user.role != 'admin' and user.client_id != client.id:
        return jsonify({"error": "No autorizado"}), 403

    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = Contact.query.filter_by(location_id=client.location_id)

    if start_date:
        query = query.filter(Contact.date_added >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Contact.date_added <= datetime.fromisoformat(end_date))

    contacts = query.all()

    tags_count = {}
    for c in contacts:
        tags = json.loads(c.tags) if c.tags else []
        for tag in tags:
            tags_count[tag] = tags_count.get(tag, 0) + 1

    source_count = {}
    for c in contacts:
        source = c.source or "Sin fuente"
        source_count[source] = source_count.get(source, 0) + 1

    daily_count = {}
    for c in contacts:
        if c.date_added:
            day = c.date_added.strftime('%Y-%m-%d')
            daily_count[day] = daily_count.get(day, 0) + 1

    return jsonify({
        "total_leads": len(contacts),
        "leads_by_tag": tags_count,
        "leads_by_source": source_count,
        "leads_by_day": daily_count
    }), 200


@reports_bp.route('/api/clients/<int:client_id>/investment', methods=['GET'])
@jwt_required()
def get_investment(client_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    client = Client.query.get_or_404(client_id)

    if user.role != 'admin' and user.client_id != client.id:
        return jsonify({"error": "No autorizado"}), 403

    start_date = request.args.get('start_date', '2026-01-01')
    end_date = request.args.get('end_date', '2026-04-30')

    if not client.reportei_project_id:
        return jsonify({"total_spend": 0, "source": "no_reportei"}), 200

    try:
        integration_id = get_integration_id(client.reportei_project_id, "facebook_ads")
        if not integration_id:
            return jsonify({"total_spend": 0, "source": "no_integration"}), 200

        metrics = get_facebook_metrics(integration_id, start_date, end_date)
        return jsonify({
            "total_spend": metrics["spend"],
            "reach": metrics["reach"],
            "impressions": metrics["impressions"],
            "clicks": metrics["clicks"],
            "source": "reportei"
        }), 200

    except Exception as e:
        print(f"❌ ERROR Reportei Facebook: {str(e)}")
        return jsonify({"total_spend": 0, "error": str(e)}), 200


@reports_bp.route('/api/clients/<int:client_id>/ga4', methods=['GET'])
@jwt_required()
def get_ga4(client_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    client = Client.query.get_or_404(client_id)

    if user.role != 'admin' and user.client_id != client.id:
        return jsonify({"error": "No autorizado"}), 403

    start_date = request.args.get('start_date', '2025-05-01')
    end_date = request.args.get('end_date', '2026-04-30')

    if not client.reportei_project_id:
        return jsonify({"values": [], "source": "no_reportei"}), 200

    try:
        integration_id = get_integration_id(client.reportei_project_id, "google_analytics_4")
        if not integration_id:
            return jsonify({"values": [], "source": "no_ga4"}), 200

        values = get_ga4_users_over_time(integration_id, start_date, end_date)
        return jsonify({"values": values, "source": "reportei"}), 200

    except Exception as e:
        print(f"❌ ERROR Reportei GA4: {str(e)}")
        return jsonify({"values": [], "error": str(e)}), 200