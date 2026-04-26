import requests

GHL_BASE_URL = "https://services.leadconnectorhq.com"

def get_contacts_page(api_key, location_id, start_after=None, start_after_id=None, date_start=None, date_end=None):
    """Trae UNA página de 100 contactos filtrada por fecha"""
    url = f"{GHL_BASE_URL}/contacts/"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Version": "2021-07-28"
    }
    params = {
        "locationId": location_id,
        "limit": 100
    }
    if start_after:
        params["startAfter"] = start_after
        params["startAfterId"] = start_after_id
    if date_start:
        params["startDate"] = date_start
    if date_end:
        params["endDate"] = date_end

    response = requests.get(url, headers=headers, params=params)
    data = response.json()

    contacts = data.get("contacts", [])
    meta = data.get("meta", {})

    next_start_after = meta.get("startAfter") if meta.get("nextPage") else None
    next_start_after_id = meta.get("startAfterId") if meta.get("nextPage") else None

    return contacts, next_start_after, next_start_after_id

def get_opportunities(api_key, location_id):
    url = f"{GHL_BASE_URL}/opportunities/search"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Version": "2021-07-28"
    }
    params = {"location_id": location_id}
    response = requests.get(url, headers=headers, params=params)
    return response.json()