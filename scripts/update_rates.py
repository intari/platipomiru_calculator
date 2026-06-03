#!/usr/bin/env python3
"""Обновляет data/rates.json курсами ЦБ РФ. Запускать локально перед деплоем."""
import requests
import xml.etree.ElementTree as ET
import json
from pathlib import Path

def fetch_cbr():
    url = "https://www.cbr.ru/scripts/XML_daily.asp"
    r = requests.get(url, timeout=10)
    r.encoding = "windows-1251"
    root = ET.fromstring(r.text)
    usd = eur = None
    for valute in root.findall("Valute"):
        code = valute.find("CharCode").text
        val = float(valute.find("Value").text.replace(",", "."))
        if code == "USD": usd = val
        if code == "EUR": eur = val
    return {"usd": usd, "eur": eur}

def main():
    rates = fetch_cbr()
    if not rates["usd"] or not rates["eur"]:
        print("Не удалось получить курсы")
        return 1

    data_dir = Path(__file__).parent.parent / "data"
    data_dir.mkdir(exist_ok=True)
    out = data_dir / "rates.json"

    from datetime import date
    payload = {"date": str(date.today()), "usd": rates["usd"], "eur": rates["eur"], "source": "cbr.ru"}
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Обновлено: USD={rates['usd']:.4f}, EUR={rates['eur']:.4f} → {out}")
    return 0

if __name__ == "__main__":
    exit(main())
