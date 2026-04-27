import requests
import os

REPORTEI_BASE_URL = "https://app.reportei.com/api/v2"

def get_headers():
    return {
        "Authorization": f"Bearer {os.getenv('REPORTEI_API_TOKEN')}",
        "Content-Type": "application/json"
    }

def get_facebook_integration_id(project_id):
    url = f"{REPORTEI_BASE_URL}/integrations"
    params = {
        "project_id": project_id,
        "slug": "facebook_ads"
    }
    response = requests.get(url, headers=get_headers(), params=params, timeout=15)
    response.raise_for_status()
    data = response.json()

    integrations = data.get("data", [])
    if not integrations:
        return None

    return integrations[0]["id"]

def get_facebook_spend(integration_id, start_date, end_date):
    url = f"{REPORTEI_BASE_URL}/metrics/get-data"
    payload = {
        "start": start_date,
        "end": end_date,
        "integration_id": integration_id,
        "metrics": [
            {
                "id": "spend-metric",
                "reference_key": "fb_ads:spend",
                "component": "number_v1",
                "metrics": ["spend"],
                "type": ["spend"]
            }
        ]
    }
    response = requests.post(url, headers=get_headers(), json=payload, timeout=15)
    response.raise_for_status()
    data = response.json()

    spend = data.get("data", {}).get("spend-metric", {}).get("values", 0)
    return float(spend) if spend else 0.0