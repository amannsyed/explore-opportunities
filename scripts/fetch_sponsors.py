import requests
import csv
import json
import io
import re

GOV_UK_PAGE = "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers"

def get_csv_url():
    response = requests.get(GOV_UK_PAGE)
    response.raise_for_status()
    match = re.search(r'href="(https://assets\.publishing\.service\.gov\.uk[^"]+\.csv)"', response.text)
    if match:
        return match.group(1)
    raise ValueError("Could not find CSV download URL on GOV.UK page")

def fetch_and_convert():
    csv_url = get_csv_url()
    print(f"Fetching: {csv_url}")

    response = requests.get(csv_url)
    response.raise_for_status()

    reader = csv.DictReader(io.StringIO(response.text))
    sponsors = []

    for row in reader:
        cleaned = {
            k.strip(): (v.strip() if v.strip().upper() != "NULL" else "")
            for k, v in row.items()
        }
        sponsors.append(cleaned)

    with open("public/sponsors_list.json", "w", encoding="utf-8") as f:
        json.dump(sponsors, f, ensure_ascii=False, indent=2)

    print(f"Written {len(sponsors)} sponsors to public/sponsors_list.json")

fetch_and_convert()
