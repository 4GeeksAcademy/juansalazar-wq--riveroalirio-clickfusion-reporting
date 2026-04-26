import requests
from datetime import datetime
import json

GHL_BASE_URL = "https://services.leadconnectorhq.com"

def get_all_contacts(api_key, location_id):
    url = f"{GHL_BASE_URL}/contacts/"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Version": "2021-07-28"
    }
    params = {
        "locationId": location_id,
        "limit": 100
    }
    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    return data.get("contacts", [])

def get_opportunities(api_key, location_id):
    url = f"{GHL_BASE_URL}/opportunities/search"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Version": "2021-07-28"
    }
    params = {"location_id": location_id}
    response = requests.get(url, headers=headers, params=params)
    return response.json()