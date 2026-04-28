import requests
import os

REPORTEI_BASE_URL = "https://app.reportei.com/api/v2"


def get_headers():
    token = os.environ.get("REPORTEI_API_TOKEN", "")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }


def get_integration_id(project_id, slug):
    url = f"{REPORTEI_BASE_URL}/integrations"
    params = {"project_id": project_id, "slug": slug}
    response = requests.get(url, headers=get_headers(), params=params, timeout=15)
    response.raise_for_status()
    data = response.json()
    integrations = data.get("data", [])
    if not integrations:
        return None
    return integrations[0].get("id")


def get_facebook_metrics(integration_id, start_date, end_date):
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
                "metrics": ["spend"]
            },
            {
                "id": "reach-metric",
                "reference_key": "fb_ads:reach",
                "component": "number_v1",
                "metrics": ["reach"]
            },
            {
                "id": "impressions-metric",
                "reference_key": "fb_ads:impressions",
                "component": "number_v1",
                "metrics": ["impressions"]
            },
            {
                "id": "clicks-metric",
                "reference_key": "fb_ads:clicks",
                "component": "number_v1",
                "metrics": ["clicks"]
            }
        ]
    }
    response = requests.post(url, headers=get_headers(), json=payload, timeout=15)
    response.raise_for_status()
    data = response.json().get("data", {})
    return {
        "spend": float(data.get("spend-metric", {}).get("values", 0) or 0),
        "reach": float(data.get("reach-metric", {}).get("values", 0) or 0),
        "impressions": float(data.get("impressions-metric", {}).get("values", 0) or 0),
        "clicks": float(data.get("clicks-metric", {}).get("values", 0) or 0),
    }


def get_ga4_users_over_time(integration_id, start_date, end_date):
    url = f"{REPORTEI_BASE_URL}/metrics/get-data"
    payload = {
        "start": start_date,
        "end": end_date,
        "integration_id": integration_id,
        "metrics": [
            {
                "id": "ga4-users",
                "reference_key": "google_analytics_4:users_over_time",
                "component": "chart_v1",
                "metrics": ["totalUsers"],
                "dimensions": ["date"]
            }
        ]
    }
    response = requests.post(url, headers=get_headers(), json=payload, timeout=15)
    response.raise_for_status()
    data = response.json().get("data", {})
    return data.get("ga4-users", {}).get("values", [])