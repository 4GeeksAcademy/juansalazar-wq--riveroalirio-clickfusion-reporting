import requests

GHL_BASE_URL = "https://services.leadconnectorhq.com"

def get_all_contacts(api_key, location_id):
    """Trae TODOS los contactos paginando hasta el final"""
    all_contacts = []
    start_after = None
    start_after_id = None
    
    while True:
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
        
        response = requests.get(url, headers=headers, params=params)
        data = response.json()
        
        contacts = data.get("contacts", [])
        if not contacts:
            break
            
        all_contacts.extend(contacts)
        print(f"Jalados {len(all_contacts)} contactos hasta ahora...")
        
        meta = data.get("meta", {})
        if meta.get("nextPage"):
            start_after = meta.get("startAfter")
            start_after_id = meta.get("startAfterId")
        else:
            break
    
    return all_contacts

def get_opportunities(api_key, location_id):
    url = f"{GHL_BASE_URL}/opportunities/search"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Version": "2021-07-28"
    }
    params = {"location_id": location_id}
    response = requests.get(url, headers=headers, params=params)
    return response.json()