from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Client, Contact, User, ClientFieldConfig
from services.ghl_service import get_contacts_page
from services.reportei_service import get_integration_id, get_facebook_metrics, get_ga4_users_over_time
from datetime import datetime, timedelta
import json
import requests as req
import os

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
    date_start = request.args.get('date_start', f"{year}-01-01")
    date_end = request.args.get('date_end', f"{year}-12-31")
    saved = 0
    updated = 0
    start_after = None
    start_after_id = None
    while True:
        contacts, start_after, start_after_id = get_contacts_page(
            client.api_key, client.location_id, start_after, start_after_id, date_start, date_end)
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
                    id=c['id'], location_id=c['locationId'],
                    contact_name=c.get('contactName'), first_name=c.get('firstName'),
                    last_name=c.get('lastName'), email=c.get('email'),
                    phone=c.get('phone'), source=c.get('source'), type=c.get('type'),
                    tags=json.dumps(c.get('tags', [])),
                    date_added=datetime.fromisoformat(c['dateAdded'].replace('Z', '+00:00')) if c.get('dateAdded') else None,
                    date_updated=datetime.fromisoformat(c['dateUpdated'].replace('Z', '+00:00')) if c.get('dateUpdated') else None,
                    custom_fields=json.dumps(c.get('customFields', [])),
                    attributions=json.dumps(c.get('attributions', [])))
                db.session.add(new_contact)
                saved += 1
        db.session.commit()
        db.session.expire_all()
        if not start_after:
            break
    client.last_sync = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "Sincronizacion completada", "new_contacts_saved": saved, "contacts_updated": updated, "total": saved + updated}), 200


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
        source = c.source or 'Sin fuente'
        source_count[source] = source_count.get(source, 0) + 1
    daily_count = {}
    for c in contacts:
        if c.date_added:
            day = c.date_added.strftime('%Y-%m-%d')
            daily_count[day] = daily_count.get(day, 0) + 1
    return jsonify({"total_leads": len(contacts), "leads_by_tag": tags_count, "leads_by_source": source_count, "leads_by_day": daily_count}), 200


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
        return jsonify({"total_spend": metrics["spend"], "reach": metrics["reach"], "impressions": metrics["impressions"], "clicks": metrics["clicks"], "source": "reportei"}), 200
    except Exception as e:
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
        return jsonify({"values": [], "error": str(e)}), 200


@reports_bp.route('/api/clients/<int:client_id>/custom-fields', methods=['GET'])
@jwt_required()
def get_custom_fields(client_id):
    client = Client.query.get_or_404(client_id)
    contacts = Contact.query.filter_by(location_id=client.location_id).limit(500).all()
    fields_summary = {}
    for c in contacts:
        if not c.custom_fields:
            continue
        try:
            fields = json.loads(c.custom_fields)
            for f in fields:
                key = f.get('id') or f.get('key') or f.get('name', 'unknown')
                value = f.get('value', '')
                if not value:
                    continue
                if key not in fields_summary:
                    fields_summary[key] = {}
                val_str = str(value)
                fields_summary[key][val_str] = fields_summary[key].get(val_str, 0) + 1
        except:
            continue
    return jsonify(fields_summary), 200


@reports_bp.route('/api/clients/<int:client_id>/custom-fields-labels', methods=['GET'])
@jwt_required()
def get_custom_fields_labels(client_id):
    client = Client.query.get_or_404(client_id)
    try:
        res = req.get(
            f'https://services.leadconnectorhq.com/locations/{client.location_id}/customFields',
            headers={'Authorization': f'Bearer {client.api_key}', 'Version': '2021-07-28'},
            timeout=15)
        data = res.json()
        fields = data.get('customFields', [])
        result = {}
        for f in fields:
            result[f['id']] = f['name']
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@reports_bp.route('/api/clients/<int:client_id>/field-config', methods=['GET'])
@jwt_required()
def get_field_config(client_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if user.role != 'admin':
        return jsonify({"error": "No autorizado"}), 403
    configs = ClientFieldConfig.query.filter_by(client_id=client_id).order_by(ClientFieldConfig.position).all()
    return jsonify([{"id": c.id, "field_id": c.field_id, "field_label": c.field_label, "visible": c.visible, "position": c.position} for c in configs]), 200


@reports_bp.route('/api/clients/<int:client_id>/field-config', methods=['POST'])
@jwt_required()
def save_field_config(client_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if user.role != 'admin':
        return jsonify({"error": "No autorizado"}), 403
    data = request.get_json()
    fields = data.get('fields', [])
    for i, f in enumerate(fields):
        existing = ClientFieldConfig.query.filter_by(client_id=client_id, field_id=f['field_id']).first()
        if existing:
            existing.field_label = f['field_label']
            existing.visible = f['visible']
            existing.position = i
        else:
            new_config = ClientFieldConfig(
                client_id=client_id, field_id=f['field_id'],
                field_label=f['field_label'], visible=f['visible'], position=i)
            db.session.add(new_config)
    db.session.commit()
    return jsonify({"message": "Configuracion guardada"}), 200


@reports_bp.route('/api/clients/<int:client_id>/field-data', methods=['GET'])
@jwt_required()
def get_field_data(client_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    client = Client.query.get_or_404(client_id)
    if user.role != 'admin' and user.client_id != client.id:
        return jsonify({"error": "No autorizado"}), 403
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    configs = ClientFieldConfig.query.filter_by(client_id=client_id, visible=True).order_by(ClientFieldConfig.position).all()
    if not configs:
        return jsonify([]), 200
    query = Contact.query.filter_by(location_id=client.location_id)
    if start_date:
        query = query.filter(Contact.date_added >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Contact.date_added <= datetime.fromisoformat(end_date))
    contacts = query.all()
    result = []
    for config in configs:
        value_count = {}
        for c in contacts:
            if not c.custom_fields:
                continue
            try:
                fields = json.loads(c.custom_fields)
                for f in fields:
                    if f.get('id') == config.field_id:
                        value = f.get('value', '')
                        if not value:
                            continue
                        val_str = str(value).strip("[]'\" ")
                        for v in val_str.split("', '"):
                            v = v.strip("[]'\" ")
                            if v:
                                value_count[v] = value_count.get(v, 0) + 1
            except:
                continue
        if value_count:
            result.append({"field_id": config.field_id, "field_label": config.field_label, "values": dict(sorted(value_count.items(), key=lambda x: x[1], reverse=True))})
    return jsonify(result), 200

@reports_bp.route('/api/clients/<int:client_id>/ai-summary', methods=['POST'])
@jwt_required()
def ai_summary(client_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    client = Client.query.get_or_404(client_id)

    if user.role != 'admin' and user.client_id != client.id:
        return jsonify({"error": "No autorizado"}), 403

    data = request.get_json()
    metrics = data.get('metrics', {})
    fb_metrics = data.get('fb_metrics', {})
    field_data = data.get('field_data', [])

    current_month_data = data.get('current_month', {})
    current_month_leads = current_month_data.get('total_leads', 0)
    current_month_spend = current_month_data.get('total_spend', 0)

    prompt = f"""Eres un experto en marketing digital y bienes raíces. Analiza estos datos del proyecto {client.name} y da un resumen ejecutivo en español de máximo 200 palabras con los insights más importantes y 3 recomendaciones concretas.

DATOS DE LEADS (GHL) - PERÍODO FILTRADO:
- Total leads: {metrics.get('total_leads', 0)}
- Top fuentes: {list(metrics.get('leads_by_source', {}).items())[:5]}

MES EN CURSO:
- Leads este mes: {current_month_leads}
- Inversión este mes: ${current_month_spend:,.0f} COP

FACEBOOK ADS:
- Inversión total período: ${fb_metrics.get('total_spend', 0):,.0f} COP
- Alcance: {fb_metrics.get('reach', 0):,.0f}
- Clicks: {fb_metrics.get('clicks', 0):,.0f}
- CPL: ${fb_metrics.get('total_spend', 0) / max(metrics.get('total_leads', 1), 1):,.0f} COP

DATOS DE ENCUESTA:
{chr(10).join([f"- {f['field_label']}: {list(f['values'].items())[:3]}" for f in field_data[:4]])}

Da el análisis en formato claro con emojis, destacando el rendimiento del mes en curso vs el período total."""

    try:
        response = req.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {os.getenv("OPENROUTER_API_KEY")}',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://clickfusion-reporting.netlify.app',
            },
            json={
                'model': 'google/gemma-4-31b-it:free',
                'messages': [{'role': 'user', 'content': prompt}],
                'max_tokens': 500
            },
            timeout=30
        )
        result = response.json()
        summary = result['choices'][0]['message']['content']
        return jsonify({'summary': summary}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@reports_bp.route('/api/summary', methods=['GET'])
@jwt_required()
def get_global_summary():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if user.role != 'admin':
        return jsonify({"error": "No autorizado"}), 403

    clients = Client.query.filter_by(active=True).all()

    now = datetime.utcnow()
    first_day = f"{now.year}-{str(now.month).zfill(2)}-01"
    last_day = f"{now.year}-{str(now.month).zfill(2)}-{str((datetime(now.year, now.month % 12 + 1, 1) - timedelta(days=1)).day).zfill(2)}"

    total_leads = 0
    current_month_leads = 0

    for client in clients:
        contacts_total = Contact.query.filter_by(location_id=client.location_id).count()
        contacts_month = Contact.query.filter_by(location_id=client.location_id).filter(
            Contact.date_added >= datetime.fromisoformat(first_day)
        ).count()
        total_leads += contacts_total
        current_month_leads += contacts_month

    return jsonify({
        "total_leads": total_leads,
        "current_month_leads": current_month_leads,
        "total_clients": len(clients),
        "current_month": f"{now.strftime('%B')} {now.year}"
    }), 200



@reports_bp.route('/api/clients/<int:client_id>/export-csv', methods=['GET'])
@jwt_required()
def export_csv(client_id):
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

    contacts = query.order_by(Contact.date_added.desc()).all()

    rows = ['Fecha,Nombre,Email,Telefono,Fuente,Tags']
    for c in contacts:
        tags = ', '.join(json.loads(c.tags)) if c.tags else ''
        date = c.date_added.strftime('%Y-%m-%d') if c.date_added else ''
        name = (c.contact_name or '').replace(',', ' ')
        email = (c.email or '').replace(',', ' ')
        phone = (c.phone or '').replace(',', ' ')
        source = (c.source or '').replace(',', ' ')
        tags = tags.replace(',', ';')
        rows.append(f'{date},{name},{email},{phone},{source},{tags}')

    csv_content = '\n'.join(rows)

    from flask import Response
    return Response(
        csv_content,
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment;filename=leads_{client.name}_{start_date}_{end_date}.csv'}
    )